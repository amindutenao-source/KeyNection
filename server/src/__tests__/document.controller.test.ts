import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { DocumentController } from '../controllers/documentController';

jest.mock('../lib/prisma', () => {
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

describe('DocumentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists documents for admin with filters', async () => {
    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      query: { userId: 'user-2', propertyId: 'prop-1', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.document.findMany.mockResolvedValue([]);
    prismaMock.document.count.mockResolvedValue(0);

    const res = createRes();

    DocumentController.getDocuments(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-2',
          propertyId: 'prop-1'
        })
      })
    );
  });

  it('lists documents for non-admin with access filter', async () => {
    const req = {
      user: { id: 'user-1', role: 'OWNER' },
      query: { page: '1', limit: '10' }
    } as unknown as AuthenticatedRequest;

    prismaMock.document.findMany.mockResolvedValue([]);
    prismaMock.document.count.mockResolvedValue(0);

    const res = createRes();

    DocumentController.getDocuments(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array)
        })
      })
    );
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

  it('returns 404 when property is missing on create', async () => {
    const req = {
      body: { propertyId: 'missing', name: 'Doc', type: 'LEASE', url: 'url' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue(null);

    const res = createRes();

    DocumentController.createDocument(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when user cannot access property', async () => {
    const req = {
      body: { propertyId: 'prop-1', name: 'Doc', type: 'LEASE', url: 'url' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-2',
      managerId: null
    });

    const res = createRes();

    DocumentController.createDocument(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when admin target user is missing', async () => {
    const req = {
      body: { userId: 'missing', name: 'Doc', type: 'LEASE', url: 'url' },
      user: { id: 'admin-1', role: 'ADMIN' }
    } as unknown as AuthenticatedRequest;

    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = createRes();

    DocumentController.createDocument(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when document is missing', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.document.findUnique.mockResolvedValue(null);

    const res = createRes();

    DocumentController.getDocumentById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns document when user has access', async () => {
    const req = {
      params: { id: 'doc-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.document.findUnique.mockResolvedValue({
      id: 'doc-1',
      userId: 'user-1',
      property: { ownerId: 'owner-1', managerId: null }
    });

    const res = createRes();

    DocumentController.getDocumentById(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
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

  it('deletes document when access is allowed', async () => {
    const req = {
      params: { id: 'doc-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.document.findUnique.mockResolvedValue({
      id: 'doc-1',
      userId: 'user-1',
      property: { ownerId: 'owner-1', managerId: null }
    });
    prismaMock.document.delete.mockResolvedValue({ id: 'doc-1' });

    const res = createRes();

    DocumentController.deleteDocument(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.document.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when deleting missing document', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.document.findUnique.mockResolvedValue(null);

    const res = createRes();

    DocumentController.deleteDocument(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
