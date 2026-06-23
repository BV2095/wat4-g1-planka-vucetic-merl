/**
 * Test environment settings
 * (sails.config.*)
 *
 * Used when the app is lifted with NODE_ENV=test (see test/jest/global-setup.js).
 *
 * NOTE: We intentionally do NOT override `datastores` here. The integration
 * tests run against a real PostgreSQL database (configured via DATABASE_URL in
 * config/datastores.js) so that relational behaviour — associations and the
 * string primary keys Planka relies on — matches production. An in-memory
 * sails-disk store cannot reproduce that (it generates numeric ids and does not
 * apply the knex migrations). The test database is migrated once and the data
 * created by each test is truncated afterwards (see test/support/db.js).
 */

module.exports = {
  log: {
    level: 'warn',
  },
};
