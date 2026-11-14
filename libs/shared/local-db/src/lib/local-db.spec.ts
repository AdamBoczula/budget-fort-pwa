// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/transaction/recurring-transactions.md
// spec: docs/specs/sync/02-multi-user-household.md
import {
  BUDGET_FORT_DB_STORES,
  CATEGORY_DB_TOKEN,
  LocalDbService,
  TRANSACTION_DB_TOKEN,
  BUDGET_DB_TOKEN,
  CATEGORY_BUDGET_DB_TOKEN,
  SYNC_QUEUE_DB_TOKEN,
  RECURRING_RULE_DB_TOKEN,
  BUDGET_FORT_DB_VERSION,
} from './local-db';

describe('LocalDbService', () => {
  // covers: docs/specs/sync/01-firestore-sync.md#AC-6
  // covers: docs/specs/transaction/recurring-transactions.md#AC-2
  // covers: docs/specs/sync/02-multi-user-household.md#AC-1
  it('should be configured with version 7', () => {
    expect(BUDGET_FORT_DB_VERSION).toBe(7);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-6
  // covers: docs/specs/transaction/recurring-transactions.md#AC-2
  // covers: docs/specs/sync/02-multi-user-household.md#AC-2
  it('should expose the shared store schema with householdId and authorId indexes', () => {
    expect(BUDGET_FORT_DB_STORES[TRANSACTION_DB_TOKEN]).toEqual(
      'id,date,categoryId,accountId,subcategory,recurringRuleId,householdId,authorId,updatedAt,isDeleted',
    );

    expect(BUDGET_FORT_DB_STORES[CATEGORY_DB_TOKEN]).toEqual(
      'id,sortOrder,isHidden,name,householdId,updatedAt,isDeleted',
    );
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-2
  // covers: docs/specs/sync/02-multi-user-household.md#AC-2
  it('should include recurringRule store with appropriate indexes', () => {
    expect(BUDGET_FORT_DB_STORES[RECURRING_RULE_DB_TOKEN]).toEqual(
      'id,categoryId,dayOfMonth,isActive,lastGeneratedMonth,householdId,updatedAt,isDeleted',
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  // covers: docs/specs/sync/01-firestore-sync.md#AC-6
  // covers: docs/specs/sync/02-multi-user-household.md#AC-2
  it('should include budget store with "id,householdId,updatedAt,isDeleted" indexes', () => {
    expect(BUDGET_FORT_DB_STORES[BUDGET_DB_TOKEN]).toEqual('id,householdId,updatedAt,isDeleted');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  // covers: docs/specs/budget/planowanie-budzetu.md#AC-11
  // covers: docs/specs/sync/01-firestore-sync.md#AC-6
  // covers: docs/specs/sync/02-multi-user-household.md#AC-2
  it('should include categoryBudget store with "id,categoryId,householdId,updatedAt,isDeleted" indexes', () => {
    expect(BUDGET_FORT_DB_STORES[CATEGORY_BUDGET_DB_TOKEN]).toEqual(
      'id,categoryId,householdId,updatedAt,isDeleted',
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
