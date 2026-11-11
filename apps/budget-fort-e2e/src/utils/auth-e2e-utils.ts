// spec: docs/specs/auth/01-firebase-authentication.md

import { Page } from '@playwright/test';

export async function setGuestMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('bf_guest_mode', 'true');
  });
}
