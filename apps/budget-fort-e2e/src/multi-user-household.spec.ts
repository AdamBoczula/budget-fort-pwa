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
});
