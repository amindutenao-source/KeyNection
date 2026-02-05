import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { PaymentController } from '../controllers/paymentController';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    payment: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
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

describe('PaymentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when creating payment for contract without access', async () => {
    const req = {
      body: {
        contractId: 'contract-1',
        amount: 1200,
        method: 'BANK_TRANSFER'
      },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue({
      id: 'contract-1',
      ownerId: 'owner-2',
      managerId: null,
      tenantId: null
    });

    const res = createRes();

    PaymentController.createPayment(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('updates payment when participant', async () => {
    const req = {
      params: { id: 'payment-1' },
      body: { status: 'COMPLETED' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      userId: 'user-1',
      contract: {
        ownerId: 'user-1',
        managerId: null,
        tenantId: null
      }
    });
    prismaMock.payment.update.mockResolvedValue({ id: 'payment-1' });

    const res = createRes();

    PaymentController.updatePayment(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED'
        })
      })
    );
    expect(res.json).toHaveBeenCalled();
  });
});
