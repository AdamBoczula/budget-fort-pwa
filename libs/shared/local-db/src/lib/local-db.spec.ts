// spec: docs/specs/sync/01-firestore-sync.md
import {
  BUDGET_FORT_DB_STORES,
  CATEGORY_DB_TOKEN,
  LocalDbService,
  TRANSACTION_DB_TOKEN,
  BUDGET_DB_TOKEN,
  CATEGORY_BUDGET_DB_TOKEN,
  SYNC_QUEUE_DB_TOKEN,
  BUDGET_FORT_DB_VERSION,
} from './local-db';

describe('LocalDbService', () => {
  // covers: docs/specs/sync/01-firestore-sync.md#AC-6
  it('should be configured with version 5', () => {
    expect(BUDGET_FORT_DB_VERSION).toBe(5);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-6
  it('should expose the shared store schema with audit fields', () => {
    expect(BUDGET_FORT_DB_STORES[TRANSACTION_DB_TOKEN]).toEqual(
      'id,date,categoryId,accountId,subcategory,updatedAt,isDeleted',
    );

    expect(BUDGET_FORT_DB_STORES[CATEGORY_DB_TOKEN]).toEqual(
      'id,sortOrder,isHidden,name,updatedAt,isDeleted',
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  // covers: docs/specs/sync/01-firestore-sync.md#AC-6
  it('should include budget store with "id,updatedAt,isDeleted" indexes', () => {
    expect(BUDGET_FORT_DB_STORES[BUDGET_DB_TOKEN]).toEqual('id,updatedAt,isDeleted');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  // covers: docs/specs/budget/planowanie-budzetu.md#AC-11
  // covers: docs/specs/sync/01-firestore-sync.md#AC-6
  it('should include categoryBudget store with "id,categoryId,updatedAt,isDeleted" indexes', () => {
    expect(BUDGET_FORT_DB_STORES[CATEGORY_BUDGET_DB_TOKEN]).toEqual(
      'id,categoryId,updatedAt,isDeleted',
    );
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-1
  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should include syncQueue store for outbox pattern', () => {
    expect(BUDGET_FORT_DB_STORES[SYNC_QUEUE_DB_TOKEN]).toEqual(
      'id,store,entityId,createdAt,retryCount',
    );
  });

  it('should be created', () => {
    expect(new LocalDbService()).toBeTruthy();
  });
});
