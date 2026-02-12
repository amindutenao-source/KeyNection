import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { UserController } from '../controllers/userController';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
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

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists users with filters', async () => {
    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      query: { role: 'OWNER', status: 'ACTIVE', search: 'john', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const res = createRes();

    UserController.getUsers(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'OWNER',
          status: 'ACTIVE',
          OR: expect.any(Array)
        })
      })
    );
  });

  it('prevents non-admin from accessing another user', async () => {
    const req = {
      params: { id: 'user-2' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    const res = createRes();

    UserController.getUserById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when user is missing', async () => {
    const req = {
      params: { id: 'user-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = createRes();

    UserController.getUserById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns user when self-access', async () => {
    const req = {
      params: { id: 'user-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });

    const res = createRes();

    UserController.getUserById(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 403 when non-admin updates another user', async () => {
    const req = {
      params: { id: 'user-2' },
      body: { firstName: 'New' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    const res = createRes();

    UserController.updateUser(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows admin to update role', async () => {
    const req = {
      params: { id: 'user-2' },
      body: { role: 'MANAGER' },
      user: { id: 'admin-1', role: 'ADMIN' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.update.mockResolvedValue({ id: 'user-2' });

    const res = createRes();

    UserController.updateUser(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'MANAGER' })
      })
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('updates user profile fields for self', async () => {
    const req = {
      params: { id: 'user-1' },
      body: { firstName: 'Jane', phoneVerified: true },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.update.mockResolvedValue({ id: 'user-1' });

    const res = createRes();

    UserController.updateUser(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'Jane'
        })
      })
    );
  });

  it('deletes user when admin', async () => {
    const req = {
      params: { id: 'user-2' },
      user: { id: 'admin-1', role: 'ADMIN' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.delete.mockResolvedValue({ id: 'user-2' });

    const res = createRes();

    UserController.deleteUser(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'user-2' } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
