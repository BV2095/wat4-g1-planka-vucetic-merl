import { test, expect } from '@playwright/test';

import { login, ADMIN } from './support/login';

/*
 * E2E TEST — Projects (1 test, owner: Vučetić)
 *   - creates a project through the UI and sees it appear
 */

test('creates a project through the UI', async ({ page }) => {
  await login(page);
  await expect(page.getByText(ADMIN.name)).toBeVisible();

  const projectName = `E2E Project ${Date.now()}`;

  await page.getByTestId('home-add-project').first().click();

  // Fill the name and submit by pressing Enter.
  await page.fill('input[name="name"]', projectName);
  await page.keyboard.press('Enter');

  await expect(page.getByText(projectName)).toBeVisible();
});
