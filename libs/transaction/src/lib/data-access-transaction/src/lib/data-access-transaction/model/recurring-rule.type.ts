// spec: docs/specs/transaction/recurring-transactions.md

export interface RecurringTransactionRule {
  id: string;
  amount: number;
  categoryId: string;
  accountId: string;
  dayOfMonth: number;
  startDate: string;
  lastGeneratedMonth: string;
  isActive: boolean;
  comment?: string;
  subcategory?: string;
  endDate?: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  householdId?: string;
}

export function getRecurringTransactionId(ruleId: string, yearMonth: string): string {
  return `rec_${ruleId}_${yearMonth}`;
}
