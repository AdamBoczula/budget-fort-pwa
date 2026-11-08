import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium, defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

function resolveChromiumExecutablePath(): string | undefined {
  const defaultPath = chromium.executablePath();
  if (existsSync(defaultPath)) {
    return undefined;
  }
  const cacheDir = join(homedir(), '.cache', 'ms-playwright');
  if (existsSync(cacheDir)) {
    const entries = readdirSync(cacheDir).filter((name) => name.startsWith('chromium-'));
    for (const entry of entries) {
      const candidate = join(cacheDir, entry, 'chrome-linux64', 'chrome');
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return undefined;
}

const customExecutablePath = resolveChromiumExecutablePath();

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly. Playwright's configLoader auto-discovers
 * `playwright.config.mts` via its extension list
 * (.ts/.js/.mts/.mjs/.cts/.cjs).
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  reporter: [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npx nx run budget-fort:serve',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    cwd: workspaceRoot,
  },
  // Note: Only Chromium is installed locally. Firefox and WebKit require
  // `npx playwright install firefox webkit` to be run first.
  // On CI, the workflow already runs `npx playwright install --with-deps`.
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(customExecutablePath
          ? { launchOptions: { executablePath: customExecutablePath } }
          : {}),
      },
    },

    // Firefox and WebKit require `npx playwright install firefox webkit` first.
    ...(process.env['PLAYWRIGHT_ALL_BROWSERS'] === 'true'
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
