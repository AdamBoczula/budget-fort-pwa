// spec: docs/specs/budget/planowanie-budzetu.md
import {
  BUDGET_FORT_DB_STORES,
  CATEGORY_DB_TOKEN,
  LocalDbService,
  TRANSACTION_DB_TOKEN,
  BUDGET_DB_TOKEN,
  CATEGORY_BUDGET_DB_TOKEN,
} from './local-db';

describe('LocalDbService', () => {
  it('should expose the shared store schema', () => {
    expect(BUDGET_FORT_DB_STORES[TRANSACTION_DB_TOKEN]).toEqual(
      'id,date,categoryId,accountId,subcategory',
    );

    expect(BUDGET_FORT_DB_STORES[CATEGORY_DB_TOKEN]).toEqual('id,sortOrder,isHidden,name');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  it('should include budget store with "id" index', () => {
    expect(BUDGET_FORT_DB_STORES[BUDGET_DB_TOKEN]).toEqual('id');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  // covers: docs/specs/budget/planowanie-budzetu.md#AC-11
  it('should include categoryBudget store with "id,categoryId" indexes', () => {
    expect(BUDGET_FORT_DB_STORES[CATEGORY_BUDGET_DB_TOKEN]).toEqual('id,categoryId');
  });

  it('should be created', () => {
    expect(new LocalDbService()).toBeTruthy();
  });
});
