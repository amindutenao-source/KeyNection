import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { MessageController } from '../controllers/messageController';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    message: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: {},
    UserRole: {
      OWNER: 'OWNER',
      MANAGER: 'MANAGER',
      ADMIN: 'ADMIN'
    },
    __mock: mockPrisma
  };
});

const prismaMock = (jest.requireMock('@prisma/client') as { __mock: any }).__mock;

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  return res;
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('MessageController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when recipient is missing', async () => {
    const req = {
      body: { recipientId: 'user-2', content: 'Hello' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = createRes();

    MessageController.createMessage(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('prevents marking as read by non-recipient', async () => {
    const req = {
      params: { id: 'msg-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findUnique.mockResolvedValue({
      id: 'msg-1',
      recipientId: 'user-2'
    });

    const res = createRes();

    MessageController.markAsRead(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
