/*
 * Per-test isolation for the server integration suite.
 *
 * Registered via setupFilesAfterEnv (see jest.config.js). After every test the
 * data it created is truncated, so tests never see each other's records. The
 * knex connection is closed once the file's tests are done.
 */

const { clearData, closeKnex } = require('./db');

afterEach(async () => {
  await clearData();
});

afterAll(async () => {
  await closeKnex();
});
