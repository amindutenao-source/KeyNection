import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { ReviewController } from '../controllers/reviewController';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    property: {
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

describe('ReviewController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when review already exists', async () => {
    const req = {
      body: { propertyId: 'prop-1', rating: 4 },
      user: { id: 'user-1', role: 'MANAGER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({ id: 'prop-1' });
    prismaMock.review.findUnique.mockResolvedValue({ id: 'review-1' });

    const res = createRes();

    ReviewController.createReview(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('prevents update by non-owner', async () => {
    const req = {
      params: { id: 'review-1' },
      body: { rating: 5 },
      user: { id: 'user-1', role: 'MANAGER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.review.findUnique.mockResolvedValue({
      id: 'review-1',
      userId: 'user-2'
    });

    const res = createRes();

    ReviewController.updateReview(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
