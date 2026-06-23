/*
 * Lifts the Sails application once before the integration test suite runs.
 *
 * Mirrors the upstream Mocha lifecycle (test/lifecycle.test.js) but adapted to
 * Jest's globalSetup hook. The lifted Sails instance is stored on globalThis so
 * that globalTeardown (which runs in the same Jest parent process) can lower it.
 */

const dotenv = require('dotenv');
const sails = require('sails');
const rc = require('sails/accessible/rc');

module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';

  // Allow a local .env to provide extra config, but test datastore stays
  // in-memory via config/env/test.js regardless.
  dotenv.config({ quiet: true });

  // Sails requires these to lift (see config/custom.js / security config).
  // In CI / local runs no .env exists, so provide safe test defaults. The
  // datastore is overridden to in-memory sails-disk in config/env/test.js.
  process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:1337';
  process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/planka_test';

  await new Promise((resolve, reject) => {
    sails.lift(rc('sails'), (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  // Expose the base URL so test files (running in worker processes) can reach
  // the HTTP server lifted here in the parent process.
  const port = sails.config.port || 1337;
  process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${port}`;

  globalThis.sailsTestApp = sails;
};
