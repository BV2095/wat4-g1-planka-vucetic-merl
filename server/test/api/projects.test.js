/*
 * INTEGRATION TESTS — Projects (3 tests, owner: Vučetić)
 *
 * Exercise the projects API end-to-end (HTTP -> Sails -> PostgreSQL) with real
 * authentication. Data created here is truncated after each test
 * (test/support/jest-hooks.js), so the tests stay independent.
 */

const { api, getToken, authHeader } = require('../support/auth');
const { MEMBER } = require('../support/fixtures');

describe('Projects', () => {
  test('an admin can create a project', async () => {
    const token = await getToken();

    const response = await api()
      .post('/api/projects')
      .set(authHeader(token))
      .send({ type: 'private', name: 'Integration Test Project' });

    expect(response.status).toBe(200);
    expect(response.body.item.name).toBe('Integration Test Project');
    expect(typeof response.body.item.id).toBe('string');
    // The creator is automatically added as a project manager.
    expect(response.body.included.projectManagers).toHaveLength(1);
  });

  test('a created project shows up in the projects list', async () => {
    const token = await getToken();

    await api()
      .post('/api/projects')
      .set(authHeader(token))
      .send({ type: 'private', name: 'Listed Project' });

    const response = await api().get('/api/projects').set(authHeader(token));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    const names = response.body.items.map((project) => project.name);
    expect(names).toContain('Listed Project');
  });

  test('a non-admin board user cannot create a project', async () => {
    const token = await getToken(MEMBER);

    const response = await api()
      .post('/api/projects')
      .set(authHeader(token))
      .send({ type: 'private', name: 'Forbidden Project' });

    // Planka's authorization policy hides the action behind a 404 (see
    // api/policies/is-admin-or-project-owner.js).
    expect(response.status).toBe(404);
  });
});
