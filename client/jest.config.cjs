/*
 * Jest configuration for CLIENT UNIT tests.
 *
 * The client owns the UNIT layer of the test pyramid: pure functions and
 * utilities, using the *.test.js naming convention. They run in a plain Node
 * environment (no DOM) and only need @babel/preset-env to strip ES module
 * syntax. Component rendering / integration is intentionally NOT done here —
 * integration is covered on the server (supertest against the Sails API).
 */

module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.js'],
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['@babel/preset-env'] }],
  },
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/utils/**/*.js', '!src/**/*.test.js'],
  coverageDirectory: 'coverage',
};
