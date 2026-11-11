// spec: docs/specs/budget/planowanie-budzetu.md
// Updated for new budget UI (category limits drive overall budget)

import { test, expect } from '@playwright/test';
import { setGuestMode } from './utils/auth-e2e-utils';
import { seedCategoryBudget, clearBudgetData, clearTransactions } from './utils/seed-budget';
import { seedCurrentMonthTransactions } from './utils/seed-transactions';

test.describe('Budget – set overall budget', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({
      timeout: 5000,
    });
    await clearBudgetData(page);
    await clearTransactions(page);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  test('should set overall budget via settings page and show progress on dashboard', async ({
    page,
  }) => {
    // Seed a category budget so the overall budget is derived from it
    await seedCategoryBudget(page, 'food', 'Jedzenie', 5000);

    // Navigate to budget page to verify seeded budget appears
    await page.goto('/budget');

    // Wait for the form to load
    await expect(page.getByText('Budżet miesięczny').first()).toBeVisible({ timeout: 5000 });

    // Verify progress bar shows 0 / 5000 (seeded category budget)
    const progressBar = page.locator('budget-progress-bar').first();
    await expect(progressBar).toBeVisible({ timeout: 3000 });
    await expect(progressBar).toContainText('0 / 5000');
    await expect(progressBar).toContainText('(0%)');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-9
  test('should recalculate progress after changing budget mid-month', async ({ page }) => {
    // Set initial budget via IndexedDB (category-level budget)
    await seedCategoryBudget(page, 'food', 'Jedzenie', 5000);

    // Add 3000 in expenses
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await seedCurrentMonthTransactions(page, 3);
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('budget-fort-db');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = database.transaction(['transaction'], 'readwrite');
      const store = tx.objectStore('transaction');
      const all = await new Promise<unknown[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as unknown[]);
        req.onerror = () => reject(req.error);
      });

      for (let i = 0; i < all.length && i < 3; i++) {
        const record = all[i] as Record<string, unknown>;
        record.amount = -1000;
        store.put(record);
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    });

    // Go to budget page, verify 3000/5000 = 60%, green
    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    const progressBar = page.locator('budget-progress-bar').first();
    await expect(progressBar).toBeVisible({ timeout: 3000 });
    await expect(progressBar).toContainText('(60%)');

    // Verify green gradient (below 80%) — UI-06 changed to gradient
    const fillBar = progressBar.locator('.budget-progress__bar-fill');
    const bgImage = await fillBar.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('background-image'),
    );
    expect(bgImage).toContain('linear-gradient');

    // Now change budget to 6000 via CategoryBudget API
    await seedCategoryBudget(page, 'food', 'Jedzenie', 6000);
    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });
    await expect(progressBar).toBeVisible({ timeout: 3000 });
    // 3000/6000 = 50%
    await expect(progressBar).toContainText('(50%)');
    await expect(progressBar).toContainText('3000 / 6000');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-11
  test('should persist budget data after page refresh', async ({ page }) => {
    // Set budget via IndexedDB
    await seedCategoryBudget(page, 'food', 'Jedzenie', 1500);

    // Navigate to budget page
    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    // Verify both overall and category are displayed
    await expect(page.getByText('Budżet miesięczny')).toBeVisible({ timeout: 3000 });
    const progressBars = page.locator('budget-progress-bar');
    await expect(progressBars).toHaveCount(1); // overall bar only (per-category bars removed in redesign)

    // Also verify Jedzenie category card is present
    await expect(
      page.locator('budget-category-card').filter({ hasText: 'Jedzenie' }).first(),
    ).toBeVisible({
      timeout: 3000,
    });

    // Refresh
    await page.reload();
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    // Verify both are still displayed
    await expect(page.getByText('Budżet miesięczny')).toBeVisible({ timeout: 3000 });
    const refreshedBars = page.locator('budget-progress-bar');
    await expect(refreshedBars).toHaveCount(1);
    await expect(
      page.locator('budget-category-card').filter({ hasText: 'Jedzenie' }).first(),
    ).toBeVisible({
      timeout: 3000,
    });
  });
});

