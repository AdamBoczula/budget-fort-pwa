// spec: docs/specs/sync/01-firestore-sync.md

export type {
  SyncableEntity,
  SyncOperationType,
  SyncableStoreName,
  SyncQueueItem,
  SyncStatus,
  SyncStateModel,
} from 'local-db';

export interface SyncBatchResult {
  successfulIds: string[];
  failedIds: string[];
  error?: string;
}

export interface SyncPullResult {
  store: string;
  items: Record<string, unknown>[];
  timestamp: string;
}
