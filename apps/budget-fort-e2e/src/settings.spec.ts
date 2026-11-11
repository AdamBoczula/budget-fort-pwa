import { test, expect } from '@playwright/test';
import { setGuestMode } from './utils/auth-e2e-utils';

test.describe('Settings – category CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
  });

  test('should open add category dialog when clicking Dodaj kategorię button', async ({ page }) => {
    await page.goto('/feature-transaction/settings');

    // Wait for the settings page to load
    await expect(page.getByText('Kategorie i podkategorie')).toBeVisible({
      timeout: 5000,
    });

    // Click "Dodaj kategorię" button
    const addBtn = page.getByRole('button', { name: /dodaj kategorię/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify the dialog opens
    await expect(page.locator('mat-dialog-container')).toBeVisible({
      timeout: 3000,
    });

    // Verify dialog title indicates add mode (not edit mode)
    await expect(page.getByRole('heading', { name: /^dodaj kategorię$/i })).toBeVisible();

    // Verify the category name input field is visible in the dialog
    await expect(page.getByLabel('Nazwa kategorii')).toBeVisible();

    // Verify save (Dodaj) and cancel buttons are present
    await expect(page.getByRole('button', { name: /dodaj$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /anuluj/i })).toBeVisible();

    // Close the dialog
    await page.getByRole('button', { name: /anuluj/i }).click();
    await expect(page.locator('mat-dialog-container')).toBeHidden();
  });
});
