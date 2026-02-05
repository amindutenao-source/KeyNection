import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { DocumentController } from '../controllers/documentController';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    document: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    },
    property: {
      findUnique: jest.fn()
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

describe('DocumentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows admin to create a document for another user', async () => {
    const req = {
      body: {
        userId: 'user-2',
        name: 'Doc',
        type: 'CONTRACT',
        url: 'https://example.com/doc.pdf'
      },
      user: { id: 'admin-1', role: 'ADMIN' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prismaMock.document.create.mockResolvedValue({ id: 'doc-1' });

    const res = createRes();

    DocumentController.createDocument(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-2'
        })
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('prevents access to another user document', async () => {
    const req = {
      params: { id: 'doc-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.document.findUnique.mockResolvedValue({
      id: 'doc-1',
      userId: 'user-2',
      property: { ownerId: 'owner-2', managerId: null }
    });

    const res = createRes();

    DocumentController.getDocumentById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
