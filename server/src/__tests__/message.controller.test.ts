import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { MessageController } from '../controllers/messageController';

jest.mock('../lib/prisma', () => {
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

describe('MessageController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists inbox messages with read filter', async () => {
    const req = {
      user: { id: 'user-1', role: 'OWNER' },
      query: { box: 'inbox', read: 'true', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findMany.mockResolvedValue([]);
    prismaMock.message.count.mockResolvedValue(0);

    const res = createRes();

    MessageController.getMessages(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recipientId: 'user-1',
          read: true
        })
      })
    );
  });

  it('lists sent messages', async () => {
    const req = {
      user: { id: 'user-1', role: 'OWNER' },
      query: { box: 'sent', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findMany.mockResolvedValue([]);
    prismaMock.message.count.mockResolvedValue(0);

    const res = createRes();

    MessageController.getMessages(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ senderId: 'user-1' })
      })
    );
  });

  it('lists all messages when box=all', async () => {
    const req = {
      user: { id: 'user-1', role: 'OWNER' },
      query: { box: 'all', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findMany.mockResolvedValue([]);
    prismaMock.message.count.mockResolvedValue(0);

    const res = createRes();

    MessageController.getMessages(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ senderId: 'user-1' }, { recipientId: 'user-1' }]
        })
      })
    );
  });

  it('returns 404 when message is missing', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findUnique.mockResolvedValue(null);

    const res = createRes();

    MessageController.getMessageById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns message when user has access', async () => {
    const req = {
      params: { id: 'msg-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findUnique.mockResolvedValue({
      id: 'msg-1',
      senderId: 'user-1',
      recipientId: 'user-2'
    });

    const res = createRes();

    MessageController.getMessageById(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 403 when user lacks access to message', async () => {
    const req = {
      params: { id: 'msg-1' },
      user: { id: 'user-3', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findUnique.mockResolvedValue({
      id: 'msg-1',
      senderId: 'user-1',
      recipientId: 'user-2'
    });

    const res = createRes();

    MessageController.getMessageById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
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

  it('creates a message when recipient exists', async () => {
    const req = {
      body: { recipientId: 'user-2', subject: 'Hi', content: 'Hello' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prismaMock.message.create.mockResolvedValue({ id: 'msg-1' });

    const res = createRes();

    MessageController.createMessage(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 404 when marking missing message as read', async () => {
    const req = {
      params: { id: 'msg-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findUnique.mockResolvedValue(null);

    const res = createRes();

    MessageController.markAsRead(req, res, jest.fn());
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

  it('marks message as read for recipient', async () => {
    const req = {
      params: { id: 'msg-1' },
      user: { id: 'user-2', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findUnique.mockResolvedValue({
      id: 'msg-1',
      recipientId: 'user-2'
    });
    prismaMock.message.update.mockResolvedValue({ id: 'msg-1' });

    const res = createRes();

    MessageController.markAsRead(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.message.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ read: true })
      })
    );
  });

  it('deletes message when user has access', async () => {
    const req = {
      params: { id: 'msg-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findUnique.mockResolvedValue({
      id: 'msg-1',
      senderId: 'user-1',
      recipientId: 'user-2'
    });
    prismaMock.message.delete.mockResolvedValue({ id: 'msg-1' });

    const res = createRes();

    MessageController.deleteMessage(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
  });

  it('returns 404 when deleting missing message', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findUnique.mockResolvedValue(null);

    const res = createRes();

    MessageController.deleteMessage(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when deleting without access', async () => {
    const req = {
      params: { id: 'msg-1' },
      user: { id: 'user-3', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.message.findUnique.mockResolvedValue({
      id: 'msg-1',
      senderId: 'user-1',
      recipientId: 'user-2'
    });

    const res = createRes();

    MessageController.deleteMessage(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
