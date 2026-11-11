// spec: docs/specs/auth/01-firebase-authentication.md

import { TestBed } from '@angular/core/testing';
import {
  Category,
  CategoryService,
  Transaction,
  TransactionService,
} from '@data-access-transaction';
import { dashboardDataResolver } from './dashboard-data.resolver';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('dashboardDataResolver', () => {
  let mockCategoryService: { getCategoriesAsync: ReturnType<typeof vi.fn> };
  let mockTransactionService: { getTransactionsAsync: ReturnType<typeof vi.fn> };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    mockCategoryService = {
      getCategoriesAsync: vi.fn(),
    };
    mockTransactionService = {
      getTransactionsAsync: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    });
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-7
  it('should resolve categories and transactions from IndexedDB', async () => {
    const mockCategories = [{ id: 'c1', name: 'Jedzenie' }] as unknown as Category[];
    const mockTransactions = [{ id: 't1', amount: 50 }] as unknown as Transaction[];

    mockCategoryService.getCategoriesAsync.mockResolvedValueOnce(mockCategories);
    mockTransactionService.getTransactionsAsync.mockResolvedValueOnce(mockTransactions);

    const result = await TestBed.runInInjectionContext(() =>
      dashboardDataResolver(dummyRoute, dummyState),
    );

    expect(result).toEqual({
      categories: mockCategories,
      transactions: mockTransactions,
    });
  });

  it('should return empty collections gracefully when IndexedDB throws', async () => {
    mockCategoryService.getCategoriesAsync.mockRejectedValueOnce(new Error('IndexedDB error'));
    mockTransactionService.getTransactionsAsync.mockResolvedValueOnce([]);

    const result = await TestBed.runInInjectionContext(() =>
      dashboardDataResolver(dummyRoute, dummyState),
    );

    expect(result).toEqual({
      categories: [],
      transactions: [],
    });
  });
});
