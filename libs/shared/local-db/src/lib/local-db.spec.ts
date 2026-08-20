import {
  BUDGET_FORT_DB_STORES,
  CATEGORY_DB_TOKEN,
  LocalDbService,
  TRANSACTION_DB_TOKEN,
} from './local-db';

describe('LocalDbService', () => {
  it('should expose the shared store schema', () => {
    expect(BUDGET_FORT_DB_STORES[TRANSACTION_DB_TOKEN]).toEqual(
      'id,date,categoryId,accountId',
    );

    expect(BUDGET_FORT_DB_STORES[CATEGORY_DB_TOKEN]).toEqual(
      'id,sortOrder,isHidden,name',
    );
  });

  it('should be created', () => {
    expect(new LocalDbService()).toBeTruthy();
  });
});
