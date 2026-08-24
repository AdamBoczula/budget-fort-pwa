export type Transaction = {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
  accountId: string;
  comment?: string;
  subcategory?: string;
};
