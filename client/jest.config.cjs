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
  // Non-JS imports (images, styles) are irrelevant to unit tests — stub them so
  // modules that transitively import assets can still be loaded.
  moduleNameMapper: {
    '\\.(png|jpe?g|gif|svg|css|scss)$': '<rootDir>/tests/asset-stub.cjs',
  },
  clearMocks: true,
  collectCoverage: true,
  // Scope coverage to the utilities our unit tests actually target.
  collectCoverageFrom: [
    'src/utils/merge-records.js',
    'src/utils/stopwatch.js',
    'src/utils/validator.js',
    'src/utils/mentions.js',
  ],
  coverageDirectory: 'coverage',
};
