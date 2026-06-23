/*
 * Shared test fixtures for the server integration suite.
 *
 * These users are seeded into the test database by the Jest globalSetup
 * (test/jest/global-setup.js) and reused by the tests to log in. Keeping the
 * credentials in one place keeps seeding and assertions in sync.
 */

// Admin user — created by the knex baseline seed via DEFAULT_ADMIN_* env vars.
const ADMIN = {
  email: 'demo@demo.demo',
  username: 'demo',
  password: 'demo',
  name: 'Demo Demo',
};

// Regular (board) user — created post-lift; used to test authorization.
const MEMBER = {
  email: 'member@demo.demo',
  username: 'member',
  password: 'member',
  name: 'Member User',
};

module.exports = {
  ADMIN,
  MEMBER,
};
