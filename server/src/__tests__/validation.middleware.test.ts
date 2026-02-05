import Joi from 'joi';
import type { Request, Response, NextFunction } from 'express';
import { validate, validateQuery, validateParams } from '../middleware/validation';

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  return res;
};

describe('Validation middleware', () => {
  it('validates body and calls next on success', () => {
    const schema = Joi.object({ name: Joi.string().required() });
    const req = { body: { name: 'Alice', extra: 'removed' } } as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Alice' });
  });

  it('returns 400 when body validation fails', () => {
    const schema = Joi.object({ name: Joi.string().required() });
    const req = { body: {} } as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'VALIDATION_ERROR'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('validates query and calls next on success', () => {
    const schema = Joi.object({ page: Joi.number().integer().min(1).required() });
    const req = { query: { page: 2 } } as unknown as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validateQuery(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query).toEqual({ page: 2 });
  });

  it('returns 400 when query validation fails', () => {
    const schema = Joi.object({ page: Joi.number().integer().min(1).required() });
    const req = { query: { page: 0 } } as unknown as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validateQuery(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'VALIDATION_ERROR'
      })
    );
  });

  it('validates params and calls next on success', () => {
    const schema = Joi.object({ id: Joi.string().required() });
    const req = { params: { id: 'abc' } } as unknown as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validateParams(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.params).toEqual({ id: 'abc' });
  });

  it('returns 400 when params validation fails', () => {
    const schema = Joi.object({ id: Joi.string().required() });
    const req = { params: {} } as unknown as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validateParams(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'VALIDATION_ERROR'
      })
    );
  });
});
