// spec: docs/specs/auth/01-firebase-authentication.md

import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  Category,
  CategoryService,
  Transaction,
  TransactionService,
} from '@data-access-transaction';

export interface DashboardResolvedData {
  categories: Category[];
  transactions: Transaction[];
}

export const dashboardDataResolver: ResolveFn<DashboardResolvedData> = async () => {
  const categoryService = inject(CategoryService);
  const transactionService = inject(TransactionService);

  try {
    const [categories, transactions] = await Promise.all([
      categoryService.getCategoriesAsync(),
      transactionService.getTransactionsAsync(),
    ]);

    return {
      categories,
      transactions,
    };
  } catch (error) {
    console.error('Failed to resolve dashboard data from IndexedDB:', error);
    // Graceful fallback to avoid blocking navigation
    return {
      categories: [],
      transactions: [],
    };
  }
};
