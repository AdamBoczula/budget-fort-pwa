// spec: docs/specs/settings/data-export-import.md

import { test, expect } from '@playwright/test';
import { setGuestMode } from './utils/auth-e2e-utils';

test.describe('Settings – Data Backup & Restore', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
  });

  // covers: docs/specs/settings/data-export-import.md#AC-1
  test('should display backup section with export and import buttons', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText('Kopia zapasowa i dane')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="export-backup-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-backup-btn"]')).toBeVisible();
  });

  // covers: docs/specs/settings/data-export-import.md#AC-2
  // covers: docs/specs/settings/data-export-import.md#AC-3
  test('should open restore confirmation dialog on valid JSON upload and require phrase', async ({
    page,
  }) => {
    await page.goto('/settings');
    await expect(page.getByText('Kopia zapasowa i dane')).toBeVisible({ timeout: 10000 });

    const validBackupPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        transactions: [
          { id: 'tx-e2e', amount: 120, date: '2026-11-10', categoryId: 'c-1', accountId: 'a-1' },
        ],
        categories: [{ id: 'c-1', name: 'Rachunki' }],
        subcategories: [],
        budgets: [{ id: 1, amount: 2500, updatedAt: '2026-11-10' }],
        categoryBudgets: [],
        settings: { currency: 'PLN', theme: null },
      },
    };

    // Upload file using setInputFiles on hidden file input
    const fileChooserInput = page.locator('[data-testid="backup-file-input"]');
    await fileChooserInput.setInputFiles({
      name: 'test-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(validBackupPayload)),
    });

    // Confirmation dialog should be visible
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Przywracanie kopii zapasowej')).toBeVisible();

    const submitBtn = page.locator('[data-testid="restore-confirm-submit-btn"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // Type incorrect phrase
    const input = page.locator('[data-testid="restore-confirm-input"]');
    await input.fill('niepoprawny');
    await expect(submitBtn).toBeDisabled();

    // Type guest confirmation phrase
    await input.fill('użytkownik gość');
    await expect(submitBtn).toBeEnabled();

    // Cancel to not alter state
    await page.getByRole('button', { name: /anuluj/i }).click();
    await expect(page.locator('mat-dialog-container')).toBeHidden();
  });
});
