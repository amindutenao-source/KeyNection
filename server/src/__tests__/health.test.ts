import { healthHandler } from '../routes/health';
import type { Request, Response } from 'express';

describe('Health endpoint', () => {
  it('returns a healthy response', async () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    healthHandler({} as Request, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'KeyNection API is running'
      })
    );
  });
});
