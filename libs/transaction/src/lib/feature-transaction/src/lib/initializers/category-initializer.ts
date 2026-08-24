import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { CategoryStore, MOCK_PL_CATEGORIES } from '@data-access-transaction';
import { firstValueFrom } from 'rxjs';

/**
 * Seeds the categories table in IndexedDB with default data if it is empty.
 * A persistence failure must not prevent the application from starting.
 */
export function initializeCategoriesFactory(
  categoryStore: CategoryStore,
): () => Promise<void> {
  return async () => {
    try {
      await firstValueFrom(
        categoryStore.seedCategoriesIfEmpty(MOCK_PL_CATEGORIES),
      );
    } catch (error) {
      console.warn('Failed to seed categories:', error);
    }
  };
}

export const categoryInitializerResolver: ResolveFn<void> = () =>
  initializeCategoriesFactory(inject(CategoryStore))();