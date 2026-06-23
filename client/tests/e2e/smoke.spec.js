import { test, expect } from '@playwright/test';

/*
 * SMOKE E2E TEST
 *
 * Proves the Playwright setup works against a running PLANKA stack: the login
 * page loads and shows the login form.
 */

test('login page loads and shows the login form', async ({ page }) => {
  await page.goto('/login');

  // The email/username field is the anchor of the login form.
  const input = page.locator('input[name="emailOrUsername"]');
  await expect(input).toBeVisible();
});
