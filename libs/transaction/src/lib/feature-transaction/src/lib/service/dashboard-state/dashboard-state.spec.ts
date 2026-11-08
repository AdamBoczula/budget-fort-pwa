// covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-balance

import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CategoryService, Transaction } from '@data-access-transaction';
import { DashboardState } from './dashboard-state';
import { TransactionState } from '../transaction-state/transaction-state';

describe('DashboardState', () => {
  let state: DashboardState;
  const mockTransactions = signal<Transaction[]>([]);

  beforeEach(() => {
    mockTransactions.set([]);

    TestBed.configureTestingModule({
      providers: [
        DashboardState,
        {
          provide: TransactionState,
          useValue: {
            transactions: mockTransactions,
          },
        },
        {
          provide: CategoryService,
          useValue: {
            getCategoriesAsync: () => Promise.resolve([]),
          },
        },
      ],
    });

    state = TestBed.inject(DashboardState);
    state.setYear(2026);
    state.setMonth(10); // November 2026 (0-indexed: 10 = Nov)
  });

  it('should return balance 0 when there are no transactions', () => {
    expect(state.balance()).toBe(0);
  });

  it('should subtract expense transactions from balance and return negative amount', () => {
    mockTransactions.set([
      {
        id: '1',
        amount: -37.0,
        date: '2026-11-05T12:00:00.000Z',
        categoryId: 'food',
        accountId: 'default',
      },
    ]);

    expect(state.totalSpending()).toBe(37.0);
    expect(state.totalIncome()).toBe(0);
    expect(state.balance()).toBe(-37.0);
  });

  it('should add income transactions to balance', () => {
    mockTransactions.set([
      {
        id: '1',
        amount: 200.0,
        date: '2026-11-02T10:00:00.000Z',
        categoryId: 'income',
        accountId: 'default',
      },
    ]);

    expect(state.totalIncome()).toBe(200.0);
    expect(state.totalSpending()).toBe(0);
    expect(state.balance()).toBe(200.0);
  });

  it('should correctly calculate net balance with both income and expense', () => {
    mockTransactions.set([
      {
        id: '1',
        amount: 500.0,
        date: '2026-11-01T10:00:00.000Z',
        categoryId: 'income',
        accountId: 'default',
      },
      {
        id: '2',
        amount: -120.5,
        date: '2026-11-03T15:00:00.000Z',
        categoryId: 'food',
        accountId: 'default',
      },
      {
        id: '3',
        amount: -79.5,
        date: '2026-11-04T18:00:00.000Z',
        categoryId: 'transport',
        accountId: 'default',
      },
    ]);

    expect(state.totalIncome()).toBe(500.0);
    expect(state.totalSpending()).toBe(200.0);
    expect(state.balance()).toBe(300.0);
  });
});
