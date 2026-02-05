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
});
