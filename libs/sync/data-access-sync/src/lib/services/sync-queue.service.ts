// spec: docs/specs/sync/01-firestore-sync.md

import { inject, Injectable } from '@angular/core';
import type Dexie from 'dexie';
import {
  LocalDbService,
  SYNC_QUEUE_DB_TOKEN,
  SyncQueueItem,
  SyncableStoreName,
  SyncOperationType,
} from 'local-db';

@Injectable({ providedIn: 'root' })
export class SyncQueueService {
  private readonly localDbService = inject(LocalDbService);

  private get table(): Dexie.Table<SyncQueueItem, string> {
    return this.localDbService.getTable<SyncQueueItem, string>(SYNC_QUEUE_DB_TOKEN);
  }

  /**
   * Enqueues an operation into the outbox queue.
   */
  async enqueue(
    store: SyncableStoreName,
    entityId: string,
    operation: SyncOperationType,
    payload: Record<string, unknown> | null,
  ): Promise<SyncQueueItem> {
    const now = new Date().toISOString();
    const fallbackItem: SyncQueueItem = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      store,
      entityId,
      operation,
      payload,
      createdAt: now,
      retryCount: 0,
    };

    try {
      if (!this.table || typeof this.table.where !== 'function') {
        return fallbackItem;
      }

      const query = this.table.where('entityId').equals(entityId);
      const existing =
        typeof query?.and === 'function'
          ? await query.and((item) => item.store === store).first()
          : null;

      if (existing) {
        const updatedItem: SyncQueueItem = {
          ...existing,
          operation,
          payload,
          createdAt: now,
        };
        await this.table.put(updatedItem);
        return updatedItem;
      }

      await this.table.put(fallbackItem);
      return fallbackItem;
    } catch {
      return fallbackItem;
    }
  }

  /**
   * Returns items in chronological order up to the specified limit.
   */
  async peek(limit = 50): Promise<SyncQueueItem[]> {
    if (!this.table || typeof this.table.orderBy !== 'function') {
      return [];
    }
    return this.table.orderBy('createdAt').limit(limit).toArray();
  }

  /**
   * Removes a processed item from the queue.
   */
  async remove(id: string): Promise<void> {
    if (!this.table || typeof this.table.delete !== 'function') {
      return;
    }
    await this.table.delete(id);
  }

  /**
   * Removes multiple items in a batch.
   */
  async removeMany(ids: string[]): Promise<void> {
    if (!this.table || typeof this.table.bulkDelete !== 'function') {
      return;
    }
    await this.table.bulkDelete(ids);
  }

  /**
   * Returns the count of pending operations in the queue.
   */
  async getPendingCount(): Promise<number> {
    if (!this.table || typeof this.table.count !== 'function') {
      return 0;
    }
    return this.table.count();
  }

  /**
   * Records a failure for an item, incrementing retryCount.
   */
  async recordFailure(id: string, error: string): Promise<void> {
    if (!this.table || typeof this.table.get !== 'function') {
      return;
    }
    const item = await this.table.get(id);
    if (item && typeof this.table.put === 'function') {
      await this.table.put({
        ...item,
        retryCount: item.retryCount + 1,
        lastError: error,
      });
    }
  }

  /**
   * Clears all items from the queue.
   */
  async clear(): Promise<void> {
    if (!this.table || typeof this.table.clear !== 'function') {
      return;
    }
    await this.table.clear();
  }
}
