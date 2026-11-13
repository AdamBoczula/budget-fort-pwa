// spec: docs/specs/sync/01-firestore-sync.md

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
};
