// spec: docs/specs/pwa/01-app-update-and-maintenance-banner.md

import { test, expect } from '@playwright/test';
import { setGuestMode } from './utils/auth-e2e-utils';

test.describe('PWA Updates & Maintenance Banner E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setGuestMode(page);
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-3
  test('should not render maintenance banner by default when no announcements exist', async ({
    page,
  }) => {
    await page.goto('/feature-transaction/home');

    const banner = page.locator('.maintenance-banner');
    await expect(banner).toHaveCount(0);
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-3
  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-4
  test('should display active maintenance announcement and allow dismissing it', async ({
    page,
  }) => {
    await page.goto('/feature-transaction/home');

    // Set announcement in localStorage and reload
    await page.evaluate(() => {
      const ann = {
        id: 'e2e-maint-1',
        title: 'Przerwa techniczna',
        message: 'Planowane prace serwisowe w godzinach nocnych.',
        severity: 'warning',
        startDate: new Date(Date.now() - 3600000).toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
        dismissible: true,
      };
      window.localStorage.setItem('bf_active_announcement', JSON.stringify(ann));
    });

    await page.reload();

    // Banner should be visible
    const banner = page.locator('.maintenance-banner');
    await expect(banner).toBeVisible({ timeout: 10000 });
    await expect(banner).toHaveClass(/maintenance-banner--warning/);
    await expect(banner.getByText('Przerwa techniczna')).toBeVisible();
    await expect(banner.getByText('Planowane prace serwisowe w godzinach nocnych.')).toBeVisible();

    // Dismiss banner
    const closeBtn = page.locator('.maintenance-banner__close');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Banner should now be hidden
    await expect(banner).toHaveCount(0);

    // Reload page — banner should remain dismissed
    await page.reload();
    await expect(page.locator('.maintenance-banner')).toHaveCount(0);
  });
});
