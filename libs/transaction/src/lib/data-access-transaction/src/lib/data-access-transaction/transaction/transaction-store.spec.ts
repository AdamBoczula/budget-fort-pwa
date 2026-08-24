import { TestBed } from '@angular/core/testing';
import { LocalDbService } from 'local-db';
import { firstValueFrom, of } from 'rxjs';
import { Transaction } from '../model/transaction.type';

import { TransactionStore } from './transaction-store';

describe('TransactionStore', () => {
  let service: TransactionStore;
  let mockTable: {
    toArray: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    bulkPut: ReturnType<typeof vi.fn>;
  };

  const mockDb = {
    transaction: vi.fn().mockReturnThis(),
    table: vi.fn().mockReturnThis(),
  };

  const localDbServiceMock = {
    getTable: vi.fn(),
    getDatabase: vi.fn(),
  };

  const sampleTransaction: Transaction = {
    id: 'tx-1',
    amount: -42.5,
    date: '2026-08-01T12:00:00.000Z',
    categoryId: 'food',
    accountId: 'default',
    comment: 'Test transaction',
  };

  beforeEach(() => {
    mockTable = {
      toArray: vi.fn(),
      add: vi.fn(),
      put: vi.fn(),
      clear: vi.fn(),
      bulkPut: vi.fn(),
    };

    localDbServiceMock.getTable.mockReturnValue(mockTable);
    localDbServiceMock.getDatabase.mockReturnValue(mockDb);

    TestBed.configureTestingModule({
      providers: [
        TransactionStore,
        { provide: LocalDbService, useValue: localDbServiceMock },
      ],
    });

    service = TestBed.inject(TransactionStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all transactions', async () => {
    mockTable.toArray.mockResolvedValue([sampleTransaction]);

    const result = await firstValueFrom(service.getTransactions());

    expect(result).toEqual([sampleTransaction]);
    expect(mockTable.toArray).toHaveBeenCalledOnce();
  });

  it('should return empty array when no transactions exist', async () => {
    mockTable.toArray.mockResolvedValue([]);

    const result = await firstValueFrom(service.getTransactions());

    expect(result).toEqual([]);
  });

  it('should add a transaction', async () => {
    mockTable.add.mockResolvedValue(sampleTransaction.id);

    const result = await firstValueFrom(service.addTransaction(sampleTransaction));

    expect(result).toEqual(sampleTransaction);
    expect(mockTable.add).toHaveBeenCalledWith(sampleTransaction);
  });

  it('should update a transaction', async () => {
    mockTable.put.mockResolvedValue(sampleTransaction.id);

    const result = await firstValueFrom(
      service.updateTransaction(sampleTransaction),
    );

    expect(result).toEqual(sampleTransaction);
    expect(mockTable.put).toHaveBeenCalledWith(sampleTransaction);
  });

  it('should set transactions (clear + bulkPut)', async () => {
    const transactions = [sampleTransaction];

    // Mock database.transaction to execute the callback
    mockDb.transaction.mockImplementation((_mode: string, _table: unknown, callback: () => Promise<void>) => callback());
    mockTable.clear.mockResolvedValue(undefined);
    mockTable.bulkPut.mockResolvedValue(undefined);

    const result = await firstValueFrom(service.setTransactions(transactions));

    expect(result).toEqual(transactions);
    expect(mockTable.clear).toHaveBeenCalledOnce();
    expect(mockTable.bulkPut).toHaveBeenCalledWith(transactions);
  });

  it('should set empty transactions without calling bulkPut', async () => {
    mockDb.transaction.mockImplementation((_mode: string, _table: unknown, callback: () => Promise<void>) => callback());
    mockTable.clear.mockResolvedValue(undefined);

    const result = await firstValueFrom(service.setTransactions([]));

    expect(result).toEqual([]);
    expect(mockTable.clear).toHaveBeenCalledOnce();
    expect(mockTable.bulkPut).not.toHaveBeenCalled();
  });
});
