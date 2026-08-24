import { Page } from '@playwright/test';

export async function seedCurrentMonthTransactions(
  page: Page,
  count: number,
): Promise<void> {
  await page.evaluate(async (transactionCount) => {
    type BrowserCategory = {
      id: string;
      transactionType?: string;
    };

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('budget-fort-db');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction(
      ['category', 'transaction'],
      'readwrite',
    );
    const categories = await new Promise<BrowserCategory[]>((resolve, reject) => {
      const request = transaction.objectStore('category').getAll();
      request.onsuccess = () => resolve(request.result as BrowserCategory[]);
      request.onerror = () => reject(request.error);
    });
    const expenseCategory = categories.find(
      (category) => category.id === 'food',
    );
    if (!expenseCategory) {
      database.close();
      throw new Error('Food category is missing');
    }

    const transactionStore = transaction.objectStore('transaction');
    const now = new Date();
    for (let index = 0; index < transactionCount; index += 1) {
      transactionStore.put({
        id: 'e2e-transaction-' + index,
        amount: -(index + 1),
        date: new Date(
          now.getFullYear(),
          now.getMonth(),
          Math.max(1, now.getDate() - index),
        ).toISOString(),
        categoryId: expenseCategory.id,
        accountId: 'default',
        comment: 'E2E transaction ' + index,
      });
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, count);
}
