import { test, expect } from '@playwright/test';
import { seedCurrentMonthTransactions } from './utils/seed-transactions';

test.describe('Transaction edit dirty check', () => {
  test('should disable save button until a change is made', async ({ page }) => {
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 5000 });
    await seedCurrentMonthTransactions(page, 1);
    await page.reload();

    await expect(page.getByTestId('last-transaction-item').first()).toBeVisible({ timeout: 5000 });
    await page.locator('button[aria-label="Edytuj transakcję"]').first().click();

    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 3000 });
    const saveBtn = page.getByRole('button', { name: /Zapisz/i });
    await expect(saveBtn).toBeDisabled();

    await page.getByPlaceholder('0.00').fill('99.99');
    await expect(saveBtn).not.toBeDisabled();

    await page.getByRole('button', { name: /Anuluj/i }).click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible();
  });
});
