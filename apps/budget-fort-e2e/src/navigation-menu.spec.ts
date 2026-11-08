// spec: docs/specs/budget/przeglad-historii-budzetu.md
// Tests for flat sidebar navigation menu

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

test.describe('Navigation Menu – flat sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature-transaction');
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({
      timeout: 5000,
    });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-4
  test('AC-4: Menu displays 4 direct items without expansion panels', async ({ page }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');

    const panels = drawer.locator('mat-expansion-panel');
    await expect(panels).toHaveCount(0);

    await expect(drawer.getByText('Strona główna').first()).toBeVisible();
    await expect(drawer.getByText('Dashboard').first()).toBeVisible();
    await expect(drawer.getByText('Budżet').first()).toBeVisible();
    await expect(drawer.getByText('Ustawienia').first()).toBeVisible();
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-5
  test('AC-5: Clicking "Strona główna" navigates to home page and closes drawer', async ({
    page,
  }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');
    const stronaGlowna = drawer.getByText('Strona główna').first();
    await expect(stronaGlowna).toBeVisible({ timeout: 3000 });

    await stronaGlowna.click();
    await expect(page.locator('transaction-navigation-drawer')).not.toBeVisible({
      timeout: 3000,
    });
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({
      timeout: 5000,
    });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-6
  test('AC-6: Clicking "Budżet" link navigates directly to budget page', async ({ page }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');
    const budzetLink = drawer.getByText('Budżet').first();
    await expect(budzetLink).toBeVisible({ timeout: 3000 });

    await budzetLink.click();
    await expect(page.getByText('Budżet miesięczny').first()).toBeVisible({
      timeout: 5000,
    });
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-7
  test('AC-7: Clicking "Ustawienia" link navigates directly to settings page', async ({ page }) => {
    await openNavigationDrawer(page);

    const drawer = page.locator('transaction-navigation-drawer');
    const ustawieniaLink = drawer.getByText('Ustawienia').first();
    await expect(ustawieniaLink).toBeVisible({ timeout: 3000 });
    await ustawieniaLink.click();

    await expect(page.getByText('Kategorie i podkategorie').first()).toBeVisible({
      timeout: 5000,
    });
  });
});
