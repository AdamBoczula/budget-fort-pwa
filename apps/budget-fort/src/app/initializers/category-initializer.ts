import {
  APP_INITIALIZER,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  CategoryStore,
  MOCK_PL_CATEGORIES,
} from '@data-access-transaction';

/**
 * Seeds the categories table in IndexedDB with mock data if it's empty.
 * Runs once during application initialization.
 */
function initializeCategories(): () => Promise<void> {
  const categoryStore = inject(CategoryStore);
  return initializeCategoriesFactory(categoryStore);
}

/**
 * Factory function that creates an async initializer for seeding categories.
 * Extracted for testability – takes the store as a parameter.
 *
 * @param categoryStore - The CategoryStore instance to use for seeding
 * @returns An async function that seeds categories if empty
 */
export function initializeCategoriesFactory(
  categoryStore: CategoryStore,
): () => Promise<void> {
  return () => {
    return new Promise<void>((resolve, reject) => {
      categoryStore.seedCategoriesIfEmpty(MOCK_PL_CATEGORIES).subscribe({
        next: () => resolve(),
        error: (err) => reject(err),
      });
    });
  };
}

/**
 * Provides the category initializer that runs on app startup.
 * Seeds default categories into IndexedDB if the table is empty.
 */
export function provideCategoryInitializer() {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCategories,
      multi: true,
    },
  ]);
}