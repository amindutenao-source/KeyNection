const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: ['**/*.e2e.test.ts'],
  testPathIgnorePatterns: [],
  testTimeout: 30000,
  maxWorkers: 1
};
