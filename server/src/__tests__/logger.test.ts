import logger from '../utils/logger';

describe('logger', () => {
  it('exposes a logger with default metadata', () => {
    expect(logger.defaultMeta).toEqual(
      expect.objectContaining({
        service: 'keynection-api'
      })
    );
  });
});
