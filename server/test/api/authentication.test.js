/*
 * INTEGRATION TESTS — Authentication (3 tests, owner: Merl)
 *
 * Exercise the real login endpoint and the auth policy middleware against the
 * lifted Sails app with a seeded admin user (seeded in test/jest/global-setup.js).
 */

const { api, login } = require('../support/auth');
const { ADMIN } = require('../support/fixtures');

describe('Authentication', () => {
  test('logs in with valid admin credentials and returns an access token', async () => {
    const response = await login(ADMIN.username, ADMIN.password);

    expect(response.status).toBe(200);
    expect(typeof response.body.item).toBe('string');
    // A JWT consists of three dot-separated segments.
    expect(response.body.item.split('.')).toHaveLength(3);
  });

  test('rejects login with a wrong password', async () => {
    const response = await login(ADMIN.username, 'wrong-password');

    expect(response.status).toBe(401);
    expect(response.body.item).toBeUndefined();
  });

  test('rejects unauthenticated access to a protected endpoint with 401', async () => {
    const response = await api().get('/api/projects');

    expect(response.status).toBe(401);
  });
});
