import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { MaintenanceController } from '../controllers/maintenanceController';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    maintenanceRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    property: {
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

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('MaintenanceController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists maintenance requests for non-admin with filters', async () => {
    const req = {
      user: { id: 'user-1', role: 'OWNER' },
      query: { status: 'PENDING', priority: 'HIGH', propertyId: 'prop-1', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.findMany.mockResolvedValue([]);
    prismaMock.maintenanceRequest.count.mockResolvedValue(0);

    const res = createRes();

    MaintenanceController.getMaintenanceRequests(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.maintenanceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PENDING',
          priority: 'HIGH',
          propertyId: 'prop-1',
          OR: expect.any(Array)
        })
      })
    );
  });

  it('lists maintenance requests for admin with all flag', async () => {
    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      query: { all: 'true', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.findMany.mockResolvedValue([]);
    prismaMock.maintenanceRequest.count.mockResolvedValue(0);

    const res = createRes();

    MaintenanceController.getMaintenanceRequests(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.maintenanceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ OR: expect.any(Array) })
      })
    );
  });

  it('returns 404 when property is missing', async () => {
    const req = {
      body: { propertyId: 'prop-1', title: 'Leak', description: 'Leak', priority: 'HIGH' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue(null);

    const res = createRes();

    MaintenanceController.createMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when contract is invalid for property', async () => {
    const req = {
      body: {
        propertyId: 'prop-1',
        contractId: 'contract-1',
        title: 'Leak',
        description: 'Leak',
        priority: 'HIGH'
      },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-1',
      managerId: null
    });
    prismaMock.contract.findUnique.mockResolvedValue({
      id: 'contract-1',
      ownerId: 'owner-1',
      managerId: null,
      tenantId: null,
      propertyId: 'other'
    });

    const res = createRes();

    MaintenanceController.createMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 403 when user lacks access to create maintenance', async () => {
    const req = {
      body: {
        propertyId: 'prop-1',
        title: 'Leak',
        description: 'Leak',
        priority: 'HIGH'
      },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-2',
      managerId: null
    });

    const res = createRes();

    MaintenanceController.createMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('creates a maintenance request with parsed fields', async () => {
    const req = {
      body: {
        propertyId: 'prop-1',
        title: 'Leak',
        description: 'Leak',
        priority: 'HIGH',
        estimatedCost: 'abc',
        scheduledDate: 'bad-date',
        images: 123
      },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-1',
      managerId: null
    });
    prismaMock.maintenanceRequest.create.mockResolvedValue({ id: 'req-1' });

    const res = createRes();

    MaintenanceController.createMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.maintenanceRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estimatedCost: undefined,
          scheduledDate: undefined,
          images: ['123']
        })
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 404 when maintenance request missing', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.findUnique.mockResolvedValue(null);

    const res = createRes();

    MaintenanceController.getMaintenanceById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns maintenance request when user has access', async () => {
    const req = {
      params: { id: 'req-1' },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      property: { ownerId: 'owner-1', managerId: null },
      contract: null
    });

    const res = createRes();

    MaintenanceController.getMaintenanceById(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 403 when user cannot access maintenance request', async () => {
    const req = {
      params: { id: 'req-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      property: { ownerId: 'owner-2', managerId: null },
      contract: { ownerId: 'owner-2', managerId: null, tenantId: null }
    });

    const res = createRes();

    MaintenanceController.getMaintenanceById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('prevents update by non-owner/manager', async () => {
    const req = {
      params: { id: 'req-1' },
      body: { status: 'IN_PROGRESS' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      property: { ownerId: 'owner-2', managerId: 'manager-2' },
      contract: { ownerId: 'owner-2', managerId: 'manager-2', tenantId: null }
    });

    const res = createRes();

    MaintenanceController.updateMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when updating missing maintenance request', async () => {
    const req = {
      params: { id: 'missing' },
      body: {},
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.findUnique.mockResolvedValue(null);

    const res = createRes();

    MaintenanceController.updateMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates maintenance request and sets completed date', async () => {
    const req = {
      params: { id: 'req-1' },
      body: { status: 'COMPLETED', actualCost: '100' },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      property: { ownerId: 'owner-1', managerId: null },
      contract: null
    });
    prismaMock.maintenanceRequest.update.mockResolvedValue({ id: 'req-1' });

    const res = createRes();

    MaintenanceController.updateMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.maintenanceRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actualCost: 100,
          completedDate: expect.any(Date)
        })
      })
    );
  });

  it('uses explicit completedDate when provided', async () => {
    const req = {
      params: { id: 'req-1' },
      body: { completedDate: '2026-01-02' },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      property: { ownerId: 'owner-1', managerId: null },
      contract: null
    });
    prismaMock.maintenanceRequest.update.mockResolvedValue({ id: 'req-1' });

    const res = createRes();

    MaintenanceController.updateMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.maintenanceRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          completedDate: expect.any(Date)
        })
      })
    );
  });

  it('prevents non-admin from deleting maintenance', async () => {
    const req = {
      params: { id: 'req-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    const res = createRes();

    MaintenanceController.deleteMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows admin to delete maintenance', async () => {
    const req = {
      params: { id: 'req-1' },
      user: { id: 'admin-1', role: 'ADMIN' }
    } as unknown as AuthenticatedRequest;

    prismaMock.maintenanceRequest.delete.mockResolvedValue({ id: 'req-1' });

    const res = createRes();

    MaintenanceController.deleteMaintenanceRequest(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.maintenanceRequest.delete).toHaveBeenCalledWith({ where: { id: 'req-1' } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
