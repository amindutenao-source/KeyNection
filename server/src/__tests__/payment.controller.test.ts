import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { PaymentController } from '../controllers/paymentController';

jest.mock('../lib/prisma', () => {
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

describe('PaymentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists payments for admin with user filter and sorting', async () => {
    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      query: { userId: 'user-2', sortBy: 'amount', sortOrder: 'asc', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.findMany.mockResolvedValue([]);
    prismaMock.payment.count.mockResolvedValue(0);

    const res = createRes();

    PaymentController.getPayments(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-2' }),
        orderBy: expect.objectContaining({ amount: 'asc' })
      })
    );
  });

  it('lists payments for non-admin with access filter', async () => {
    const req = {
      user: { id: 'user-1', role: 'OWNER' },
      query: { status: 'COMPLETED', method: 'CARD', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.findMany.mockResolvedValue([]);
    prismaMock.payment.count.mockResolvedValue(0);

    const res = createRes();

    PaymentController.getPayments(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'COMPLETED',
          method: 'CARD',
          OR: expect.any(Array)
        })
      })
    );
  });

  it('returns 404 when payment is missing', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.findUnique.mockResolvedValue(null);

    const res = createRes();

    PaymentController.getPaymentById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when payment access is denied', async () => {
    const req = {
      params: { id: 'payment-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      userId: 'other-user',
      contract: { ownerId: 'other', managerId: null, tenantId: null }
    });

    const res = createRes();

    PaymentController.getPaymentById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns payment when user has access', async () => {
    const req = {
      params: { id: 'payment-1' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      userId: 'user-1',
      contract: { ownerId: 'other', managerId: null, tenantId: null }
    });

    const res = createRes();

    PaymentController.getPaymentById(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
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

  it('returns 404 when contract is missing on create', async () => {
    const req = {
      body: { contractId: 'missing', amount: 1200, method: 'BANK_TRANSFER' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.contract.findUnique.mockResolvedValue(null);

    const res = createRes();

    PaymentController.createPayment(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('creates payment without contract and parses amount', async () => {
    const req = {
      body: { amount: 'abc', method: 'CARD', description: 'Rent' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.create.mockResolvedValue({ id: 'pay-1' });

    const res = createRes();

    PaymentController.createPayment(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 0,
          currency: 'USD'
        })
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
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

  it('returns 404 when updating missing payment', async () => {
    const req = {
      params: { id: 'missing' },
      body: { status: 'FAILED' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.findUnique.mockResolvedValue(null);

    const res = createRes();

    PaymentController.updatePayment(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when updating payment without access', async () => {
    const req = {
      params: { id: 'payment-1' },
      body: { status: 'FAILED' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      userId: 'other',
      contract: { ownerId: 'other', managerId: null, tenantId: null }
    });

    const res = createRes();

    PaymentController.updatePayment(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('uses explicit processedAt when provided', async () => {
    const req = {
      params: { id: 'payment-1' },
      body: { processedAt: '2026-01-02' },
      user: { id: 'user-1', role: 'OWNER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      userId: 'user-1',
      contract: { ownerId: 'user-1', managerId: null, tenantId: null }
    });
    prismaMock.payment.update.mockResolvedValue({ id: 'payment-1' });

    const res = createRes();

    PaymentController.updatePayment(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processedAt: expect.any(Date)
        })
      })
    );
  });
});
