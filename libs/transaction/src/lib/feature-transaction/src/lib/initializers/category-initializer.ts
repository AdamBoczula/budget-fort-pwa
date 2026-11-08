// spec: docs/specs/budget/planowanie-budzetu.md
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  CategoryStore,
  DEFAULT_SUBCATEGORIES,
  MOCK_PL_CATEGORIES,
  SubcategoryStore,
} from '@data-access-transaction';
import { LocalDbService } from 'local-db';
import { firstValueFrom } from 'rxjs';
import { seedPreviousMonthBudgetIfNeeded } from './previous-month-budget-seed';

/**
 * Seeds the categories, subcategories, and temporary previous-month budget preview data
 * in IndexedDB on startup. A persistence failure must not prevent the application from starting.
 */
export function initializeCategoriesFactory(
  categoryStore: CategoryStore,
  subcategoryStore: SubcategoryStore,
  localDbService?: LocalDbService,
): () => Promise<void> {
  return async () => {
    try {
      await firstValueFrom(categoryStore.seedCategoriesIfEmpty(MOCK_PL_CATEGORIES));
      await firstValueFrom(subcategoryStore.seedSubcategoriesIfEmpty(DEFAULT_SUBCATEGORIES));
      if (localDbService) {
        await seedPreviousMonthBudgetIfNeeded(localDbService);
      }
    } catch (error) {
      console.warn('Failed to seed categories:', error);
    }
  };
}

export const categoryInitializerResolver: ResolveFn<void> = () =>
  initializeCategoriesFactory(
    inject(CategoryStore),
    inject(SubcategoryStore),
    inject(LocalDbService),
  )();
