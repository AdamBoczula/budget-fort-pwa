// spec: docs/specs/sync/01-firestore-sync.md

export interface SyncableEntity {
  id: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export type SyncOperationType = 'upsert' | 'delete';

export type SyncableStoreName =
  'transaction' | 'category' | 'subcategory' | 'budget' | 'categoryBudget';

export interface SyncQueueItem {
  id: string;
  store: SyncableStoreName;
  entityId: string;
  operation: SyncOperationType;
  payload: Record<string, unknown> | null;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'guest';

export interface SyncStateModel {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  errorMessage: string | null;
}
