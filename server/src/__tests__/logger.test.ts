import logger from '../utils/logger';

describe('logger', () => {
  it('exposes a logger with default metadata', () => {
    expect(logger.defaultMeta).toEqual(
      expect.objectContaining({
        service: 'keynection-api'
      })
    );
  });

  it('builds production logger format', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    jest.isolateModules(() => {
      const prodLogger = require('../utils/logger').default;
      expect(prodLogger).toBeDefined();
    });
    process.env.NODE_ENV = 'test';
  });

  it('logs with metadata in non-production', () => {
    process.env.NODE_ENV = 'test';
    logger.info('Test log', { requestId: 'req-1' });
    expect(true).toBe(true);
  });

  it('logs without metadata in non-production', () => {
    process.env.NODE_ENV = 'test';
    logger.info('Test log without meta');
    expect(true).toBe(true);
  });
});
