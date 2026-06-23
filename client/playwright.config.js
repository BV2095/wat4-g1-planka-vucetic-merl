import { defineConfig, devices } from '@playwright/test';

/*
 * Playwright configuration for END-TO-END tests.
 *
 * Tests run against a full, already-running PLANKA stack. By default we target
 * the docker-compose stack on http://localhost:3000 (see docker-compose.yml);
 * override with the E2E_BASE_URL environment variable when needed.
 */

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
