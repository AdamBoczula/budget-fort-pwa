// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/transaction/recurring-transactions.md
// spec: docs/specs/sync/02-multi-user-household.md
import { Injectable } from '@angular/core';
import Dexie from 'dexie';

export const BUDGET_FORT_DB_NAME = 'budget-fort-db';
export const BUDGET_FORT_DB_VERSION = 7;
export const TRANSACTION_DB_TOKEN = 'transaction';
export const CATEGORY_DB_TOKEN = 'category';
export const SUBCATEGORY_DB_TOKEN = 'subcategory';
export const BUDGET_DB_TOKEN = 'budget';
export const CATEGORY_BUDGET_DB_TOKEN = 'categoryBudget';
export const SYNC_QUEUE_DB_TOKEN = 'syncQueue';
export const RECURRING_RULE_DB_TOKEN = 'recurringRule';

export const BUDGET_FORT_DB_STORES_V4 = {
  [TRANSACTION_DB_TOKEN]: 'id,date,categoryId,accountId,subcategory',
  [CATEGORY_DB_TOKEN]: 'id,sortOrder,isHidden,name',
  [SUBCATEGORY_DB_TOKEN]: 'id,categoryId,name',
  [BUDGET_DB_TOKEN]: 'id',
  [CATEGORY_BUDGET_DB_TOKEN]: 'id,categoryId',
} as const;

export const BUDGET_FORT_DB_STORES_V5 = {
  [TRANSACTION_DB_TOKEN]: 'id,date,categoryId,accountId,subcategory,updatedAt,isDeleted',
  [CATEGORY_DB_TOKEN]: 'id,sortOrder,isHidden,name,updatedAt,isDeleted',
  [SUBCATEGORY_DB_TOKEN]: 'id,categoryId,name,updatedAt,isDeleted',
  [BUDGET_DB_TOKEN]: 'id,updatedAt,isDeleted',
  [CATEGORY_BUDGET_DB_TOKEN]: 'id,categoryId,updatedAt,isDeleted',
  [SYNC_QUEUE_DB_TOKEN]: 'id,store,entityId,createdAt,retryCount',
} as const;

export const BUDGET_FORT_DB_STORES_V6 = {
  [TRANSACTION_DB_TOKEN]:
    'id,date,categoryId,accountId,subcategory,recurringRuleId,updatedAt,isDeleted',
  [CATEGORY_DB_TOKEN]: 'id,sortOrder,isHidden,name,updatedAt,isDeleted',
  [SUBCATEGORY_DB_TOKEN]: 'id,categoryId,name,updatedAt,isDeleted',
  [BUDGET_DB_TOKEN]: 'id,updatedAt,isDeleted',
  [CATEGORY_BUDGET_DB_TOKEN]: 'id,categoryId,updatedAt,isDeleted',
  [SYNC_QUEUE_DB_TOKEN]: 'id,store,entityId,createdAt,retryCount',
  [RECURRING_RULE_DB_TOKEN]:
    'id,categoryId,dayOfMonth,isActive,lastGeneratedMonth,updatedAt,isDeleted',
} as const;

export const BUDGET_FORT_DB_STORES = {
  [TRANSACTION_DB_TOKEN]:
    'id,date,categoryId,accountId,subcategory,recurringRuleId,householdId,authorId,updatedAt,isDeleted',
  [CATEGORY_DB_TOKEN]: 'id,sortOrder,isHidden,name,householdId,updatedAt,isDeleted',
  [SUBCATEGORY_DB_TOKEN]: 'id,categoryId,name,householdId,updatedAt,isDeleted',
  [BUDGET_DB_TOKEN]: 'id,householdId,updatedAt,isDeleted',
  [CATEGORY_BUDGET_DB_TOKEN]: 'id,categoryId,householdId,updatedAt,isDeleted',
  [SYNC_QUEUE_DB_TOKEN]: 'id,store,entityId,createdAt,retryCount',
  [RECURRING_RULE_DB_TOKEN]:
    'id,categoryId,dayOfMonth,isActive,lastGeneratedMonth,householdId,updatedAt,isDeleted',
} as const;

export type BudgetFortStoreName = keyof typeof BUDGET_FORT_DB_STORES;

@Injectable({ providedIn: 'root' })
export class LocalDbService {
  private readonly database = this.createDatabase();

  public getDatabase(): Dexie {
    this.assertIndexedDbAvailable();
    return this.database;
  }

  public getTable<RecordType, KeyType = string>(tableName: BudgetFortStoreName) {
    this.assertIndexedDbAvailable();
    return this.database.table<RecordType, KeyType>(tableName);
  }

  private createDatabase(): Dexie {
    const database = new Dexie(BUDGET_FORT_DB_NAME);

    database.version(4).stores(BUDGET_FORT_DB_STORES_V4);

    database
      .version(5)
      .stores(BUDGET_FORT_DB_STORES_V5)
      .upgrade(async (tx) => {
        const now = new Date().toISOString();

        await tx
          .table(BUDGET_DB_TOKEN)
          .toCollection()
          .modify((budget: Record<string, unknown>) => {
            budget['updatedAt'] = budget['updatedAt'] ?? now;
            budget['isDeleted'] = budget['isDeleted'] ?? false;
          });

        await tx
          .table(CATEGORY_BUDGET_DB_TOKEN)
          .toCollection()
          .modify((cb: Record<string, unknown>) => {
            cb['updatedAt'] = cb['updatedAt'] ?? now;
            cb['isDeleted'] = cb['isDeleted'] ?? false;
          });

        await tx
          .table(TRANSACTION_DB_TOKEN)
          .toCollection()
          .modify((t: Record<string, unknown>) => {
            t['updatedAt'] = t['updatedAt'] ?? now;
            t['isDeleted'] = t['isDeleted'] ?? false;
          });

        await tx
          .table(CATEGORY_DB_TOKEN)
          .toCollection()
          .modify((c: Record<string, unknown>) => {
            c['updatedAt'] = c['updatedAt'] ?? now;
            c['isDeleted'] = c['isDeleted'] ?? false;
          });

        await tx
          .table(SUBCATEGORY_DB_TOKEN)
          .toCollection()
          .modify((s: Record<string, unknown>) => {
            s['updatedAt'] = s['updatedAt'] ?? now;
            s['isDeleted'] = s['isDeleted'] ?? false;
          });
      });

    database.version(6).stores(BUDGET_FORT_DB_STORES_V6);

    database
      .version(BUDGET_FORT_DB_VERSION)
      .stores(BUDGET_FORT_DB_STORES)
      .upgrade(async (tx) => {
        const defaultHouseholdId = 'local';
        const tables = [
          TRANSACTION_DB_TOKEN,
          CATEGORY_DB_TOKEN,
          SUBCATEGORY_DB_TOKEN,
          BUDGET_DB_TOKEN,
          CATEGORY_BUDGET_DB_TOKEN,
          RECURRING_RULE_DB_TOKEN,
        ];

        for (const tableName of tables) {
          await tx
            .table(tableName)
            .toCollection()
            .modify((record: Record<string, unknown>) => {
              record['householdId'] = record['householdId'] ?? defaultHouseholdId;
            });
        }
      });

    return database;
  }

  private assertIndexedDbAvailable(): void {
    if (!Dexie.dependencies.indexedDB) {
      throw new Error('IndexedDB is not available in the current environment.');
    }
  }
}
