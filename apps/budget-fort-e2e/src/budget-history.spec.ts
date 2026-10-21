// spec: docs/specs/budget/przeglad-historii-budzetu.md
// Tests for budget history browsing (DashboardPeriodSelector, read-only mode for past periods)

import { test, expect } from '@playwright/test';

test.describe('Budget History – period selector and read-only mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature-transaction/settings/budget');
    // Wait for either the budget page or a redirect
    await page.waitForLoadState('domcontentloaded');

    // If the budget page loaded, wait for it to finish loading
    const title = page.getByText('Budżet miesięczny').first();
    if (await title.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(page.locator('.settings-budget__loading')).not.toBeVisible({
        timeout: 5000,
      });
    }
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-1
  test('AC-1: Budget screen has period selector on load', async ({ page }) => {
    // The period selector is built into the budget screen now
    const periodSelector = page.locator('.period-selector');
    await expect(periodSelector).toBeVisible({ timeout: 5000 });

    // The period selector should have navigation arrows
    const leftArrow = periodSelector.getByRole('button', { name: /poprzedni okres/i });
    const rightArrow = periodSelector.getByRole('button', { name: /następny okres/i });
    await expect(leftArrow).toBeVisible({ timeout: 3000 });
    await expect(rightArrow).toBeVisible({ timeout: 3000 });

    // Verify mode toggle buttons exist (Miesiąc / Rok) — they render as radio buttons in mat-button-toggle-group
    await expect(periodSelector.getByRole('radio', { name: /Miesiąc/i })).toBeVisible({ timeout: 3000 });
    await expect(periodSelector.getByRole('radio', { name: /Rok/i })).toBeVisible({ timeout: 3000 });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-2
  test('AC-2: Navigate to previous month – read-only mode (no limits, no save button)', async ({
    page,
  }) => {
    // First verify we're in edit mode (current month)
    const saveButton = page.getByRole('button', { name: /Zapisz/i });

    // Navigate to previous month
    const leftArrow = page.locator('.period-selector')
      .getByRole('button', { name: /poprzedni okres/i });
    await expect(leftArrow).toBeEnabled({ timeout: 3000 });
    await leftArrow.click();

    // Wait for the page to update
    await page.waitForLoadState('domcontentloaded');

    // In read-only mode: limits section and save button should be hidden
    await expect(page.getByText('Limity kategorii').first()).not.toBeVisible({ timeout: 3000 });
    await expect(saveButton).not.toBeVisible({ timeout: 3000 });
    await expect(
      page.getByText('Kopiuj limity z poprzedniego').first()
    ).not.toBeVisible({ timeout: 3000 });

    // But the spending card should still be visible
    await expect(page.locator('budget-current-month-card')).toBeVisible({ timeout: 3000 });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-3
  test('AC-3: Return to current month – edit mode restored', async ({ page }) => {
    // Navigate to previous month first
    const leftArrow = page.locator('.period-selector')
      .getByRole('button', { name: /poprzedni okres/i });
    await leftArrow.click();
    await page.waitForLoadState('domcontentloaded');

    // Now navigate back to current month
    const rightArrow = page.locator('.period-selector')
      .getByRole('button', { name: /następny okres/i });
    await expect(rightArrow).toBeVisible({ timeout: 3000 });
    await rightArrow.click();

    // Verify right arrow is disabled (we're on current month)
    await expect(rightArrow).toBeDisabled({ timeout: 3000 });

    // Verify edit mode is restored
    await expect(page.getByText('Limity kategorii').first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /Zapisz/i })).toBeVisible({ timeout: 3000 });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-9
  test('AC-9: Future months blocked (next arrow disabled on current month)', async ({
    page,
  }) => {
    // On current month, the "Następny okres" (▶) button should be disabled
    const rightArrow = page.locator('.period-selector')
      .getByRole('button', { name: /następny okres/i });

    await expect(rightArrow).toBeVisible({ timeout: 3000 });
    await expect(rightArrow).toBeDisabled({ timeout: 3000 });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-10
  test('AC-10: Year mode shows yearly data', async ({ page }) => {
    const periodSelector = page.locator('.period-selector');

    // Switch to year mode
    const yearToggle = periodSelector.getByRole('radio', { name: /Rok/i });
    await expect(yearToggle).toBeVisible({ timeout: 3000 });
    await yearToggle.click();
    await page.waitForLoadState('domcontentloaded');

    // The period label should now show a year (e.g., "2026")
    const periodLabel = periodSelector.locator('.period-selector__label');
    const labelText = await periodLabel.textContent();
    expect(labelText?.trim()).toMatch(/^\d{4}$/);

    // Navigate to previous year
    const leftArrow = periodSelector.getByRole('button', { name: /poprzedni okres/i });
    await leftArrow.click();
    await page.waitForLoadState('domcontentloaded');

    // In year mode for a past year – read-only (no limits, no save)
    await expect(page.getByText('Limity kategorii').first()).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /Zapisz/i })).not.toBeVisible({ timeout: 3000 });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-12
  test('AC-12: Refresh returns to current month (default state)', async ({ page }) => {
    // Navigate to a previous month
    const leftArrow = page.locator('.period-selector')
      .getByRole('button', { name: /poprzedni okres/i });
    await leftArrow.click();
    await page.waitForLoadState('domcontentloaded');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Wait for budget page to load
    await expect(page.getByText('Budżet miesięczny').first()).toBeVisible({
      timeout: 5000,
    });

    // Verify we're on the current month (next arrow disabled)
    const rightArrow = page.locator('.period-selector')
      .getByRole('button', { name: /następny okres/i });
    await expect(rightArrow).toBeDisabled({ timeout: 3000 });

    // Verify edit mode (limits section visible)
    await expect(page.getByText('Limity kategorii').first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /Zapisz/i })).toBeVisible({ timeout: 3000 });
  });
});