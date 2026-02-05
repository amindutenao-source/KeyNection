import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest } from '../types';
import type { Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn()
    }
  };

  return {
    __esModule: true,
    default: mockPrisma
  };
});

const prismaMock = (jest.requireMock('../lib/prisma') as { default: any }).default;

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  return res;
};

describe('Auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('returns 401 when no token is provided', async () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await authenticate({ required: true })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Access token is required'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' }
    } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await authenticate({ required: true })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid token'
      })
    );
  });

  it('returns 403 when user is inactive', async () => {
    const token = jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET as string);
    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'OWNER',
      status: 'PENDING'
    });

    await authenticate({ required: true })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Account is not active'
      })
    );
  });

  it('returns 403 when role is not allowed', async () => {
    const token = jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET as string);
    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'MANAGER',
      status: 'ACTIVE'
    });

    await requireRole(['OWNER'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Insufficient permissions'
      })
    );
  });

  it('calls next when token and role are valid', async () => {
    const token = jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET as string);
    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'OWNER',
      status: 'ACTIVE'
    });

    await requireRole(['OWNER'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows admin regardless of role restriction', async () => {
    const token = jwt.sign({ userId: 'admin-1' }, process.env.JWT_SECRET as string);
    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    await requireRole(['OWNER'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
