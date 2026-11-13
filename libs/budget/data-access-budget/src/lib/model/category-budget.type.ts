// spec: docs/specs/sync/01-firestore-sync.md

export type CategoryBudget = {
  id?: number | string; // UUID (string) or legacy auto-increment (number)
  categoryId: string; // FK to category (string IDs in this app)
  categoryName: string; // denormalized for display convenience
  amount: number; // limit amount in PLN, ≥ 0, max 2 decimal places
  updatedAt: string; // ISO 8601 timestamp
  isDeleted?: boolean;
  deletedAt?: string;
};
