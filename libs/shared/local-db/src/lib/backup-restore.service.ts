// spec: docs/specs/settings/data-export-import.md

import { inject, Injectable } from '@angular/core';
import {
  BUDGET_DB_TOKEN,
  CATEGORY_BUDGET_DB_TOKEN,
  CATEGORY_DB_TOKEN,
  LocalDbService,
  SUBCATEGORY_DB_TOKEN,
  TRANSACTION_DB_TOKEN,
} from './local-db';
import { LocalStorageService } from './local-storage.service';
import {
  BackupCategory,
  BackupCategoryBudget,
  BackupFileEnvelope,
  BackupSubcategory,
  BackupTransaction,
  BackupValidationResult,
} from './backup-restore.types';
import { BackupRestoreValidator } from './backup-restore.validator';

export const BACKUP_CURRENCY_STORAGE_KEY = 'budget-fort.currency';
export const BACKUP_THEME_STORAGE_KEY = 'budget-fort.theme';

@Injectable({ providedIn: 'root' })
export class BackupRestoreService {
  private readonly localDb: LocalDbService;
  private readonly localStorage: LocalStorageService;

  constructor(localDb?: LocalDbService, localStorage?: LocalStorageService) {
    this.localDb = localDb ?? inject(LocalDbService);
    this.localStorage = localStorage ?? inject(LocalStorageService);
  }

  public async exportBackup(): Promise<BackupFileEnvelope> {
    const db = this.localDb.getDatabase();

    const [transactions, categories, subcategories, budgets, categoryBudgets] = await Promise.all([
      db.table<BackupTransaction>(TRANSACTION_DB_TOKEN).toArray(),
      db.table<BackupCategory>(CATEGORY_DB_TOKEN).toArray(),
      db.table<BackupSubcategory>(SUBCATEGORY_DB_TOKEN).toArray(),
      db.table(BUDGET_DB_TOKEN).toArray(),
      db.table<BackupCategoryBudget>(CATEGORY_BUDGET_DB_TOKEN).toArray(),
    ]);

    const currency = this.localStorage.getItem(BACKUP_CURRENCY_STORAGE_KEY);
    const theme = this.localStorage.getItem(BACKUP_THEME_STORAGE_KEY);

    const backupEnvelope: BackupFileEnvelope = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        transactions: transactions ?? [],
        categories: categories ?? [],
        subcategories: subcategories ?? [],
        budgets: budgets ?? [],
        categoryBudgets: categoryBudgets ?? [],
        settings: {
          currency: currency ?? null,
          theme: theme ?? null,
        },
      },
    };

    return backupEnvelope;
  }

  public validateBackupFile(raw: unknown): BackupValidationResult {
    return BackupRestoreValidator.validate(raw);
  }

  public async restoreBackup(envelope: BackupFileEnvelope): Promise<void> {
    const db = this.localDb.getDatabase();
    const { data } = envelope;

    await db.transaction(
      'rw',
      [
        TRANSACTION_DB_TOKEN,
        CATEGORY_DB_TOKEN,
        SUBCATEGORY_DB_TOKEN,
        BUDGET_DB_TOKEN,
        CATEGORY_BUDGET_DB_TOKEN,
      ],
      async () => {
        await Promise.all([
          db.table(TRANSACTION_DB_TOKEN).clear(),
          db.table(CATEGORY_DB_TOKEN).clear(),
          db.table(SUBCATEGORY_DB_TOKEN).clear(),
          db.table(BUDGET_DB_TOKEN).clear(),
          db.table(CATEGORY_BUDGET_DB_TOKEN).clear(),
        ]);

        if (data.transactions.length > 0) {
          await db.table(TRANSACTION_DB_TOKEN).bulkAdd(data.transactions);
        }
        if (data.categories.length > 0) {
          await db.table(CATEGORY_DB_TOKEN).bulkAdd(data.categories);
        }
        if (data.subcategories.length > 0) {
          await db.table(SUBCATEGORY_DB_TOKEN).bulkAdd(data.subcategories);
        }
        if (data.budgets.length > 0) {
          await db.table(BUDGET_DB_TOKEN).bulkAdd(data.budgets);
        }
        if (data.categoryBudgets.length > 0) {
          await db.table(CATEGORY_BUDGET_DB_TOKEN).bulkAdd(data.categoryBudgets);
        }
      },
    );

    if (data.settings.currency) {
      this.localStorage.setItem(BACKUP_CURRENCY_STORAGE_KEY, data.settings.currency);
    }
    if (data.settings.theme) {
      this.localStorage.setItem(BACKUP_THEME_STORAGE_KEY, data.settings.theme);
    }
  }

  public downloadBackupFile(envelope: BackupFileEnvelope, filename?: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    const jsonString = JSON.stringify(envelope, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().slice(0, 10);
    const resolvedFilename = filename || `budget-fort-backup-${dateStr}.json`;

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = resolvedFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
