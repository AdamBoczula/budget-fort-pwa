// spec: docs/specs/sync/02-multi-user-household.md

import { test, expect } from '@playwright/test';
import { setGuestMode } from './utils/auth-e2e-utils';

test.describe('Multi-user Household E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-4
  test('should display household section with guest banner in settings when in guest mode', async ({
    page,
  }) => {
    await page.goto('/feature-transaction/settings');

    // Verify household section is rendered in settings
    const section = page.getByTestId('settings-household-section');
    await expect(section).toBeVisible({ timeout: 10000 });
    await expect(section.getByText('Gospodarstwo domowe')).toBeVisible();

    // Verify guest banner is displayed
    const guestBanner = page.getByTestId('household-guest-banner');
    await expect(guestBanner).toBeVisible();
    await expect(guestBanner).toContainText(
      'Współdzielenie budżetu z domownikami wymaga zalogowania',
    );
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-3
  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  test('should simulate two devices adding transactions offline and keeping state isolated until sync', async ({
    browser,
  }) => {
    // 1. Device A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await setGuestMode(pageA);
    await pageA.goto('/feature-transaction');
    await expect(pageA.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 10000 });

    // 2. Device B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await setGuestMode(pageB);
    await pageB.goto('/feature-transaction');
    await expect(pageB.locator('.categories-quick-add__grid')).toBeVisible({ timeout: 10000 });

    // 3. Take both devices offline
    await contextA.setOffline(true);
    await contextB.setOffline(true);

    // 4. Device A creates a transaction offline
    await pageA.locator('.category-card').first().click();
    await expect(pageA.locator('mat-dialog-container')).toBeVisible({ timeout: 5000 });
    await pageA.getByPlaceholder('0.00').fill('100');
    await pageA.getByPlaceholder('Np. Obiad w pracy').fill('Device A offline tx');
    await pageA.getByRole('button', { name: /Zapisz/i }).click();
    await expect(pageA.locator('mat-dialog-container')).toBeHidden({ timeout: 5000 });

    // Verify Device A displays its offline transaction
    await expect(pageA.getByText('Device A offline tx')).toBeVisible();

    // 5. Device B creates a transaction offline
    await pageB.locator('.category-card').first().click();
    await expect(pageB.locator('mat-dialog-container')).toBeVisible({ timeout: 5000 });
    await pageB.getByPlaceholder('0.00').fill('50');
    await pageB.getByPlaceholder('Np. Obiad w pracy').fill('Device B offline tx');
    await pageB.getByRole('button', { name: /Zapisz/i }).click();
    await expect(pageB.locator('mat-dialog-container')).toBeHidden({ timeout: 5000 });

    // Verify Device B displays its own offline transaction, and not Device A's
    await expect(pageB.getByText('Device B offline tx')).toBeVisible();
    await expect(pageB.getByText('Device A offline tx')).toHaveCount(0);

    // 6. Both devices come back online
    await contextA.setOffline(false);
    await contextB.setOffline(false);

    // Transactions remain safely stored in local IndexedDB without data loss
    await expect(pageA.getByText('Device A offline tx')).toBeVisible();
    await expect(pageB.getByText('Device B offline tx')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
