import type { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  requestLogger,
  securityErrorHandler,
  databaseErrorHandler,
  createError,
  throwError
} from '../middleware/errorHandler';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

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
  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

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

  it('handles Prisma record not found errors', () => {
    const res = createRes();
    const error = new PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test'
    });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'RECORD_NOT_FOUND'
      })
    );
  });

  it('handles Prisma foreign key errors', () => {
    const res = createRes();
    const error = new PrismaClientKnownRequestError('Foreign key', {
      code: 'P2003',
      clientVersion: 'test'
    });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'FOREIGN_KEY_CONSTRAINT'
      })
    );
  });

  it('handles Prisma relation violation errors', () => {
    const res = createRes();
    const error = new PrismaClientKnownRequestError('Relation', {
      code: 'P2014',
      clientVersion: 'test'
    });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'RELATION_VIOLATION'
      })
    );
  });

  it('handles unknown Prisma errors', () => {
    const res = createRes();
    const error = new PrismaClientKnownRequestError('Unknown', {
      code: 'P9999',
      clientVersion: 'test'
    });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'DATABASE_ERROR'
      })
    );
  });

  it('handles Prisma validation errors', () => {
    const res = createRes();
    const error = new PrismaClientValidationError('Invalid', {
      clientVersion: 'test'
    });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'VALIDATION_ERROR'
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

  it('handles token expired errors', () => {
    const res = createRes();
    const error = new Error('expired');
    error.name = 'TokenExpiredError';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'TOKEN_EXPIRED'
      })
    );
  });

  it('handles multer errors', () => {
    const res = createRes();
    const error = new Error('multer');
    (error as any).name = 'MulterError';
    (error as any).code = 'LIMIT_FILE_SIZE';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'FILE_TOO_LARGE'
      })
    );
  });

  it('handles multer file count errors', () => {
    const res = createRes();
    const error = new Error('multer');
    (error as any).name = 'MulterError';
    (error as any).code = 'LIMIT_FILE_COUNT';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'TOO_MANY_FILES'
      })
    );
  });

  it('handles multer unexpected file errors', () => {
    const res = createRes();
    const error = new Error('multer');
    (error as any).name = 'MulterError';
    (error as any).code = 'LIMIT_UNEXPECTED_FILE';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'UNEXPECTED_FILE'
      })
    );
  });

  it('handles unknown multer errors', () => {
    const res = createRes();
    const error = new Error('multer');
    (error as any).name = 'MulterError';
    (error as any).code = 'OTHER';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'FILE_UPLOAD_ERROR'
      })
    );
  });

  it('handles validation errors by name', () => {
    const res = createRes();
    const error = new Error('validation');
    error.name = 'ValidationError';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'VALIDATION_ERROR'
      })
    );
  });

  it('handles cast errors by name', () => {
    const res = createRes();
    const error = new Error('cast');
    error.name = 'CastError';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'INVALID_ID'
      })
    );
  });

  it('adds stack trace in development', () => {
    const res = createRes();
    process.env.NODE_ENV = 'development';
    const error = new Error('boom');

    errorHandler(error, { url: '/dev', method: 'GET', body: {}, params: {}, query: {} } as Request, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: expect.any(String)
      })
    );
  });

  it('logs in production without stack', () => {
    const res = createRes();
    process.env.NODE_ENV = 'production';
    const error = new Error('boom');

    errorHandler(error, { url: '/prod', method: 'GET', body: {}, params: {}, query: {} } as Request, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'INTERNAL_SERVER_ERROR'
      })
    );
  });
});

describe('error handler utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  it('wraps async handlers', async () => {
    const error = new Error('async');
    const next = jest.fn();
    const wrapped = asyncHandler(async () => {
      throw error;
    });

    await wrapped({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('returns 404 for not found', () => {
    const res = createRes();
    notFoundHandler({ originalUrl: '/missing' } as Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'NOT_FOUND'
      })
    );
  });

  it('handles unhandled rejections', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    process.env.NODE_ENV = 'production';
    handleUnhandledRejection('reason', Promise.resolve());
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('handles uncaught exceptions', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    process.env.NODE_ENV = 'production';
    handleUncaughtException(new Error('boom'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('logs request completion', () => {
    const res = {
      statusCode: 200,
      on: jest.fn()
    } as unknown as Response;
    const req = {
      method: 'GET',
      originalUrl: '/health',
      get: jest.fn(),
      ip: '127.0.0.1'
    } as unknown as Request;
    const next = jest.fn();

    requestLogger(req, res, next);
    const finishHandler = (res.on as jest.Mock).mock.calls[0][1];
    finishHandler();

    expect(next).toHaveBeenCalled();
  });

  it('logs request failures', () => {
    const res = {
      statusCode: 500,
      on: jest.fn()
    } as unknown as Response;
    const req = {
      method: 'GET',
      originalUrl: '/boom',
      get: jest.fn(),
      ip: '127.0.0.1'
    } as unknown as Request;
    const next = jest.fn();

    requestLogger(req, res, next);
    const finishHandler = (res.on as jest.Mock).mock.calls[0][1];
    finishHandler();

    expect(next).toHaveBeenCalled();
  });

  it('handles security errors', () => {
    const res = createRes();
    const next = jest.fn();

    securityErrorHandler({ code: 'LIMIT_FILE_SIZE' }, {} as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(413);
  });

  it('handles security file count errors', () => {
    const res = createRes();
    const next = jest.fn();

    securityErrorHandler({ code: 'LIMIT_FILE_COUNT' }, {} as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(413);
  });

  it('handles security unexpected file errors', () => {
    const res = createRes();
    const next = jest.fn();

    securityErrorHandler({ code: 'LIMIT_UNEXPECTED_FILE' }, {} as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles unknown security errors', () => {
    const res = createRes();
    const next = jest.fn();

    securityErrorHandler({ code: 'OTHER' }, {} as Request, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('logs database errors', () => {
    process.env.NODE_ENV = 'production';
    databaseErrorHandler(new Error('db'));
  });

  it('creates and throws errors', () => {
    const err = createError('Boom', 418, 'TEAPOT');
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(418);

    expect(() => throwError('Boom', 418, 'TEAPOT')).toThrow('Boom');
  });

  it('instantiates typed errors', () => {
    expect(new AuthenticationError().statusCode).toBe(401);
    expect(new AuthorizationError().statusCode).toBe(403);
    expect(new NotFoundError('User').statusCode).toBe(404);
    expect(new ConflictError('Conflict').statusCode).toBe(409);
    expect(new RateLimitError().statusCode).toBe(429);
  });
});
