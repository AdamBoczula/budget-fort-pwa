// spec: docs/specs/settings/data-export-import.md

export interface BackupTransaction {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
  accountId: string;
  comment?: string;
  subcategory?: string;
}

export interface BackupCategory {
  id: string;
  name: string;
  colorHex?: string;
  icon?: string;
  sortOrder?: number;
  isHidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
  translationKey?: string;
  transactionType?: 'expense' | 'income';
}

export interface BackupSubcategory {
  id: string;
  categoryId: string;
  name: string;
}

export interface BackupBudget {
  id: number;
  amount: number;
  updatedAt: string;
}

export interface BackupCategoryBudget {
  id?: number;
  categoryId: string;
  categoryName?: string;
  amount: number;
  updatedAt: string;
}

export interface BackupSettings {
  currency: string | null;
  theme: string | null;
}

export interface BackupData {
  transactions: BackupTransaction[];
  categories: BackupCategory[];
  subcategories: BackupSubcategory[];
  budgets: BackupBudget[];
  categoryBudgets: BackupCategoryBudget[];
  settings: BackupSettings;
}

export interface BackupFileEnvelope {
  schemaVersion: 1;
  appVersion?: string;
  exportedAt: string;
  data: BackupData;
}

export type BackupValidationResult =
  | { isValid: true; data: BackupFileEnvelope }
  | { isValid: false; errorType: 'INVALID_FILE'; message: string; details?: string }
  | { isValid: false; errorType: 'INVALID_DATA'; message: string; details: string };
