import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { Transaction } from '../model/transaction.type';
import { TransactionStore } from './transaction-store';

import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let storeMock: {
    getTransactions: ReturnType<typeof vi.fn>;
    setTransactions: ReturnType<typeof vi.fn>;
    addTransaction: ReturnType<typeof vi.fn>;
    updateTransaction: ReturnType<typeof vi.fn>;
  };

  const sampleTransaction: Transaction = {
    id: 'tx-1',
    amount: -42.5,
    date: '2026-08-01T12:00:00.000Z',
    categoryId: 'food',
    accountId: 'default',
    comment: 'Test transaction',
  };

  const sampleTransactions: Transaction[] = [
    sampleTransaction,
    {
      id: 'tx-2',
      amount: 100,
      date: '2026-08-02T12:00:00.000Z',
      categoryId: 'income',
      accountId: 'default',
    },
  ];

  beforeEach(() => {
    storeMock = {
      getTransactions: vi.fn(),
      setTransactions: vi.fn(),
      addTransaction: vi.fn(),
      updateTransaction: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TransactionService,
        { provide: TransactionStore, useValue: storeMock },
      ],
    });

    service = TestBed.inject(TransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load transactions and set signal state', async () => {
    storeMock.getTransactions.mockReturnValue(of(sampleTransactions));

    const result = await firstValueFrom(service.getTransactions());

    expect(result).toEqual(sampleTransactions);
    expect(service.transactions()).toEqual(sampleTransactions);
    expect(service.transactionsCount()).toBe(2);
  });

  it('should return empty when no transactions', async () => {
    storeMock.getTransactions.mockReturnValue(of([]));

    const result = await firstValueFrom(service.getTransactions());

    expect(result).toEqual([]);
    expect(service.transactions()).toEqual([]);
    expect(service.transactionsCount()).toBe(0);
  });

  it('should add transaction and append to signal state', async () => {
    storeMock.addTransaction.mockReturnValue(of(sampleTransaction));

    const result = await firstValueFrom(service.addTransaction(sampleTransaction));

    expect(result).toEqual(sampleTransaction);
    expect(service.transactions()).toContainEqual(sampleTransaction);
  });

  it('should edit transaction and update signal state', async () => {
    const existingTx: Transaction = {
      id: 'tx-1',
      amount: -50,
      date: '2026-08-01T12:00:00.000Z',
      categoryId: 'food',
      accountId: 'default',
    };
    const updatedTx: Transaction = { ...existingTx, amount: -30 };

    service['transactionsState'].set([existingTx]);
    storeMock.updateTransaction.mockReturnValue(of(updatedTx));

    const result = await firstValueFrom(service.editTransaction(updatedTx));

    expect(result).toEqual(updatedTx);
    expect(service.transactions()).toEqual([updatedTx]);
  });

  it('should set transactions and replace signal state', async () => {
    storeMock.setTransactions.mockReturnValue(of(sampleTransactions));

    const result = await firstValueFrom(service.setTransactions(sampleTransactions));

    expect(result).toEqual(sampleTransactions);
    expect(service.transactions()).toEqual(sampleTransactions);
  });
});
