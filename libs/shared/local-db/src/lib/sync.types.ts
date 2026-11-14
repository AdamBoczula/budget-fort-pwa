// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md

export interface SyncableEntity {
  id: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  householdId?: string;
}

export type SyncOperationType = 'upsert' | 'delete';

export type SyncableStoreName =
  'transaction' | 'category' | 'subcategory' | 'budget' | 'categoryBudget' | 'recurringRule';

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

export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  members: string[];
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  currentHouseholdId: string;
  updatedAt: string;
}

export interface SyncStateModel {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  errorMessage: string | null;
  currentHousehold: Household | null;
}
