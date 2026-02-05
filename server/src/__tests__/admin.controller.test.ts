import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { AdminController } from '../controllers/adminController';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    property: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    application: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    contract: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    payment: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn()
    },
    maintenanceRequest: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    document: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    review: {
      count: jest.fn(),
      findMany: jest.fn()
    }
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: {},
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

describe('AdminController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns overview stats', async () => {
    prismaMock.user.count.mockResolvedValue(5);
    prismaMock.property.count.mockResolvedValue(3);
    prismaMock.application.count.mockResolvedValue(2);
    prismaMock.contract.count.mockResolvedValue(4);
    prismaMock.payment.count.mockResolvedValue(6);
    prismaMock.maintenanceRequest.count.mockResolvedValue(1);
    prismaMock.document.count.mockResolvedValue(2);
    prismaMock.review.count.mockResolvedValue(1);
    prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amount: 1200 } });

    const now = new Date();
    prismaMock.user.findMany.mockResolvedValue([
      { id: 'u1', firstName: 'A', lastName: 'B', createdAt: now }
    ]);
    prismaMock.property.findMany.mockResolvedValue([
      { id: 'p1', title: 'Prop', createdAt: now }
    ]);
    prismaMock.application.findMany.mockResolvedValue([
      { id: 'a1', status: 'PENDING', createdAt: now }
    ]);
    prismaMock.contract.findMany.mockResolvedValue([
      { id: 'c1', status: 'ACTIVE', createdAt: now }
    ]);

    const res = createRes();

    AdminController.getOverview({} as AuthenticatedRequest, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stats: expect.objectContaining({
            users: 5,
            properties: 3,
            revenue: 1200
          })
        })
      })
    );
  });

  it('returns audits list', async () => {
    const now = new Date();
    prismaMock.payment.findMany.mockResolvedValue([
      { id: 'pay-1', amount: 100, currency: 'USD', status: 'COMPLETED', createdAt: now }
    ]);
    prismaMock.application.findMany.mockResolvedValue([]);
    prismaMock.contract.findMany.mockResolvedValue([]);
    prismaMock.maintenanceRequest.findMany.mockResolvedValue([]);
    prismaMock.review.findMany.mockResolvedValue([]);
    prismaMock.document.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const req = { query: { limit: '10' } } as unknown as AuthenticatedRequest;
    const res = createRes();

    AdminController.getAudits(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'PAYMENT'
          })
        ])
      })
    );
  });
});
