import type { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ValidationError,
  errorHandler
} from '../middleware/errorHandler';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  return res;
};

describe('errorHandler', () => {
  const req = {} as Request;
  const next = jest.fn() as NextFunction;

  it('handles AppError with custom status and code', () => {
    const res = createRes();
    const error = new AppError('Teapot', 418, 'TEAPOT');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Teapot',
        error: 'TEAPOT'
      })
    );
  });

  it('handles ValidationError with details', () => {
    const res = createRes();
    const error = new ValidationError('Bad input', { field: 'title' });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Bad input',
        error: 'VALIDATION_ERROR',
        details: { field: 'title' }
      })
    );
  });

  it('handles Prisma unique constraint errors', () => {
    const res = createRes();
    const error = new PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test'
    });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'DUPLICATE_ENTRY'
      })
    );
  });

  it('handles JWT errors', () => {
    const res = createRes();
    const error = new Error('jwt');
    error.name = 'JsonWebTokenError';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'INVALID_TOKEN'
      })
    );
  });
});
