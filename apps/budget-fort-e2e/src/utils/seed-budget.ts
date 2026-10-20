import { type Page } from '@playwright/test';

export async function seedBudget(page: Page, amount: number): Promise<void> {
  await page.evaluate(async (budgetAmount) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('budget-fort-db');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const transaction = database.transaction(['budget'], 'readwrite');
    const budgetStore = transaction.objectStore('budget');
    budgetStore.put({ id: 1, amount: budgetAmount, updatedAt: new Date().toISOString() });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, amount);
}

export async function seedCategoryBudget(
  page: Page,
  categoryId: string,
  categoryName: string,
  amount: number,
): Promise<void> {
  await page.evaluate(
    async ({ categoryId: catId, categoryName: catName, amount: budgetAmount }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('budget-fort-db');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = database.transaction(['categoryBudget'], 'readwrite');
      const categoryBudgetStore = transaction.objectStore('categoryBudget');

      // Delete existing budget for this category first (to avoid duplicates)
      const existing = await new Promise<unknown[]>((resolve, reject) => {
        const req = categoryBudgetStore.getAll();
        req.onsuccess = () => resolve(req.result as unknown[]);
        req.onerror = () => reject(req.error);
      });

      // Find max id to generate unique new id
      let maxId = 0;
      for (const item of existing) {
        const record = item as { categoryId: string | number; id: number };
        if (record.id > maxId) {
          maxId = record.id;
        }
        // Compare as strings for matching
        if (String(record.categoryId) === catId) {
          // Update existing record
          categoryBudgetStore.put({
            ...record,
            categoryName: catName,
            amount: budgetAmount,
            updatedAt: new Date().toISOString(),
          });
          await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
          });
          database.close();
          return;
        }
      }

      // No existing record — create new one with generated id
      categoryBudgetStore.put({
        id: maxId + 1,
        categoryId: catId, // Store as string, matching the app's category IDs
        categoryName: catName,
        amount: budgetAmount,
        updatedAt: new Date().toISOString(),
      });

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
    },
    { categoryId, categoryName, amount },
  );
}

export async function clearBudgetData(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('budget-fort-db');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const transaction = database.transaction(['budget', 'categoryBudget'], 'readwrite');
    transaction.objectStore('budget').clear();
    transaction.objectStore('categoryBudget').clear();

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
}

export async function clearTransactions(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('budget-fort-db');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const transaction = database.transaction(['transaction'], 'readwrite');
    transaction.objectStore('transaction').clear();

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
}

export type StoredBudget = {
  id: number;
  amount: number;
  updatedAt: string;
};

export async function getStoredBudget(page: Page): Promise<StoredBudget | null> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('budget-fort-db');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return new Promise<StoredBudget | null>((resolve, reject) => {
      const transaction = database.transaction(['budget'], 'readonly');
      const request = transaction.objectStore('budget').get(1);
      request.onsuccess = () => {
        database.close();
        resolve((request.result as StoredBudget | undefined) ?? null);
      };
      request.onerror = () => {
        database.close();
        reject(request.error);
      };
    });
  });
}