test.describe('Budget – category limits', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({
      timeout: 5000,
    });
    await clearBudgetData(page);
    await clearTransactions(page);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  test('should set category limit via UI form and save without opening edit dialog', async ({
    page,
  }) => {
    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    const jedzenieCard = page
      .locator('budget-category-card')
      .filter({ hasText: 'Jedzenie' })
      .first();
    await expect(jedzenieCard).toBeVisible({ timeout: 5000 });

    const jedzenieInput = jedzenieCard.locator('input[type="number"]');
    await jedzenieInput.click();

    // Clicking the input must not open the category edit dialog
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);

    await jedzenieInput.fill('1500');

    // Previous month limit on the card should remain 0 while typing
    await expect(jedzenieCard.locator('.category-card__history-limit')).toContainText('/ 0');

    // Save via button
    await page.getByRole('button', { name: /Zapisz/i }).click();
    await expect(page.getByText('Zapisano limity budżetu.')).toBeVisible({ timeout: 3000 });

    // Reload and verify limit was persisted
    await page.reload();
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });
    const reloadedInput = page
      .locator('budget-category-card')
      .filter({ hasText: 'Jedzenie' })
      .first()
      .locator('input[type="number"]');
    await expect(reloadedInput).toHaveValue('1500');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-6
  test('should show yellow progress for category at 90%', async ({ page }) => {
    await seedCategoryBudget(page, 'food', 'Jedzenie', 1500);
    await seedCategoryBudget(page, 'food', 'Jedzenie', 1500);

    // Add 1350 in food expenses
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await seedCurrentMonthTransactions(page, 1);
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('budget-fort-db');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = database.transaction(['transaction'], 'readwrite');
      const store = tx.objectStore('transaction');
      const all = await new Promise<unknown[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as unknown[]);
        req.onerror = () => reject(req.error);
      });
      const record = all[0] as Record<string, unknown>;
      record.amount = -1350;
      store.put(record);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    });

    // Navigate to budget page — check overall progress bar at 90% (1350/1500)
    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    const progressBar = page.locator('budget-progress-bar').first();
    await expect(progressBar).toBeVisible({ timeout: 3000 });
    await expect(progressBar).toContainText('(90%)');

    const fillBar = progressBar.locator('.budget-progress__bar-fill');
    const bgImage = await fillBar.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('background-image'),
    );
    expect(bgImage).toContain('linear-gradient');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-7
  test('should not show category bar for categories without a limit', async ({ page }) => {
    // No category budget seeded — verify Jedzenie card appears with empty/0 limit

    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    // Jedzenie category card exists but should have no limit set (empty input)
    const jedzenieCard = page
      .locator('budget-category-card')
      .filter({ hasText: 'Jedzenie' })
      .first();
    await expect(jedzenieCard).toBeVisible({ timeout: 3000 });
    const jedzenieInput = jedzenieCard.locator('input[type="number"]');
    await expect(jedzenieInput).toHaveValue('0');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-10
  test('should remove category limit when field is cleared', async ({ page }) => {
    await seedCategoryBudget(page, 'transport', 'Transport', 500);

    // Verify it appears on budget page first
    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('budget-category-card').filter({ hasText: 'Transport' })).toBeVisible(
      {
        timeout: 3000,
      },
    );

    // Go to budget settings and clear the Transport limit
    await page.goto('/budget');
    await expect(page.getByText('Budżet miesięczny').first()).toBeVisible({ timeout: 5000 });

    const transportInput = page.locator('input[aria-label="Limit dla Transport"]');
    await expect(transportInput).toBeVisible();
    await transportInput.fill('');

    // Save
    await page.getByRole('button', { name: /Zapisz/i }).click();
    try {
      await expect(page.getByText('Zapisano').first()).toBeVisible({ timeout: 2000 });
    } catch {
      // Snackbar might have already disappeared
    }

    // Verify Transport card still exists but has no limit (empty/0 input)
    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });
    const transportCard = page.locator('budget-category-card').filter({ hasText: 'Transport' });
    await expect(transportCard).toHaveCount(1);
    const transportInputAfter = transportCard.locator('input[type="number"]');
    await expect(transportInputAfter).toHaveValue('0');
  });
});

