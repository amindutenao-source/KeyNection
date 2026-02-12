import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { ReviewController } from '../controllers/reviewController';

jest.mock('../lib/prisma', () => {
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

describe('ReviewController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists reviews with filters', async () => {
    const req = {
      query: { propertyId: 'prop-1', userId: 'user-1', page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.review.findMany.mockResolvedValue([]);
    prismaMock.review.count.mockResolvedValue(0);

    const res = createRes();

    ReviewController.getReviews(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          propertyId: 'prop-1',
          userId: 'user-1'
        })
      })
    );
  });

  it('returns 404 when review is missing', async () => {
    const req = {
      params: { id: 'missing' }
    } as unknown as AuthenticatedRequest;

    prismaMock.review.findUnique.mockResolvedValue(null);

    const res = createRes();

    ReviewController.getReviewById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns review by id', async () => {
    const req = {
      params: { id: 'review-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.review.findUnique.mockResolvedValue({ id: 'review-1' });

    const res = createRes();

    ReviewController.getReviewById(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when property missing on create', async () => {
    const req = {
      body: { propertyId: 'prop-1', rating: 4 },
      user: { id: 'user-1', role: 'MANAGER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue(null);

    const res = createRes();

    ReviewController.createReview(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
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

  it('creates review when no existing review', async () => {
    const req = {
      body: { propertyId: 'prop-1', rating: 4, title: 'Great', comment: 'Nice' },
      user: { id: 'user-1', role: 'MANAGER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({ id: 'prop-1' });
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.review.create.mockResolvedValue({ id: 'review-1' });

    const res = createRes();

    ReviewController.createReview(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 404 when review to update is missing', async () => {
    const req = {
      params: { id: 'missing' },
      body: { rating: 5 },
      user: { id: 'user-1', role: 'MANAGER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.review.findUnique.mockResolvedValue(null);

    const res = createRes();

    ReviewController.updateReview(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
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

  it('allows admin to update review', async () => {
    const req = {
      params: { id: 'review-1' },
      body: { rating: 5 },
      user: { id: 'admin-1', role: 'ADMIN' }
    } as unknown as AuthenticatedRequest;

    prismaMock.review.findUnique.mockResolvedValue({
      id: 'review-1',
      userId: 'user-2'
    });
    prismaMock.review.update.mockResolvedValue({ id: 'review-1' });

    const res = createRes();

    ReviewController.updateReview(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when deleting missing review', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1', role: 'MANAGER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.review.findUnique.mockResolvedValue(null);

    const res = createRes();

    ReviewController.deleteReview(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('prevents delete by non-owner', async () => {
    const req = {
      params: { id: 'review-1' },
      user: { id: 'user-1', role: 'MANAGER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.review.findUnique.mockResolvedValue({ id: 'review-1', userId: 'user-2' });

    const res = createRes();

    ReviewController.deleteReview(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('deletes review when user has access', async () => {
    const req = {
      params: { id: 'review-1' },
      user: { id: 'user-1', role: 'MANAGER' }
    } as unknown as AuthenticatedRequest;

    prismaMock.review.findUnique.mockResolvedValue({ id: 'review-1', userId: 'user-1' });
    prismaMock.review.delete.mockResolvedValue({ id: 'review-1' });

    const res = createRes();

    ReviewController.deleteReview(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.review.delete).toHaveBeenCalledWith({ where: { id: 'review-1' } });
  });
});
