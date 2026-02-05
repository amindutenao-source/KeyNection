const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: ['**/*.e2e.test.ts'],
  testPathIgnorePatterns: [],
  testTimeout: 30000,
  maxWorkers: 1,
  setupFilesAfterEnv: [
    ...(baseConfig.setupFilesAfterEnv || []),
    '<rootDir>/src/test/e2e.setup.ts'
  ]
};
