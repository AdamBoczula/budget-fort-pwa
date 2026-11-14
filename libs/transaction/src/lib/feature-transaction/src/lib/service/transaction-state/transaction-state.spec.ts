import { TestBed } from '@angular/core/testing';
import { AuthService } from '@data-access-auth';
import { SyncState } from '@data-access-sync';
import { RecurringRuleService, TransactionService } from '@data-access-transaction';
import { of } from 'rxjs';

import { TransactionState } from './transaction-state';

describe('TransactionState', () => {
  let service: TransactionState;

  const mockTransactions = [
    {
      id: 'tx-1',
      amount: -42.5,
      date: '2026-08-01T12:00:00.000Z',
      categoryId: 'food',
      accountId: 'default',
    },
    {
      id: 'tx-2',
      amount: 100,
      date: '2026-08-02T12:00:00.000Z',
      categoryId: 'income',
      accountId: 'default',
    },
  ];

  const transactionServiceMock = {
    getTransactions: () => of(mockTransactions),
    getTransactionsAsync: vi.fn().mockResolvedValue(mockTransactions),
    addTransaction: vi.fn().mockReturnValue(of(mockTransactions[0])),
    addTransactionAsync: vi.fn().mockResolvedValue(mockTransactions[0]),
    editTransaction: vi.fn().mockReturnValue(of(mockTransactions[0])),
    editTransactionAsync: vi.fn().mockResolvedValue(mockTransactions[0]),
    deleteTransaction: vi.fn().mockReturnValue(of(undefined)),
    deleteTransactionAsync: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TransactionService,
          useValue: transactionServiceMock,
        },
      ],
    });

    service = TestBed.inject(TransactionState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have transactions as empty array before resource resolves', () => {
    // Dzięki backward-compat computed, zanim resource się rozwiąże,
    // transactions zwraca pustą tablicę (nie undefined)
    expect(service.transactions()).toEqual([]);
    expect(service.transactionsCount()).toBe(0);
    expect(service.balance()).toBe(0);
  });

  it('should reflect transactions through backward-compat computed after load', async () => {
    // Czekamy aż resource się rozwiąże (asynchronicznie)
    await vi.waitFor(() => {
      expect(service.transactionsResource.status()).toBe('resolved');
    });
    expect(service.transactions().length).toBe(2);
    expect(service.transactions()).toEqual(mockTransactions);
    expect(service.transactionsCount()).toBe(2);
  });

  it('should compute balance from transactions after loading', async () => {
    await vi.waitFor(() => {
      expect(service.transactionsResource.status()).toBe('resolved');
    });

    // -42.5 + 100 = 57.5
    expect(service.balance()).toBe(57.5);
  });

  it('should group transactions by date after loading', async () => {
    await vi.waitFor(() => {
      expect(service.transactionsResource.status()).toBe('resolved');
    });

    const groups = service.groupedTransactions();
    expect(groups.length).toBe(2);
    expect(groups[0].transactions.length).toBeGreaterThan(0);
  });

  it('should reload transactions after addTransaction', async () => {
    await vi.waitFor(() => {
      expect(service.transactionsResource.status()).toBe('resolved');
    });

    await service.addTransaction({
      id: 'tx-new',
      amount: -20,
      date: new Date().toISOString(),
      categoryId: 'food',
      accountId: 'default',
    });

    await vi.waitFor(() => {
      expect(transactionServiceMock.getTransactionsAsync).toHaveBeenCalledTimes(2);
    });
  });

  it('should reload transactions after deleteTransaction', async () => {
    await vi.waitFor(() => {
      expect(service.transactionsResource.status()).toBe('resolved');
    });

    await service.deleteTransaction('tx-1');

    await vi.waitFor(() => {
      expect(transactionServiceMock.getTransactionsAsync).toHaveBeenCalledTimes(2);
    });
  });

  it('should reload transactions after editTransaction', async () => {
    await vi.waitFor(() => {
      expect(service.transactionsResource.status()).toBe('resolved');
    });

    await service.editTransaction({
      id: 'tx-1',
      amount: -100,
      date: '2026-08-01T12:00:00.000Z',
      categoryId: 'food',
      accountId: 'default',
    });

    await vi.waitFor(() => {
      expect(transactionServiceMock.getTransactionsAsync).toHaveBeenCalledTimes(2);
    });
  });

  it('should set mutationError on addTransaction failure', async () => {
    const failingService = {
      ...transactionServiceMock,
      addTransactionAsync: vi.fn().mockRejectedValue(new Error('DB error')),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: TransactionService, useValue: failingService }],
    });

    const serviceWithError = TestBed.inject(TransactionState);
    expect(serviceWithError.mutationError()).toBeNull();

    await serviceWithError.addTransaction({
      id: 'tx-fail',
      amount: -20,
      date: new Date().toISOString(),
      categoryId: 'food',
      accountId: 'default',
    });

    expect(serviceWithError.mutationError()).not.toBeNull();
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-1
  it('should create recurring rule and assign recurringRuleId when recurringOptions is enabled', async () => {
    const mockRecurringService = {
      addRuleAsync: vi.fn().mockImplementation(async (rule) => rule),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: TransactionService, useValue: transactionServiceMock },
        { provide: RecurringRuleService, useValue: mockRecurringService },
      ],
    });

    const stateWithRecurring = TestBed.inject(TransactionState);
    const tx = {
      id: 'tx-new',
      amount: -150,
      date: '2026-11-14T10:00:00.000Z',
      categoryId: 'bills',
      accountId: 'default',
    };

    await stateWithRecurring.addTransaction(tx, { isRecurring: true, dayOfMonth: 5 });

    expect(mockRecurringService.addRuleAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 150,
        categoryId: 'bills',
        dayOfMonth: 5,
        lastGeneratedMonth: '2026-11',
      }),
    );
    expect(tx.recurringRuleId).toBeDefined();
    expect(transactionServiceMock.addTransactionAsync).toHaveBeenCalledWith(tx);
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-2
  it('should automatically attach authorId, authorName and householdId when adding transaction', async () => {
    const mockAuth = {
      currentUser: vi.fn().mockReturnValue({
        uid: 'user-adam',
        displayName: 'Adam',
        email: 'adam@example.com',
      }),
    };
    const mockSyncState = {
      householdId: vi.fn().mockReturnValue('hh-dom-1'),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: TransactionService, useValue: transactionServiceMock },
        { provide: AuthService, useValue: mockAuth },
        { provide: SyncState, useValue: mockSyncState },
      ],
    });

    const state = TestBed.inject(TransactionState);
    const tx = {
      id: 'tx-household',
      amount: -45,
      date: '2026-11-14T10:00:00.000Z',
      categoryId: 'groceries',
      accountId: 'default',
    };

    await state.addTransaction(tx);

    expect(transactionServiceMock.addTransactionAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tx-household',
        authorId: 'user-adam',
        authorName: 'Adam',
        householdId: 'hh-dom-1',
      }),
    );
  });
});
