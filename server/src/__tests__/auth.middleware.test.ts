import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest, User } from '../types';
import { UserRole, UserStatus } from '@prisma/client';
import type { Response, NextFunction } from 'express';
import {
  authenticate,
  requireRole,
  requireEmailVerification,
  requireOwnership,
  validatePasswordStrength
} from '../middleware/auth';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn()
    },
    property: {
      findUnique: jest.fn()
    },
    application: {
      findUnique: jest.fn()
    },
    contract: {
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
  const makeUser = (
    overrides: Partial<Omit<User, 'password'>> = {}
  ): Omit<User, 'password'> => ({
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'OWNER' as UserRole,
    status: 'ACTIVE' as UserStatus,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  const makeReq = (partial: Partial<AuthenticatedRequest>) =>
    partial as unknown as AuthenticatedRequest;

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

  it('allows missing token when auth is optional', async () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await authenticate({ required: false })(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('requireRole rejects missing token', async () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await requireRole([UserRole.MANAGER])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
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

  it('returns 401 when user is not found', async () => {
    const token = jwt.sign({ userId: 'missing' }, process.env.JWT_SECRET as string);
    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.user.findUnique.mockResolvedValue(null);

    await authenticate({ required: true })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'User not found'
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

  it('returns 401 when token is expired', async () => {
    const token = jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET as string);
    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
      throw new jwt.TokenExpiredError('expired', new Date());
    });

    await authenticate({ required: true })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Token expired'
      })
    );
  });

  it('returns 500 when JWT secret is missing', async () => {
    delete process.env.JWT_SECRET;
    const req = {
      headers: { authorization: 'Bearer token' }
    } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await authenticate({ required: true })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Authentication failed'
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

  it('requires email verification', async () => {
    const req = { user: { emailVerified: false } } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await requireEmailVerification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Email verification required'
      })
    );
  });

  it('returns 401 when email verification is missing auth', async () => {
    const req = {} as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await requireEmailVerification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Authentication required'
      })
    );
  });

  it('allows verified users through email check', async () => {
    const req = { user: { emailVerified: true } } as AuthenticatedRequest;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await requireEmailVerification(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('validates password strength', () => {
    const req = { body: { password: 'weak' } } as any;
    const res = createRes();
    const next = jest.fn();

    validatePasswordStrength(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Password does not meet requirements'
      })
    );
  });

  it('requires password', () => {
    const req = { body: {} } as any;
    const res = createRes();
    const next = jest.fn();

    validatePasswordStrength(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('allows strong password', () => {
    const req = { body: { password: 'StrongPass1!' } } as any;
    const res = createRes();
    const next = jest.fn();

    validatePasswordStrength(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('detects missing lowercase password requirement', () => {
    const req = { body: { password: 'PASSWORD1!' } } as any;
    const res = createRes();
    const next = jest.fn();

    validatePasswordStrength(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('requires ownership when user missing', async () => {
    const req = makeReq({ params: { id: 'prop-1' } });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await requireOwnership('property')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 when resource id missing', async () => {
    const req = makeReq({ user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }), params: {} });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await requireOwnership('property')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when property missing', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'prop-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.property.findUnique.mockResolvedValue(null);

    await requireOwnership('property')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when property access denied', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'prop-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.property.findUnique.mockResolvedValue({ ownerId: 'other', managerId: 'other' });

    await requireOwnership('property')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows owner access to property', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'prop-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.property.findUnique.mockResolvedValue({ ownerId: 'user-1', managerId: null });

    await requireOwnership('property')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 404 when application missing', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'app-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.application.findUnique.mockResolvedValue(null);

    await requireOwnership('application')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when application access denied', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'app-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.application.findUnique.mockResolvedValue({
      applicantId: 'other',
      property: { ownerId: 'other', managerId: 'other' }
    });

    await requireOwnership('application')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows applicant access to application', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'app-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.application.findUnique.mockResolvedValue({
      applicantId: 'user-1',
      property: { ownerId: 'other', managerId: 'other' }
    });

    await requireOwnership('application')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 404 when contract missing', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'contract-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.contract.findUnique.mockResolvedValue(null);

    await requireOwnership('contract')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when contract access denied', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'contract-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.contract.findUnique.mockResolvedValue({
      ownerId: 'other',
      managerId: 'other',
      tenantId: 'other'
    });

    await requireOwnership('contract')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows contract participant access', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'contract-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.contract.findUnique.mockResolvedValue({
      ownerId: 'user-1',
      managerId: 'other',
      tenantId: 'other'
    });

    await requireOwnership('contract')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('handles invalid resource type', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'resource-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    await requireOwnership('invalid' as any)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles ownership check errors', async () => {
    const req = makeReq({
      user: makeUser({ id: 'user-1', role: 'OWNER' as UserRole }),
      params: { id: 'prop-1' }
    });
    const res = createRes();
    const next = jest.fn() as NextFunction;

    prismaMock.property.findUnique.mockRejectedValue(new Error('db error'));

    await requireOwnership('property')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
