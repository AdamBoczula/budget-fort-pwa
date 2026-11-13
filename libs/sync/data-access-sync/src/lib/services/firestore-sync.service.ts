// spec: docs/specs/sync/01-firestore-sync.md

import { inject, Injectable, InjectionToken } from '@angular/core';
import { getApps } from 'firebase/app';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { SyncableStoreName, SyncQueueItem } from 'local-db';

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

@Injectable({ providedIn: 'root' })
export class FirestoreSyncService {
  private readonly firestore = inject(FIREBASE_FIRESTORE, { optional: true });

  isAvailable(): boolean {
    return !!this.firestore;
  }

  /**
   * Pushes a batch of outbox queue items to Cloud Firestore.
   * Returns IDs of processed queue items upon success.
   */
  async pushBatch(userId: string, items: SyncQueueItem[]): Promise<string[]> {
    if (!this.firestore || !userId || items.length === 0) {
      return [];
    }

    const batch = writeBatch(this.firestore);
    const processedIds: string[] = [];

    for (const item of items) {
      const docRef = doc(this.firestore, `users/${userId}/${item.store}`, item.entityId);

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
    userId: string,
    store: SyncableStoreName,
    sinceTimestamp: string,
  ): Promise<Record<string, unknown>[]> {
    if (!this.firestore || !userId) {
      return [];
    }

    const colRef = collection(this.firestore, `users/${userId}/${store}`);
    const q = query(colRef, where('updatedAt', '>', sinceTimestamp));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  }

  /**
   * Fetches all documents across all stores for initial synchronization.
   */
  async pullAll(userId: string): Promise<Record<SyncableStoreName, Record<string, unknown>[]>> {
    const stores: SyncableStoreName[] = [
      'category',
      'subcategory',
      'transaction',
      'budget',
      'categoryBudget',
    ];

    const result: Record<SyncableStoreName, Record<string, unknown>[]> = {
      category: [],
      subcategory: [],
      transaction: [],
      budget: [],
      categoryBudget: [],
    };

    if (!this.firestore || !userId) {
      return result;
    }

    for (const store of stores) {
      const colRef = collection(this.firestore, `users/${userId}/${store}`);
      const snapshot = await getDocs(colRef);
      result[store] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    }

    return result;
  }
}
