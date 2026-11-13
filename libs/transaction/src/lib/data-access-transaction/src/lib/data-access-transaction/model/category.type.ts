// spec: docs/specs/sync/01-firestore-sync.md

export type TransactionType = 'expense' | 'income';

export type Category = {
  id: string;
  name: string;
  colorHex: string;
  icon: string;
  sortOrder: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  translationKey?: string;
  transactionType?: TransactionType;
  isDeleted?: boolean;
  deletedAt?: string;
};
