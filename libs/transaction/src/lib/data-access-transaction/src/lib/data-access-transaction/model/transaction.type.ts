// spec: docs/specs/sync/01-firestore-sync.md

export type Transaction = {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
  accountId: string;
  comment?: string;
  subcategory?: string;
  recurringRuleId?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
};
