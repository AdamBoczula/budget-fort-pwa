// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md

import { effect, inject, Injectable } from '@angular/core';
import { debounceTime } from 'rxjs';
import { AuthService } from '@data-access-auth';
import {
  BUDGET_DB_TOKEN,
  CATEGORY_BUDGET_DB_TOKEN,
  CATEGORY_DB_TOKEN,
  Household,
  LocalDbService,
  RECURRING_RULE_DB_TOKEN,
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
  'recurringRule',
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

    this.auth.onLogout$?.subscribe(async () => {
      this.syncState.reset();
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LAST_SYNCED_STORAGE_KEY);
      }
      await this.localDb.clearAllTables();
    });

    this.syncQueue.queued$?.pipe(debounceTime(300)).subscribe(() => {
      if (this.auth.isAuthenticated() && this.networkStatus.isOnline()) {
        this.syncNow().catch((err) => {
          console.error('[SyncEngine] Automatic sync on queue change failed:', err);
        });
      }
    });

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
   * Main synchronization loop: Pushes local changes to Firestore and pulls delta updates for the current household.
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
      // 0. Ensure household is resolved
      let household = this.syncState.currentHousehold();
      if (household && !household.members.includes(user.uid)) {
        household = null;
        this.syncState.setCurrentHousehold(null);
      }
      if (!household && this.firestoreSync.isAvailable()) {
        household = await this.firestoreSync.getOrCreateHousehold(user);
        this.syncState.setCurrentHousehold(household);
      }

      const householdId = household?.id ?? user.uid;

      // Update pending count before push
      const currentPending = await this.syncQueue.getPendingCount();
      this.syncState.setPendingCount(currentPending);

      // 1. Push local changes
      await this.pushPendingChanges(householdId);

      // 2. Pull remote changes (Delta sync or Initial pull)
      const lastSynced = this.syncState.lastSyncedAt();
      if (!lastSynced) {
        await this.initialPull(householdId);
      } else {
        await this.pullDeltaChanges(householdId, lastSynced);
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
   * Joins an existing household and immediately pulls shared budget data.
   */
  async joinHousehold(inviteCode: string): Promise<Household> {
    const user = this.auth.currentUser();
    if (!user) {
      throw new Error('Musisz być zalogowany, aby dołączyć do gospodarstwa domowego.');
    }

    const household = await this.firestoreSync.joinHouseholdByInviteCode(inviteCode, user);
    this.syncState.setCurrentHousehold(household);
    this.syncState.setLastSyncedAt('');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LAST_SYNCED_STORAGE_KEY);
    }

    await this.initialPull(household.id);
    await this.syncNow();
    return household;
  }

  /**
   * Pushes all pending queue items in batches.
   */
  private async pushPendingChanges(householdId: string): Promise<void> {
    const batchSize = 50;
    let items = await this.syncQueue.peek(batchSize);

    while (items.length > 0) {
      const processedIds = await this.firestoreSync.pushBatch(householdId, items);
      if (processedIds.length > 0) {
        for (const item of items) {
          if (processedIds.includes(item.id) && item.payload?.['updatedAt']) {
            try {
              const table = this.localDb.getTable(item.store);
              await table.update(item.entityId, { updatedAt: item.payload['updatedAt'] });
            } catch {
              // Ignore if record does not support update or was removed
            }
          }
        }
        await this.syncQueue.removeMany(processedIds);
      } else {
        break; // If nothing was processed (e.g. error), prevent infinite loop
      }
      items = await this.syncQueue.peek(batchSize);
    }
  }

  /**
   * Performs an initial complete pull of household data when syncing for the first time.
   */
  async initialPull(householdId: string): Promise<void> {
    const data = await this.firestoreSync.pullAll(householdId);
    let hasItems = false;

    for (const store of SYNCABLE_STORES) {
      const remoteItems = data[store];
      if (remoteItems && remoteItems.length > 0) {
        hasItems = true;
        const table = this.localDb.getTable(store);
        await table.bulkPut(remoteItems);
      }
    }

    if (hasItems) {
      this.syncState.notifyDataSynced();
    }
  }

  /**
   * Pulls remote changes using Delta Sync and applies Field-level Last-Write-Wins (LWW) conflict resolution.
   */
  private async pullDeltaChanges(householdId: string, sinceTimestamp: string): Promise<void> {
    let hasChanges = false;

    // Safety lookback margin (24 hours) to cover clock drift, offline queued batches,
    // and sync sequence races across multiple household members.
    const lookbackMs = 24 * 60 * 60 * 1000;
    const sinceTime = new Date(sinceTimestamp).getTime();
    const safeSince = !isNaN(sinceTime)
      ? new Date(Math.max(0, sinceTime - lookbackMs)).toISOString()
      : sinceTimestamp;

    for (const store of SYNCABLE_STORES) {
      const changedDocs = await this.firestoreSync.pullChanges(householdId, store, safeSince);

      if (changedDocs.length === 0) {
        continue;
      }
      hasChanges = true;

      const table = this.localDb.getTable<Record<string, unknown>, string>(store);

      for (const remote of changedDocs) {
        const id = remote['id'] as string;
        if (!id) {
          continue;
        }

        const local = await table.get(id);

        if (remote['isDeleted'] === true) {
          if (local) {
            await table.delete(id);
          }
          continue;
        }

        if (!local) {
          await table.put(remote);
        } else {
          // Field-level Last-Write-Wins (LWW)
          const localUpdated = String(local['updatedAt'] ?? '');
          const remoteUpdated = String(remote['updatedAt'] ?? '');

          if (remoteUpdated >= localUpdated) {
            await table.put({ ...local, ...remote });
          } else {
            await table.put({ ...remote, ...local });
          }
        }
      }
    }

    if (hasChanges) {
      this.syncState.notifyDataSynced();
    }
  }
}
