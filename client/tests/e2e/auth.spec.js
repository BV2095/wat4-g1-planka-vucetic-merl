import { test, expect } from '@playwright/test';

import { login, ADMIN } from './support/login';

/*
 * E2E TESTS — Authentication (3 tests)
 *   - logs in and lands on the home page       (owner: Merl)
 *   - logs out back to the login page          (owner: Merl)
 *   - shows an error for invalid credentials   (owner: Vučetić)
 */

test.describe('Authentication', () => {
  test('logs in with valid credentials and lands on the home page', async ({ page }) => {
    await login(page);

    // Header shows the logged-in user's name, and we left the /login route.
    await expect(page.getByText(ADMIN.name)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('logs out and returns to the login page', async ({ page }) => {
    await login(page);
    await expect(page.getByText(ADMIN.name)).toBeVisible();

    await page.getByText(ADMIN.name).click(); // open the user menu
    await page.getByTestId('user-action-logout').click();

    await expect(page.locator('input[name="emailOrUsername"]')).toBeVisible();
  });

  test('shows an error message for invalid credentials', async ({ page }) => {
    await login(page, 'demo', 'wrong-password');

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
});
