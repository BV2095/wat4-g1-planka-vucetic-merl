/*
 * Shared login helper for the E2E tests. Credentials match the demo admin that
 * the docker-compose stack seeds (DEFAULT_ADMIN_* in docker-compose.yml).
 */

export const ADMIN = {
  emailOrUsername: 'demo',
  password: 'demo',
  name: 'Demo Demo',
};

// On a fresh instance the first valid login shows a terms-acceptance modal.
// Already-initialized instances skip it, so we only act if it appears.
async function acceptTermsIfPresent(page) {
  const continueButton = page.locator('.ui.modal button.positive');

  try {
    await continueButton.waitFor({ state: 'visible', timeout: 4000 });
  } catch {
    return; // no terms modal — terms were already accepted
  }

  // Tick every confirmation checkbox, then continue.
  const checkboxes = page.locator('.ui.modal .ui.checkbox');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i += 1) {
    await checkboxes.nth(i).click();
  }

  await continueButton.click();
}

export async function login(page, emailOrUsername = ADMIN.emailOrUsername, password = ADMIN.password) {
  await page.goto('/login');
  await page.fill('input[name="emailOrUsername"]', emailOrUsername);
  await page.fill('input[name="password"]', password);
  await page.click('button.primary');
  await acceptTermsIfPresent(page);
}
