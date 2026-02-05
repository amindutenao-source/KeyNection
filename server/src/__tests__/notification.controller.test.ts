import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { NotificationController } from '../controllers/notificationController';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
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

describe('NotificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows admin to filter notifications by userId', async () => {
    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      query: { userId: 'user-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.notification.findMany.mockResolvedValue([]);
    prismaMock.notification.count.mockResolvedValue(0);

    const res = createRes();

    NotificationController.getMyNotifications(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' }
      })
    );
  });

  it('returns 403 when reading another user notification', async () => {
    const req = {
      params: { id: 'notif-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.notification.findUnique.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-2'
    });

    const res = createRes();

    NotificationController.markAsRead(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('marks all notifications as read for current user', async () => {
    const req = {
      user: { id: 'user-1', role: 'OWNER' },
      query: {}
    } as unknown as AuthenticatedRequest;

    prismaMock.notification.updateMany.mockResolvedValue({ count: 2 });

    const res = createRes();

    NotificationController.markAllAsRead(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'UNREAD',
          userId: 'user-1'
        })
      })
    );
  });
});
