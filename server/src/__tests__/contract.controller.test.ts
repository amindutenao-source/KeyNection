import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { ContractController } from '../controllers/contractController';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    contract: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    property: {
      findUnique: jest.fn()
    },
    application: {
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

describe('ContractController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a contract and infers manager from application', async () => {
    const req = {
      body: {
        propertyId: 'prop-1',
        applicationId: 'app-1',
        monthlyRent: 2500
      },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-1'
    });
    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app-1',
      propertyId: 'prop-1',
      applicantId: 'manager-1'
    });
    prismaMock.contract.create.mockResolvedValue({
      id: 'contract-1'
    });

    const res = createRes();

    ContractController.createContract(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.contract.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: 'app-1',
          managerId: 'manager-1'
        })
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 403 when non-participant reads contract', async () => {
    const req = {
      params: { id: 'contract-1' },
      user: { id: 'user-2', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue({
      id: 'contract-1',
      ownerId: 'owner-1',
      managerId: 'manager-1',
      tenantId: null
    });

    const res = createRes();

    ContractController.getContractById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('activates contract when owner signs and no other parties exist', async () => {
    const req = {
      params: { id: 'contract-1' },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue({
      id: 'contract-1',
      ownerId: 'owner-1',
      managerId: null,
      tenantId: null,
      ownerSignedAt: null,
      managerSignedAt: null,
      tenantSignedAt: null,
      status: 'DRAFT'
    });
    prismaMock.contract.update.mockResolvedValue({
      id: 'contract-1',
      status: 'ACTIVE'
    });

    const res = createRes();

    ContractController.signContract(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.contract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ACTIVE'
        })
      })
    );
  });
});
