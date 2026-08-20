import { Injectable } from '@angular/core';
import Dexie from 'dexie';

export const BUDGET_FORT_DB_NAME = 'budget-fort-db';
export const BUDGET_FORT_DB_VERSION = 2;
export const TRANSACTION_DB_TOKEN = 'transaction';
export const CATEGORY_DB_TOKEN = 'category';

export const BUDGET_FORT_DB_STORES = {
  [TRANSACTION_DB_TOKEN]: 'id,date,categoryId,accountId',
  [CATEGORY_DB_TOKEN]: 'id,sortOrder,isHidden,name',
} as const;

export type BudgetFortStoreName = keyof typeof BUDGET_FORT_DB_STORES;

@Injectable({ providedIn: 'root' })
export class LocalDbService {
  private readonly database = this.createDatabase();

  public getDatabase(): Dexie {
    this.assertIndexedDbAvailable();
    return this.database;
  }

  public getTable<RecordType, KeyType = string>(
    tableName: BudgetFortStoreName,
  ) {
    this.assertIndexedDbAvailable();
    return this.database.table<RecordType, KeyType>(tableName);
  }

  private createDatabase(): Dexie {
    const database = new Dexie(BUDGET_FORT_DB_NAME);

    database.version(BUDGET_FORT_DB_VERSION).stores(BUDGET_FORT_DB_STORES);

    return database;
  }

  private assertIndexedDbAvailable(): void {
    if (!Dexie.dependencies.indexedDB) {
      throw new Error('IndexedDB is not available in the current environment.');
    }
  }
}
