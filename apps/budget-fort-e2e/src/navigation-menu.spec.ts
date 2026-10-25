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
  test('AC-5: Transakcje panel has "Strona główna" and "Dashboard" items', async ({ page }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');

    // Expand "Transakcje" group
    await drawer.getByText('Transakcje').first().click();

    // Verify sub-items are visible (accordion redesign: "Dodaj nowe" replaced with "Strona główna" + "Dashboard")
    const stronaGlowna = drawer.getByText('Strona główna').first();
    const dashboard = drawer.getByText('Dashboard').first();
    await expect(stronaGlowna).toBeVisible({ timeout: 3000 });
    await expect(dashboard).toBeVisible({ timeout: 3000 });

    // Click "Strona główna" → should navigate to home page and close drawer
    await stronaGlowna.click();
    await expect(page.locator('transaction-navigation-drawer')).not.toBeVisible({
      timeout: 3000,
    });
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({
      timeout: 5000,
    });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-6
  test('AC-6: "Budżet" group has "Planowanie budżetu" link that navigates correctly', async ({
    page,
  }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');

    // Expand "Budżet" group
    await drawer.getByText('Budżet').first().click();

    // Verify the sub-item is visible (UI-02: renamed from "Dodaj nowy" to "Planowanie budżetu")
    const planowanie = drawer.getByText('Planowanie budżetu').first();
    await expect(planowanie).toBeVisible({ timeout: 3000 });

    // Click "Planowanie budżetu" → should navigate to budget settings
    await planowanie.click();
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
    await expect(drawer.getByText('Strona główna').first()).toBeVisible({ timeout: 3000 });

    // Expand "Budżet" group — should collapse Transakcje
    await drawer.getByText('Budżet').first().click();
    await expect(drawer.getByText('Planowanie budżetu').first()).toBeVisible({ timeout: 3000 });

    // "Strona główna" (from Transakcje) should be hidden now
    await expect(drawer.getByText('Strona główna').first()).not.toBeVisible({ timeout: 3000 });

    // Expand "Ustawienia" group — should collapse Budżet
    await drawer.getByText('Ustawienia').first().click();
    await expect(drawer.getByText('Planowanie budżetu').first()).not.toBeVisible({ timeout: 3000 });
  });
});