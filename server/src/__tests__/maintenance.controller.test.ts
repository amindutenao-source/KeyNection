import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { MaintenanceController } from '../controllers/maintenanceController';

jest.mock('@prisma/client', () => {
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

describe('MaintenanceController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
