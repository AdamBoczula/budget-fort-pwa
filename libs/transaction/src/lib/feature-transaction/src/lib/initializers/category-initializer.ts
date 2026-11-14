// spec: docs/specs/budget/planowanie-budzetu.md
// spec: docs/specs/transaction/recurring-transactions.md
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  CategoryStore,
  MOCK_PL_CATEGORIES,
  RecurringTransactionGeneratorService,
} from '@data-access-transaction';
import { firstValueFrom } from 'rxjs';

/**
 * Seeds default categories in IndexedDB on startup if empty,
 * and generates pending recurring transactions.
 * A persistence failure must not prevent the application from starting.
 */
export function initializeCategoriesFactory(
  categoryStore: CategoryStore,
  recurringGenerator?: RecurringTransactionGeneratorService,
): () => Promise<void> {
  return async () => {
    try {
      await firstValueFrom(categoryStore.seedCategoriesIfEmpty(MOCK_PL_CATEGORIES));
      if (recurringGenerator) {
        await recurringGenerator.generatePendingTransactions();
      }
    } catch (error) {
      console.warn('Failed to seed categories or generate recurring transactions:', error);
    }
  };
}

export const categoryInitializerResolver: ResolveFn<void> = () =>
  initializeCategoriesFactory(
    inject(CategoryStore),
    inject(RecurringTransactionGeneratorService),
  )();
