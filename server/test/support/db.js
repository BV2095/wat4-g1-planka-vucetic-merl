/*
 * Direct database access for the integration tests.
 *
 * Tests reach the app over HTTP (supertest), but for test isolation they also
 * need to wipe the data they create. This module opens a knex connection to the
 * same test database (DATABASE_URL, set by global-setup) and exposes a
 * clearData() helper that truncates every table EXCEPT the baseline rows the
 * suite depends on (the seeded admin user and the singleton internal config).
 */

const Knex = require('knex');

const knexConfig = require('../../db/knexfile');

// Tables that hold the seeded baseline and must survive between tests.
const PRESERVED_TABLES = ['migration', 'user_account', 'internal_config'];

let knex;

const getKnex = () => {
  if (!knex) {
    knex = Knex(knexConfig);
  }
  return knex;
};

// Truncates all data tables (keeping the baseline) so each test starts clean.
const clearData = async () => {
  const db = getKnex();

  const { rows } = await db.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");

  const tables = rows
    .map((row) => row.tablename)
    .filter((name) => !PRESERVED_TABLES.includes(name));

  if (tables.length === 0) {
    return;
  }

  const quoted = tables.map((name) => `"${name}"`).join(', ');
  await db.raw(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
};

const closeKnex = async () => {
  if (knex) {
    await knex.destroy();
    knex = undefined;
  }
};

module.exports = {
  getKnex,
  clearData,
  closeKnex,
};
