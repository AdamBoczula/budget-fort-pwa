// spec: docs/specs/sync/01-firestore-sync.md

export type Budget = {
  id: number | string; // 'default' (string) or 1 (number) for backwards compatibility
  amount: number; // amount in PLN, ≥ 0, max 2 decimal places
  updatedAt: string; // ISO 8601 timestamp
  isDeleted?: boolean;
  deletedAt?: string;
};
