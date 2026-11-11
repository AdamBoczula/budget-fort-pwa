// spec: docs/specs/auth/01-firebase-authentication.md

import { test, expect } from '@playwright/test';

test.describe('Authentication & Route Guard Flow', () => {
  // covers: docs/specs/auth/01-firebase-authentication.md#AC-6
  test('AC-6: Unauthenticated user is redirected to /auth/login with returnUrl', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/auth\/login\?returnUrl=%2Fsettings/);

    // Login card should be visible
    await expect(page.locator('.bf-auth-page__card')).toBeVisible();
    await expect(page.locator('.bf-auth-page__logo')).toContainText('Budget Fort');
    await expect(page.locator('input[formControlName="email"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('.bf-google-btn')).toBeVisible();
    await expect(page.locator('.bf-auth-page__guest-btn')).toBeVisible();
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-5
  test('AC-5: User can click "Używaj lokalnie" to enter app in guest mode', async ({ page }) => {
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const guestBtn = page.locator('.bf-auth-page__guest-btn');
    await expect(guestBtn).toBeVisible();

    await guestBtn.click();

    // After guest mode, user should be redirected to root / (or /home)
    await expect(page).toHaveURL(/localhost:4200(\/home)?$/);
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 10000 });
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-3
  test('AC-3: User can navigate to register page and see form validation', async ({ page }) => {
    await page.goto('/auth/login');
    const registerLink = page.locator('a[routerLink="/auth/register"]');
    await registerLink.click();

    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.locator('input[formControlName="email"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('input[formControlName="confirmPassword"]')).toBeVisible();

    // Check submit button is disabled initially
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-8
  test('AC-8: Guest user can open drawer and logout, redirecting back to login', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('.bf-auth-page__guest-btn').click();
    await expect(page.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 10000 });

    // Open navigation drawer
    const menuBtn = page.getByRole('button', { name: /otworz nawigacj/i });
    await menuBtn.click();
    await expect(page.locator('transaction-navigation-drawer')).toBeVisible();

    // Click logout button
    const logoutBtn = page.locator('button.logout-btn');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Should redirect back to /auth/login
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
