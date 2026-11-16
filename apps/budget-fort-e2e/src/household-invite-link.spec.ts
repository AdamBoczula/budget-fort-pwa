// spec: docs/specs/sync/03-household-invite-link.md

import { test, expect } from '@playwright/test';
import { setGuestMode } from './utils/auth-e2e-utils';

test.describe('Household Invite Link E2E', () => {
  // covers: docs/specs/sync/03-household-invite-link.md#AC-6
  test('should display error message when navigating to /join without an invite code', async ({
    page,
  }) => {
    await page.goto('/join');

    const errorMsg = page.getByTestId('join-household-error-msg');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
    await expect(errorMsg).toContainText('Brak kodu zaproszenia w linku.');

    const dashboardBtn = page.getByTestId('join-error-dashboard-btn');
    await expect(dashboardBtn).toBeVisible();
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-3
  // covers: docs/specs/sync/03-household-invite-link.md#AC-4
  test('should save pending invite code in sessionStorage and redirect unauthenticated user to login with banner', async ({
    page,
  }) => {
    await page.goto('/join?code=BF89X2');

    // Should redirect to /auth/login
    await page.waitForURL('**/auth/login**', { timeout: 10000 });

    // Verify sessionStorage has pending invite code
    const storedCode = await page.evaluate(() => {
      return window.sessionStorage.getItem('bf_pending_invite_code');
    });
    expect(storedCode).toBe('BF89X2');

    // Verify banner is rendered on login screen
    const banner = page.getByTestId('pending-invite-banner');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText('Dołączasz do gospodarstwa domowego');
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-4
  test('should display pending invite banner on registration screen when pending invite is present', async ({
    page,
  }) => {
    await page.goto('/join?code=BF89X2');
    await page.waitForURL('**/auth/login**', { timeout: 10000 });

    // Navigate to register screen
    await page.getByRole('link', { name: /Zarejestruj się/i }).click();
    await page.waitForURL('**/auth/register**', { timeout: 5000 });

    // Verify banner is visible on register screen
    const banner = page.getByTestId('pending-invite-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Dołączasz do gospodarstwa domowego');
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-1
  test('should render copy invite link and copy code buttons in household section', async ({
    page,
  }) => {
    await setGuestMode(page);
    await page.goto('/feature-transaction/settings');

    const section = page.getByTestId('settings-household-section');
    await expect(section).toBeVisible({ timeout: 10000 });
    await expect(section.getByText('Gospodarstwo domowe')).toBeVisible();
  });
});
