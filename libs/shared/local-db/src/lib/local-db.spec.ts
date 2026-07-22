import {
  BUDGET_FORT_DB_STORES,
  LocalDbService,
  TRANSACTION_DB_TOKEN,
} from './local-db';

describe('LocalDbService', () => {
  it('should expose the shared store schema', () => {
    expect(BUDGET_FORT_DB_STORES[TRANSACTION_DB_TOKEN]).toEqual(
      'id,date,categoryId,accountId',
    );
  });

  it('should be created', () => {
    expect(new LocalDbService()).toBeTruthy();
  });
});
