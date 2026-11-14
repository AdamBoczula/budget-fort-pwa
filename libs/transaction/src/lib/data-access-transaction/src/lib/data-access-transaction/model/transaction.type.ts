// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md

export type Transaction = {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
  accountId: string;
  comment?: string;
  subcategory?: string;
  recurringRuleId?: string;
  householdId?: string;
  authorId?: string;
  authorName?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
};
