import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {
  CategoryStore,
  MOCK_PL_CATEGORIES,
  SubcategoryStore,
} from '@data-access-transaction';
import { DEFAULT_SUBCATEGORIES } from '@data-access-transaction';
import { firstValueFrom } from 'rxjs';

/**
 * Seeds the categories and subcategories tables in IndexedDB with default data if they are empty.
 * A persistence failure must not prevent the application from starting.
 */
export function initializeCategoriesFactory(
  categoryStore: CategoryStore,
  subcategoryStore: SubcategoryStore,
): () => Promise<void> {
  return async () => {
    try {
      await firstValueFrom(
        categoryStore.seedCategoriesIfEmpty(MOCK_PL_CATEGORIES),
      );
      await firstValueFrom(
        subcategoryStore.seedSubcategoriesIfEmpty(DEFAULT_SUBCATEGORIES),
      );
    } catch (error) {
      console.warn('Failed to seed categories:', error);
    }
  };
}

export const categoryInitializerResolver: ResolveFn<void> = () =>
  initializeCategoriesFactory(inject(CategoryStore), inject(SubcategoryStore))();