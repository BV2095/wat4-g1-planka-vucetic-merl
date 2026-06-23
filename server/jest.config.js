/*
 * Jest configuration for SERVER INTEGRATION tests.
 *
 * Integration tests run against a real, lifted Sails application. Sails is
 * lifted exactly once (globalSetup) and lowered once (globalTeardown). In the
 * test environment (NODE_ENV=test) Sails uses an in-memory sails-disk
 * datastore (see config/env/test.js), so no external database is required and
 * every run starts from a clean, isolated state.
 *
 * Tests talk to the lifted app over HTTP via supertest against TEST_BASE_URL,
 * which keeps them independent from the Sails instance running in the main
 * Jest process.
 */

module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/api/**/*.test.js'],
  globalSetup: '<rootDir>/test/jest/global-setup.js',
  globalTeardown: '<rootDir>/test/jest/global-teardown.js',
  setupFilesAfterEnv: ['<rootDir>/test/support/jest-hooks.js'],
  // Sails is a shared resource, so run integration test files serially.
  maxWorkers: 1,
  testTimeout: 30000,
  clearMocks: true,
  // Sails keeps sockets/handles open; force exit after teardown lowers it.
  forceExit: true,
};
