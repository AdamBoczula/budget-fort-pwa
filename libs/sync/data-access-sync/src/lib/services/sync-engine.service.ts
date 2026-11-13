// spec: docs/specs/sync/01-firestore-sync.md

import { effect, inject, Injectable } from '@angular/core';
import { AuthService } from '@data-access-auth';
import {
  BUDGET_DB_TOKEN,
  BudgetFortStoreName,
  CATEGORY_BUDGET_DB_TOKEN,
  CATEGORY_DB_TOKEN,
  LocalDbService,
  SUBCATEGORY_DB_TOKEN,
  SyncableStoreName,
  TRANSACTION_DB_TOKEN,
} from 'local-db';
import { SyncState } from '../state/sync.state';
import { FirestoreSyncService } from './firestore-sync.service';
import { NetworkStatusService } from './network-status.service';
import { SyncQueueService } from './sync-queue.service';

export const LAST_SYNCED_STORAGE_KEY = 'bf_last_synced_at';

const SYNCABLE_STORES: SyncableStoreName[] = [
  'category',
  'subcategory',
  'transaction',
  'budget',
  'categoryBudget',
];

@Injectable({ providedIn: 'root' })
export class SyncEngineService {
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly syncQueue = inject(SyncQueueService);
  private readonly firestoreSync = inject(FirestoreSyncService);
  private readonly localDb = inject(LocalDbService);
  private readonly syncState = inject(SyncState);
  private readonly auth = inject(AuthService);

  private isRunning = false;

  constructor() {
    this.initLastSynced();

    effect(() => {
      const isOnline = this.networkStatus.isOnline();
      const isAuth = this.auth.isAuthenticated();
      const isGuest = this.auth.isGuest();

      if (isGuest) {
        this.syncState.setGuest();
        return;
      }

      if (!isOnline) {
        this.syncState.setOffline();
      } else if (isAuth) {
        this.syncNow().catch((err) => {
          console.error('[SyncEngine] Automatic sync failed:', err);
        });
      }
    });
  }

  private initLastSynced(): void {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(LAST_SYNCED_STORAGE_KEY);
      if (stored) {
        this.syncState.setLastSyncedAt(stored);
      }
    }
  }

  /**
   * Main synchronization loop: Pushes local changes to Firestore and pulls delta updates.
   */
  async syncNow(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    if (this.auth.isGuest()) {
      this.syncState.setGuest();
      return;
    }

    const user = this.auth.currentUser();
    if (!this.auth.isAuthenticated() || !user) {
      this.syncState.setIdle();
      return;
    }

    if (!this.networkStatus.isOnline()) {
      const pending = await this.syncQueue.getPendingCount();
      this.syncState.setPendingCount(pending);
      this.syncState.setOffline();
      return;
    }

    this.isRunning = true;
    this.syncState.setSyncing();

    try {
      // 1. Push local changes
      await this.pushPendingChanges(user.uid);

      // 2. Pull remote changes (Delta sync or Initial pull)
      const lastSynced = this.syncState.lastSyncedAt();
      if (!lastSynced) {
        await this.initialPull(user.uid);
      } else {
        await this.pullDeltaChanges(user.uid, lastSynced);
      }

      // 3. Update sync state
      const now = new Date().toISOString();
      this.syncState.setLastSyncedAt(now);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LAST_SYNCED_STORAGE_KEY, now);
      }

      const remainingPending = await this.syncQueue.getPendingCount();
      this.syncState.setPendingCount(remainingPending);
      this.syncState.setIdle();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Nieoczekiwany błąd synchronizacji';
      this.syncState.setError(msg);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Pushes all pending queue items in batches.
   */
  private async pushPendingChanges(userId: string): Promise<void> {
    const batchSize = 50;
    let items = await this.syncQueue.peek(batchSize);

    while (items.length > 0) {
      const processedIds = await this.firestoreSync.pushBatch(userId, items);
      if (processedIds.length > 0) {
        await this.syncQueue.removeMany(processedIds);
      } else {
        break; // If nothing was processed (e.g. error), prevent infinite loop
      }
      items = await this.syncQueue.peek(batchSize);
    }
  }

  /**
   * Performs an initial complete pull of user data when syncing for the first time.
   */
  async initialPull(userId: string): Promise<void> {
    const data = await this.firestoreSync.pullAll(userId);

    for (const store of SYNCABLE_STORES) {
      const remoteItems = data[store];
      if (remoteItems && remoteItems.length > 0) {
        const table = this.localDb.getTable(store);
        await table.bulkPut(remoteItems);
      }
    }
  }

  /**
   * Pulls remote changes using Delta Sync and applies Last-Write-Wins (LWW) conflict resolution.
   */
  private async pullDeltaChanges(userId: string, sinceTimestamp: string): Promise<void> {
    for (const store of SYNCABLE_STORES) {
      const changedDocs = await this.firestoreSync.pullChanges(userId, store, sinceTimestamp);

      if (changedDocs.length === 0) {
        continue;
      }

      const table = this.localDb.getTable<Record<string, unknown>, string>(store);

      for (const remote of changedDocs) {
        const id = remote['id'] as string;
        if (!id) {
          continue;
        }

        const local = await table.get(id);

        if (!local) {
          await table.put(remote);
        } else {
          // Last-Write-Wins (LWW)
          const localUpdated = String(local['updatedAt'] ?? '');
          const remoteUpdated = String(remote['updatedAt'] ?? '');

          if (remoteUpdated >= localUpdated) {
            await table.put(remote);
          }
        }
      }
    }
  }

  /**
   * Enqueues all existing local records for synchronization when a guest logs in.
   */
  async mergeGuestDataToCloud(): Promise<void> {
    const stores: Array<{ store: SyncableStoreName; token: BudgetFortStoreName }> = [
      { store: 'category', token: CATEGORY_DB_TOKEN },
      { store: 'subcategory', token: SUBCATEGORY_DB_TOKEN },
      { store: 'transaction', token: TRANSACTION_DB_TOKEN },
      { store: 'budget', token: BUDGET_DB_TOKEN },
      { store: 'categoryBudget', token: CATEGORY_BUDGET_DB_TOKEN },
    ];

    for (const { store, token } of stores) {
      const items = await this.localDb.getTable<Record<string, unknown>>(token).toArray();
      for (const item of items) {
        const id = String(item['id']);
        if (id) {
          await this.syncQueue.enqueue(store, id, 'upsert', item);
        }
      }
    }

    await this.syncNow();
  }
}
