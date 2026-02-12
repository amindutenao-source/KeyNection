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

  it('lists contracts for admin with user filter', async () => {
    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      query: { userId: 'user-2', status: 'ACTIVE', page: '2', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findMany.mockResolvedValue([]);
    prismaMock.contract.count.mockResolvedValue(0);

    const res = createRes();

    ContractController.getMyContracts(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
          OR: [
            { ownerId: 'user-2' },
            { managerId: 'user-2' },
            { tenantId: 'user-2' }
          ]
        })
      })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('lists contracts for non-admin', async () => {
    const req = {
      user: { id: 'user-1', role: 'OWNER' },
      query: { page: '1', limit: '10' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findMany.mockResolvedValue([]);
    prismaMock.contract.count.mockResolvedValue(0);

    const res = createRes();

    ContractController.getMyContracts(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { ownerId: 'user-1' },
            { managerId: 'user-1' },
            { tenantId: 'user-1' }
          ]
        })
      })
    );
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

  it('returns 404 when contract is missing', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue(null);

    const res = createRes();

    ContractController.getContractById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('allows admin to access contract', async () => {
    const req = {
      params: { id: 'contract-1' },
      user: { id: 'admin-1', role: 'ADMIN' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue({
      id: 'contract-1',
      ownerId: 'owner-1',
      managerId: null,
      tenantId: null
    });

    const res = createRes();

    ContractController.getContractById(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when property missing on create', async () => {
    const req = {
      body: { propertyId: 'missing' },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue(null);

    const res = createRes();

    ContractController.createContract(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when non-owner creates contract', async () => {
    const req = {
      body: { propertyId: 'prop-1' },
      user: { id: 'other-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({ id: 'prop-1', ownerId: 'owner-1' });

    const res = createRes();

    ContractController.createContract(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when application missing on create', async () => {
    const req = {
      body: { propertyId: 'prop-1', applicationId: 'app-1' },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({ id: 'prop-1', ownerId: 'owner-1' });
    prismaMock.application.findUnique.mockResolvedValue(null);

    const res = createRes();

    ContractController.createContract(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when application does not match property', async () => {
    const req = {
      body: { propertyId: 'prop-1', applicationId: 'app-1' },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({ id: 'prop-1', ownerId: 'owner-1' });
    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app-1',
      propertyId: 'other-prop',
      applicantId: 'manager-1'
    });

    const res = createRes();

    ContractController.createContract(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates contract with provided manager and parsed fields', async () => {
    const req = {
      body: {
        propertyId: 'prop-1',
        managerId: 'manager-2',
        tenantId: 'tenant-1',
        startDate: '2026-01-01',
        endDate: 'bad-date',
        monthlyRent: '1200',
        securityDeposit: '',
        utilitiesIncluded: 'true',
        lateFee: '15.5',
        gracePeriod: '5',
        contractType: 'LEASE'
      },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({ id: 'prop-1', ownerId: 'owner-1' });
    prismaMock.contract.create.mockResolvedValue({ id: 'contract-2' });

    const res = createRes();

    ContractController.createContract(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.contract.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          managerId: 'manager-2',
          tenantId: 'tenant-1',
          monthlyRent: 1200,
          securityDeposit: undefined,
          utilitiesIncluded: true,
          lateFee: 15.5,
          gracePeriod: 5,
          endDate: undefined
        })
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 404 when updating missing contract', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'owner-1', role: 'OWNER' },
      body: {}
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue(null);

    const res = createRes();

    ContractController.updateContract(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when updating contract without access', async () => {
    const req = {
      params: { id: 'contract-1' },
      user: { id: 'owner-2', role: 'OWNER' },
      body: {}
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue({
      id: 'contract-1',
      ownerId: 'owner-1'
    });

    const res = createRes();

    ContractController.updateContract(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('updates contract with relation changes', async () => {
    const req = {
      params: { id: 'contract-1' },
      user: { id: 'owner-1', role: 'OWNER' },
      body: {
        managerId: '',
        tenantId: 'tenant-9',
        utilitiesIncluded: false,
        gracePeriod: '3'
      }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue({
      id: 'contract-1',
      ownerId: 'owner-1'
    });
    prismaMock.contract.update.mockResolvedValue({ id: 'contract-1' });

    const res = createRes();

    ContractController.updateContract(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.contract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          manager: { disconnect: true },
          tenant: { connect: { id: 'tenant-9' } },
          utilitiesIncluded: false,
          gracePeriod: 3
        })
      })
    );
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

  it('returns 404 when signing missing contract', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue(null);

    const res = createRes();

    ContractController.signContract(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when non-participant signs', async () => {
    const req = {
      params: { id: 'contract-1' },
      user: { id: 'intruder', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue({
      id: 'contract-1',
      ownerId: 'owner-1',
      managerId: 'manager-1',
      tenantId: 'tenant-1',
      ownerSignedAt: null,
      managerSignedAt: null,
      tenantSignedAt: null,
      status: 'DRAFT'
    });

    const res = createRes();

    ContractController.signContract(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('does not activate contract when not all parties signed', async () => {
    const req = {
      params: { id: 'contract-1' },
      user: { id: 'owner-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue({
      id: 'contract-1',
      ownerId: 'owner-1',
      managerId: 'manager-1',
      tenantId: null,
      ownerSignedAt: null,
      managerSignedAt: null,
      tenantSignedAt: null,
      status: 'DRAFT'
    });
    prismaMock.contract.update.mockResolvedValue({ id: 'contract-1', status: 'DRAFT' });

    const res = createRes();

    ContractController.signContract(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.contract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'DRAFT'
        })
      })
    );
  });
});
