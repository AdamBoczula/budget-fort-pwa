// spec: docs/specs/transaction/recurring-transactions.md

import { test, expect } from '@playwright/test';
import { setGuestMode } from './utils/auth-e2e-utils';

test.describe('Recurring Transactions E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  test('should display recurring section in settings and allow adding a new recurring rule', async ({
    page,
  }) => {
    await page.goto('/feature-transaction/settings');

    // Verify recurring section header
    const section = page.getByTestId('settings-recurring-section');
    await expect(section).toBeVisible({ timeout: 10000 });
    await expect(section.getByText('Opłaty cykliczne')).toBeVisible();

    // Open Add Recurring Rule dialog
    const addBtn = page.getByTestId('add-recurring-rule-btn');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Dialog should open
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Dodaj opłatę cykliczną')).toBeVisible();

    // Select category
    await page.getByTestId('recurring-dialog-category').click();
    await page.locator('mat-option').first().click();

    // Enter amount
    await page.getByTestId('recurring-dialog-amount').fill('150');

    // Enter description
    await page.getByTestId('recurring-dialog-comment').fill('Karnet siłownia');

    // Save
    await page.getByTestId('recurring-dialog-save').click();
    await expect(page.locator('mat-dialog-container')).toBeHidden();

    // Verify item appeared in list
    await expect(page.getByText('Karnet siłownia')).toBeVisible();
    await expect(page.getByTestId('recurring-summary')).toBeVisible();
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-1
  test('should show recurring toggle in transaction form dialog', async ({ page }) => {
    await page.goto('/feature-transaction/home');

    // Click quick add category button to open transaction form
    const categoryBtn = page.locator('button.category-btn, .categories-quick-add button').first();
    await expect(categoryBtn).toBeVisible({ timeout: 10000 });
    await categoryBtn.click();

    // Verify transaction form dialog opens
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 5000 });

    // Verify recurring toggle exists
    const recurringToggle = page.locator('mat-slide-toggle').filter({ hasText: /cykliczny/i });
    await expect(recurringToggle).toBeVisible();

    // Toggle on
    await recurringToggle.click();

    // Day of month field should now be visible
    await expect(page.getByLabel('Dzień miesiąca')).toBeVisible();
    await expect(page.getByLabel('Dzień miesiąca')).toHaveValue('1');
  });
});