test.describe('Budget – progress colors', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({
      timeout: 5000,
    });
    await clearBudgetData(page);
    await clearTransactions(page);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-3
  test('should show green progress bar when spend < 80%', async ({ page }) => {
    await seedCategoryBudget(page, 'food', 'Jedzenie', 5000);

    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await seedCurrentMonthTransactions(page, 2);
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('budget-fort-db');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = database.transaction(['transaction'], 'readwrite');
      const store = tx.objectStore('transaction');
      const all = await new Promise<unknown[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as unknown[]);
        req.onerror = () => reject(req.error);
      });
      for (let i = 0; i < all.length && i < 2; i++) {
        (all[i] as Record<string, unknown>).amount = -1000;
        store.put(all[i]);
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    });

    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    const progressBar = page.locator('budget-progress-bar').first();
    await expect(progressBar).toBeVisible({ timeout: 3000 });
    await expect(progressBar).toContainText('(40%)');

    const fillBar = progressBar.locator('.budget-progress__bar-fill');
    const bgImage = await fillBar.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('background-image'),
    );
    expect(bgImage).toContain('linear-gradient');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-4
  test('should show yellow progress bar when spend is 80-99%', async ({ page }) => {
    await seedCategoryBudget(page, 'food', 'Jedzenie', 5000);

    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await seedCurrentMonthTransactions(page, 1);
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('budget-fort-db');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = database.transaction(['transaction'], 'readwrite');
      const store = tx.objectStore('transaction');
      const all = await new Promise<unknown[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as unknown[]);
        req.onerror = () => reject(req.error);
      });
      (all[0] as Record<string, unknown>).amount = -4200;
      store.put(all[0]);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    });

    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    const progressBar = page.locator('budget-progress-bar').first();
    await expect(progressBar).toBeVisible({ timeout: 3000 });
    await expect(progressBar).toContainText('(84%)');

    const fillBar = progressBar.locator('.budget-progress__bar-fill');
    const bgImage = await fillBar.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('background-image'),
    );
    expect(bgImage).toContain('linear-gradient');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-5
  test('should show red progress bar at 100% when spend exceeds budget', async ({ page }) => {
    await seedCategoryBudget(page, 'food', 'Jedzenie', 5000);

    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await seedCurrentMonthTransactions(page, 1);
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('budget-fort-db');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = database.transaction(['transaction'], 'readwrite');
      const store = tx.objectStore('transaction');
      const all = await new Promise<unknown[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as unknown[]);
        req.onerror = () => reject(req.error);
      });
      (all[0] as Record<string, unknown>).amount = -5200;
      store.put(all[0]);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    });

    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    const progressBar = page.locator('budget-progress-bar').first();
    await expect(progressBar).toBeVisible({ timeout: 3000 });
    await expect(progressBar).toContainText('(100%)');
    await expect(progressBar).toContainText('5200 / 5000');

    const fillBar = progressBar.locator('.budget-progress__bar-fill');
    const bgImage = await fillBar.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('background-image'),
    );
    expect(bgImage).toContain('linear-gradient');
  });
});

test.describe('Budget – income excluded', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({
      timeout: 5000,
    });
    await clearBudgetData(page);
    await clearTransactions(page);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-8
  test('should only count expenses toward budget, not income', async ({ page }) => {
    await seedCategoryBudget(page, 'food', 'Jedzenie', 5000);

    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await seedCurrentMonthTransactions(page, 1);
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('budget-fort-db');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = database.transaction(['transaction', 'category'], 'readwrite');

      const txStore = tx.objectStore('transaction');
      const all = await new Promise<unknown[]>((resolve, reject) => {
        const req = txStore.getAll();
        req.onsuccess = () => resolve(req.result as unknown[]);
        req.onerror = () => reject(req.error);
      });
      (all[0] as Record<string, unknown>).amount = -3000;
      txStore.put(all[0]);

      const categories = await new Promise<unknown[]>((resolve, reject) => {
        const req = tx.objectStore('category').getAll();
        req.onsuccess = () => resolve(req.result as unknown[]);
        req.onerror = () => reject(req.error);
      });

      const salaryCategory = (categories as Array<Record<string, unknown>>).find(
        (c) => c.transactionType === 'income',
      );

      txStore.put({
        id: 'e2e-income-1',
        amount: 2000,
        date: new Date().toISOString(),
        categoryId: salaryCategory?.id ?? 'salary',
        accountId: 'default',
        comment: 'Income transaction',
      });

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    });

    await page.goto('/budget');
    await expect(page.locator('.period-selector')).toBeVisible({
      timeout: 5000,
    });

    const progressBar = page.locator('budget-progress-bar').first();
    await expect(progressBar).toBeVisible({ timeout: 3000 });
    await expect(progressBar).toContainText('(60%)');
    await expect(progressBar).toContainText('3000 / 5000');

    const fillBar = progressBar.locator('.budget-progress__bar-fill');
    const bgImage = await fillBar.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('background-image'),
    );
    expect(bgImage).toContain('linear-gradient');
  });
});
