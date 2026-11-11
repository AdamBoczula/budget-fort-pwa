import { test, expect, Page } from '@playwright/test';
import { setGuestMode } from './utils/auth-e2e-utils';
import { seedCurrentMonthTransactions } from './utils/seed-transactions';

type StoredCategory = {
  id: string;
  name: string;
  transactionType?: string;
};

async function getStoredCategories(page: Page): Promise<StoredCategory[]> {
  return page.evaluate(async () => {
    const databases = await indexedDB.databases();
    const targetDatabase = databases.find((database) => database.name === 'budget-fort-db');

    if (!targetDatabase) {
      return [];
    }

    return new Promise<StoredCategory[]>((resolve, reject) => {
      const request = indexedDB.open('budget-fort-db', targetDatabase.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('category')) {
          database.close();
          resolve([]);
          return;
        }

        const getAllRequest = database
          .transaction('category', 'readonly')
          .objectStore('category')
          .getAll();
        getAllRequest.onsuccess = () => {
          database.close();
          resolve(getAllRequest.result as StoredCategory[]);
        };
        getAllRequest.onerror = () => {
          database.close();
          reject(getAllRequest.error);
        };
      };
    });
  });
}

test.describe('Categories initialization', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
  });

  test('should seed categories into IndexedDB on app startup', async ({ page }) => {
    await page.goto('/feature-transaction');

    await expect.poll(async () => (await getStoredCategories(page)).length).toBeGreaterThan(0);

    const categories = await getStoredCategories(page);
    const names = categories.map((category) => category.name);
    expect(names).toContain('Jedzenie');
    expect(names).toContain('Zarobek');
  });

  test('should display category grid on home page', async ({ page }) => {
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.category-card').first()).toBeVisible({ timeout: 3000 });
    expect(await page.locator('.category-card').count()).toBeGreaterThan(0);
  });

  test('should keep the mobile shell inside the viewport and scroll only transactions', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });

    await seedCurrentMonthTransactions(page, 20);

    await page.reload();
    await expect(page.getByTestId('last-transaction-item').first()).toBeVisible({
      timeout: 5000,
    });

    const layout = await page.evaluate(() => {
      const sidenavContent = document.querySelector('mat-sidenav-content');
      const header = document.querySelector('transaction-header-toolbar');
      const transactions = document.querySelector('transaction-last-transaction');

      if (!sidenavContent || !header || !transactions) {
        throw new Error('Transaction shell layout is incomplete');
      }

      const headerRect = header.getBoundingClientRect();
      const transactionsStyle = getComputedStyle(transactions);

      return {
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        documentClientHeight: document.documentElement.clientHeight,
        documentScrollHeight: document.documentElement.scrollHeight,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        bodyClientHeight: document.body.clientHeight,
        bodyScrollHeight: document.body.scrollHeight,
        sidenavClientWidth: sidenavContent.clientWidth,
        sidenavScrollWidth: sidenavContent.scrollWidth,
        sidenavClientHeight: sidenavContent.clientHeight,
        sidenavScrollHeight: sidenavContent.scrollHeight,
        headerLeft: headerRect.left,
        headerRight: headerRect.right,
        transactionsOverflowX: transactionsStyle.overflowX,
        transactionsOverflowY: transactionsStyle.overflowY,
        transactionsClientHeight: transactions.clientHeight,
        transactionsScrollHeight: transactions.scrollHeight,
      };
    });

    expect(layout.documentScrollWidth).toBe(layout.documentClientWidth);
    expect(layout.documentScrollHeight).toBe(layout.documentClientHeight);
    expect(layout.bodyScrollWidth).toBe(layout.bodyClientWidth);
    expect(layout.bodyScrollHeight).toBe(layout.bodyClientHeight);
    expect(layout.sidenavScrollWidth).toBe(layout.sidenavClientWidth);
    expect(layout.sidenavScrollHeight).toBe(layout.sidenavClientHeight);
    expect(layout.headerLeft).toBe(0);
    expect(layout.headerRight).toBe(layout.documentClientWidth);
    expect(layout.transactionsOverflowX).toBe('hidden');
    expect(layout.transactionsOverflowY).toBe('auto');
    expect(layout.transactionsScrollHeight).toBeGreaterThan(layout.transactionsClientHeight);

    await page.locator('transaction-last-transaction').evaluate((element) => {
      element.scrollTop = 160;
    });
    const scrollPositions = await page.evaluate(() => ({
      page: window.scrollY,
      sidenav: document.querySelector('mat-sidenav-content')?.scrollTop ?? -1,
      transactions: document.querySelector('transaction-last-transaction')?.scrollTop ?? 0,
    }));

    expect(scrollPositions.transactions).toBeGreaterThan(0);
    expect(scrollPositions.sidenav).toBe(0);
    expect(scrollPositions.page).toBe(0);
  });

  test('should open transaction dialog on category click', async ({ page }) => {
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await page.locator('.category-card').first().click();
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /Zapisz/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Anuluj/i })).toBeVisible();
  });

  test('should show FAB button on home page', async ({ page }) => {
    await page.goto('/feature-transaction');
    const fab = page.locator('.fab-income');
    await expect(fab).toBeVisible({ timeout: 5000 });
    await expect(fab.locator('mat-icon')).toContainText('add');
  });

  test('should open income dialog on FAB click with amount field', async ({ page }) => {
    await page.goto('/feature-transaction');
    await expect(page.locator('.fab-income')).toBeVisible({ timeout: 5000 });
    await page.locator('.fab-income').click();
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 3000 });
    await expect(page.getByPlaceholder('0.00')).toBeVisible();
    await expect(page.getByRole('button', { name: /Zapisz/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Anuluj/i })).toBeVisible();
  });

  test('should display transaction list with correct category names and icons on first load', async ({
    page,
  }) => {
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await seedCurrentMonthTransactions(page, 1);
    await page.reload();

    await expect(page.getByTestId('last-transaction-item').first()).toBeVisible({ timeout: 5000 });
    const nameEl = page.getByTestId('last-transaction-item__name').first();
    await expect(nameEl).toHaveText('Jedzenie');
    await expect(
      page.getByTestId('last-transaction-item__icon').locator('mat-icon').first(),
    ).toHaveText('restaurant');
  });
});
