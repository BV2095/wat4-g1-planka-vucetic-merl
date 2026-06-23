/*
 * Prepares the test database and lifts the Sails application once, before the
 * integration suite runs.
 *
 * Steps:
 *   1. Point the app at the dedicated test PostgreSQL database (DATABASE_URL).
 *   2. Run knex migrations + the baseline seed (admin user, singleton config).
 *      Both are idempotent, so the database can stay running between runs.
 *   3. Lift Sails against that database.
 *   4. Give the seeded admin a valid terms signature and mark the instance
 *      initialized, so a real login through POST /api/access-tokens succeeds.
 *
 * Per-test cleanup (truncating created data) is handled in test/support/db.js.
 */

const dotenv = require('dotenv');
const sails = require('sails');
const rc = require('sails/accessible/rc');
const Knex = require('knex');
const bcrypt = require('bcrypt');

const { ADMIN, MEMBER } = require('../support/fixtures');

const PRESERVED_TABLES = ['migration', 'user_account', 'internal_config'];

module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';

  dotenv.config({ quiet: true });

  // Default to the docker-compose.test.yml database; overridable via env (CI).
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/planka_test';
  process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:1337';
  process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';

  // Consumed by the knex baseline seed (db/seeds/default.js).
  process.env.DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || ADMIN.email;
  process.env.DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || ADMIN.password;
  process.env.DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || ADMIN.name;
  process.env.DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || ADMIN.username;

  // Migrate + seed the schema. Requiring the knexfile here (after DATABASE_URL is
  // set) ensures it picks up the test connection string.
  // eslint-disable-next-line global-require
  const knexConfig = require('../../db/knexfile');
  const knex = Knex(knexConfig);
  try {
    await knex.migrate.latest();
    await knex.seed.run();

    // Wipe leftover data from any previous run, keeping the baseline tables.
    const { rows } = await knex.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    const tables = rows
      .map((row) => row.tablename)
      .filter((name) => !PRESERVED_TABLES.includes(name));
    if (tables.length > 0) {
      const quoted = tables.map((name) => `"${name}"`).join(', ');
      await knex.raw(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
    }
  } finally {
    await knex.destroy();
  }

  await new Promise((resolve, reject) => {
    sails.lift(rc('sails'), (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  // Make the seeded admin able to log in: a matching terms signature skips the
  // "terms acceptance required" step, and an initialized instance skips the
  // first-login initialization branch.
  const { signature } = await sails.hooks.terms.getPayload();
  await User.updateOne({ email: ADMIN.email }).set({ termsSignature: signature });
  await InternalConfig.updateOne(InternalConfig.MAIN_ID).set({ isInitialized: true });

  // Seed a regular (board) user used by the authorization tests. Created here
  // (not by the knex seed) and kept across tests, since clearData() preserves
  // the user_account table.
  const existingMember = await User.qm.getOneByEmail(MEMBER.email);
  if (!existingMember) {
    await User.create({
      email: MEMBER.email,
      username: MEMBER.username,
      name: MEMBER.name,
      password: bcrypt.hashSync(MEMBER.password, 10),
      role: User.Roles.BOARD_USER,
      termsSignature: signature,
    }).fetch();
  }

  // Expose the base URL so test files (worker processes) can reach the server.
  const port = sails.config.port || 1337;
  process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${port}`;

  globalThis.sailsTestApp = sails;
};
