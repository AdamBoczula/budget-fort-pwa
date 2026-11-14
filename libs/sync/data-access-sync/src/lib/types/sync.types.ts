// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md

export type {
  SyncableEntity,
  SyncOperationType,
  SyncableStoreName,
  SyncQueueItem,
  SyncStatus,
  SyncStateModel,
  Household,
  UserProfile,
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
