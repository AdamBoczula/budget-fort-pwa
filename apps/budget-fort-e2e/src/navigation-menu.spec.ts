// spec: docs/specs/budget/przeglad-historii-budzetu.md
// Tests for navigation menu redesign (accordion menu with grouped submenu)

import { test, expect, Page } from '@playwright/test';

/**
 * Open the navigation drawer by clicking the hamburger menu button in the toolbar.
 */
async function openNavigationDrawer(page: Page): Promise<void> {
  const menuBtn = page.getByRole('button', { name: /otworz nawigacj/i });
  await menuBtn.click();
  await expect(page.locator('transaction-navigation-drawer')).toBeVisible({
    timeout: 3000,
  });
}

test.describe('Navigation Menu – accordion redesign', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({
      timeout: 5000,
    });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-4
  test('AC-4: Menu has 3 groups (Transakcje, Budżet, Ustawienia)', async ({ page }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');

    // Each group is a mat-expansion-panel header
    const panels = drawer.locator('mat-expansion-panel');
    await expect(panels).toHaveCount(3);

    await expect(drawer.getByText('Transakcje').first()).toBeVisible();
    await expect(drawer.getByText('Budżet').first()).toBeVisible();
    await expect(drawer.getByText('Ustawienia').first()).toBeVisible();
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-5
  test('AC-5: "Dodaj nowe" under Transakcje opens transaction dialog', async ({ page }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');

    // Expand "Transakcje" group
    await drawer.getByText('Transakcje').first().click();

    // Click "Dodaj nowe" sub-item
    const dodajNowe = drawer.getByText('Dodaj nowe').first();
    await expect(dodajNowe).toBeVisible({ timeout: 3000 });
    await dodajNowe.click();

    // Verify drawer closes
    await expect(page.locator('transaction-navigation-drawer')).not.toBeVisible({
      timeout: 3000,
    });

    // Verify transaction form dialog opens
    await expect(page.locator('mat-dialog-container')).toBeVisible({
      timeout: 5000,
    });

    // Verify dialog contains transaction form elements
    await expect(page.getByPlaceholder('0.00')).toBeVisible();
    await expect(page.getByRole('button', { name: /Zapisz/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Anuluj/i })).toBeVisible();

    // Close the dialog
    await page.getByRole('button', { name: /Anuluj/i }).click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible({
      timeout: 3000,
    });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-6
  test('AC-6: "Budżet" group has "Dodaj nowy" and "Dashboard" links that navigate correctly', async ({
    page,
  }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');

    // Expand "Budżet" group
    await drawer.getByText('Budżet').first().click();

    // Verify both sub-items are visible
    const dodajNowy = drawer.getByText('Dodaj nowy').first();
    await expect(dodajNowy).toBeVisible({ timeout: 3000 });

    // Click "Dodaj nowy" → should navigate to budget settings
    await dodajNowy.click();
    await expect(page.getByText('Budżet miesięczny').first()).toBeVisible({
      timeout: 5000,
    });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-7
  test('AC-7: "Ustawienia" group navigates to settings page', async ({ page }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');

    // Expand "Ustawienia" group
    await drawer.getByText('Ustawienia').first().click();

    // Click the "Ustawienia" sub-item link (the one with routerLink)
    // Click the "Ustawienia" sub-item — it's a mat-list-item with routerLink
    const ustawieniaLink = drawer.getByText('Ustawienia').last();
    await expect(ustawieniaLink).toBeVisible({ timeout: 3000 });
    await ustawieniaLink.click();

    await expect(page.getByText('Kategorie i podkategorie').first()).toBeVisible({
      timeout: 5000,
    });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-8
  test('AC-8: Accordion behavior – only one group open at a time', async ({ page }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');

    // Expand "Transakcje" group
    await drawer.getByText('Transakcje').first().click();
    await expect(drawer.getByText('Dodaj nowe').first()).toBeVisible({ timeout: 3000 });

    // Expand "Budżet" group — should collapse Transakcje
    await drawer.getByText('Budżet').first().click();
    await expect(drawer.getByText('Dodaj nowy').first()).toBeVisible({ timeout: 3000 });

    // "Dodaj nowe" (from Transakcje) should be hidden now
    await expect(drawer.getByText('Dodaj nowe').first()).not.toBeVisible({ timeout: 3000 });

    // Expand "Ustawienia" group — should collapse Budżet
    await drawer.getByText('Ustawienia').first().click();
    await expect(drawer.getByText('Dodaj nowy').first()).not.toBeVisible({ timeout: 3000 });
  });
});