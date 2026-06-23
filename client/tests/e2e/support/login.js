/*
 * Shared login helper for the E2E tests. Credentials match the demo admin that
 * the docker-compose stack seeds (DEFAULT_ADMIN_* in docker-compose.yml).
 */

export const ADMIN = {
  emailOrUsername: 'demo',
  password: 'demo',
  name: 'Demo Demo',
};

export async function login(page, emailOrUsername = ADMIN.emailOrUsername, password = ADMIN.password) {
  await page.goto('/login');
  await page.fill('input[name="emailOrUsername"]', emailOrUsername);
  await page.fill('input[name="password"]', password);
  await page.click('button.primary');
}
