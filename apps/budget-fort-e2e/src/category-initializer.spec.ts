import { test, expect } from '@playwright/test';

test('should seed categories into IndexedDB on app startup', async ({ page }) => {
  await page.goto('/');

  // Wait for app to initialize (APP_INITIALIZER runs) and IndexedDB seeds
  await page.waitForTimeout(2000);

  // Check IndexedDB via page.evaluate using Dexie
  const categories = await page.evaluate(async () => {
    const dbName = 'budget-fort-db';

    // List all database names to find the right one with its current version
    const databases = await indexedDB.databases();
    const targetDb = databases.find((db) => db.name === dbName);
    if (!targetDb) {
      return [];
    }

    return new Promise<unknown[]>((resolve, reject) => {
      const request = indexedDB.open(dbName, targetDb.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('category')) {
          resolve([]);
          return;
        }
        const transaction = db.transaction('category', 'readonly');
        const store = transaction.objectStore('category');
        const getAll = store.getAll();

        getAll.onsuccess = () => resolve(getAll.result);
        getAll.onerror = () => reject(getAll.error);
      };
    });
  });

  expect(categories).toBeDefined();
  expect(categories.length).toBeGreaterThan(0);

  // Verify that well known categories exist
  const categoryNames = categories.map(
    (c: { name: string }) => (c as { name: string }).name,
  );
  expect(categoryNames).toContain('Jedzenie');
  expect(categoryNames).toContain('Transport');
  expect(categoryNames).toContain('Dom');
  expect(categoryNames).toContain('Zdrowie');
  expect(categoryNames).toContain('Rozrywka');
  expect(categoryNames).toContain('Inne');
});