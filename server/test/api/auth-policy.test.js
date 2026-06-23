/*
 * SMOKE INTEGRATION TEST (server)
 *
 * Proves the Jest integration setup works end-to-end: Sails is lifted (in-memory
 * datastore) and we hit real HTTP endpoints through supertest.
 *
 * We assert that the authentication policy middleware is wired up: an
 * unauthenticated request to a protected endpoint is rejected with 401. This
 * needs no seeded data, so it runs against the clean in-memory database.
 */

const request = require('supertest');

const baseUrl = () => process.env.TEST_BASE_URL || 'http://localhost:1337';

describe('authentication policy', () => {
  test('rejects unauthenticated access to a protected endpoint with 401', async () => {
    const response = await request(baseUrl()).get('/api/projects');

    expect(response.status).toBe(401);
  });
});
