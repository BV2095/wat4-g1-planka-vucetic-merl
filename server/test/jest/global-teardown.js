/*
 * Lowers the Sails application after the integration test suite finishes.
 */

module.exports = async function globalTeardown() {
  const sails = globalThis.sailsTestApp;

  if (!sails) {
    return;
  }

  await new Promise((resolve) => {
    sails.lower(() => resolve());
  });
};
