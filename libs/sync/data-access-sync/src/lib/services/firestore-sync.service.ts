// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md

import { inject, Injectable, InjectionToken } from '@angular/core';
import { getApps } from 'firebase/app';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Household, SyncableStoreName, SyncQueueItem, UserProfile } from 'local-db';

export const FIREBASE_FIRESTORE = new InjectionToken<Firestore>('FIREBASE_FIRESTORE', {
  providedIn: 'root',
  factory: () => {
    if (typeof window === 'undefined') {
      return undefined as unknown as Firestore;
    }
    const apps = getApps();
    if (apps.length > 0) {
      return getFirestore(apps[0]);
    }
    return undefined as unknown as Firestore;
  },
});

export interface UserAuthData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

@Injectable({ providedIn: 'root' })
export class FirestoreSyncService {
  private readonly firestore = inject(FIREBASE_FIRESTORE, { optional: true });

  isAvailable(): boolean {
    return !!this.firestore;
  }

  /**
   * Pushes a batch of outbox queue items to Cloud Firestore under /households/{householdId}/*.
   * Returns IDs of processed queue items upon success.
   */
  async pushBatch(householdId: string, items: SyncQueueItem[]): Promise<string[]> {
    if (!this.firestore || !householdId || items.length === 0) {
      return [];
    }

    const batch = writeBatch(this.firestore);
    const processedIds: string[] = [];

    for (const item of items) {
      const docRef = doc(this.firestore, `households/${householdId}/${item.store}`, item.entityId);

      if (item.operation === 'upsert' && item.payload) {
        batch.set(docRef, item.payload, { merge: true });
        processedIds.push(item.id);
      } else if (item.operation === 'delete') {
        const deletedAt = new Date().toISOString();
        batch.set(
          docRef,
          {
            id: item.entityId,
            isDeleted: true,
            deletedAt,
            updatedAt: deletedAt,
          },
          { merge: true },
        );
        processedIds.push(item.id);
      }
    }

    await batch.commit();
    return processedIds;
  }

  /**
   * Fetches changed documents from Cloud Firestore since the specified timestamp (Delta Pull).
   */
  async pullChanges(
    householdId: string,
    store: SyncableStoreName,
    sinceTimestamp: string,
  ): Promise<Record<string, unknown>[]> {
    if (!this.firestore || !householdId) {
      return [];
    }

    const colRef = collection(this.firestore, `households/${householdId}/${store}`);
    const q = query(colRef, where('updatedAt', '>', sinceTimestamp));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  }

  /**
   * Fetches all documents across all stores for initial synchronization of the household.
   */
  async pullAll(
    householdId: string,
  ): Promise<Record<SyncableStoreName, Record<string, unknown>[]>> {
    const stores: SyncableStoreName[] = [
      'category',
      'subcategory',
      'transaction',
      'budget',
      'categoryBudget',
      'recurringRule',
    ];

    const result: Record<SyncableStoreName, Record<string, unknown>[]> = {
      category: [],
      subcategory: [],
      transaction: [],
      budget: [],
      categoryBudget: [],
      recurringRule: [],
    };

    if (!this.firestore || !householdId) {
      return result;
    }

    for (const store of stores) {
      const colRef = collection(this.firestore, `households/${householdId}/${store}`);
      const snapshot = await getDocs(colRef);
      result[store] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    }

    return result;
  }

  /**
   * Fetches a household document by ID.
   */
  async getHousehold(householdId: string): Promise<Household | null> {
    if (!this.firestore || !householdId) {
      return null;
    }
    const docRef = doc(this.firestore, 'households', householdId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as Household;
  }

  /**
   * Retrieves or creates a default household for the authenticated user.
   */
  async getOrCreateHousehold(user: UserAuthData): Promise<Household> {
    if (!this.firestore) {
      throw new Error('Firestore is not available');
    }

    const now = new Date().toISOString();

    // 1. Check user profile for existing household ID
    const userRef = doc(this.firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const profile = userSnap.data() as UserProfile;
      if (profile.currentHouseholdId) {
        const household = await this.getHousehold(profile.currentHouseholdId);
        if (household && household.members.includes(user.uid)) {
          return household;
        }
      }
    }

    // 2. Check if a household with ID = user.uid already exists
    const existingDefault = await this.getHousehold(user.uid);
    if (existingDefault) {
      if (!existingDefault.members.includes(user.uid)) {
        existingDefault.members.push(user.uid);
        await updateDoc(doc(this.firestore, 'households', user.uid), {
          members: existingDefault.members,
          updatedAt: now,
        });
      }
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          photoURL: user.photoURL ?? null,
          currentHouseholdId: user.uid,
          updatedAt: now,
        },
        { merge: true },
      );
      return existingDefault;
    }

    // 3. Create a brand new household
    const newHousehold: Household = {
      id: user.uid,
      name: 'Budżet Domowy',
      ownerUid: user.uid,
      members: [user.uid],
      inviteCode: this.generateInviteCode(),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await setDoc(doc(this.firestore, 'households', user.uid), newHousehold);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        currentHouseholdId: user.uid,
        updatedAt: now,
      },
      { merge: true },
    );

    return newHousehold;
  }

  /**
   * Joins an existing household using a 6-character invite code.
   */
  async joinHouseholdByInviteCode(inviteCode: string, user: UserAuthData): Promise<Household> {
    if (!this.firestore) {
      throw new Error('Firestore is not available');
    }

    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      throw new Error('Kod zaproszenia nie może być pusty.');
    }

    const householdsRef = collection(this.firestore, 'households');
    const q = query(householdsRef, where('inviteCode', '==', code));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Nie znaleziono gospodarstwa domowego dla podanego kodu.');
    }

    const targetDoc = snapshot.docs[0];
    const household = targetDoc.data() as Household;
    const now = new Date().toISOString();

    if (!household.members.includes(user.uid)) {
      household.members.push(user.uid);
      await updateDoc(targetDoc.ref, {
        members: household.members,
        updatedAt: now,
      });
    }

    // Update user profile with currentHouseholdId
    const userRef = doc(this.firestore, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        currentHouseholdId: household.id,
        updatedAt: now,
      },
      { merge: true },
    );

    return household;
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BF';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
