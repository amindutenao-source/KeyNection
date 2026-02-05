const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: ['**/*.e2e.test.ts'],
  testTimeout: 30000,
  runInBand: true
};
