import type { Request, Response } from 'express';
import { PropertyController } from '../controllers/propertyController';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    property: {
      findMany: jest.fn(),
      count: jest.fn()
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
    json: jest.fn()
  } as unknown as Response;

  return res;
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('PropertyController listing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds filters and pagination for getAllProperties', async () => {
    prismaMock.property.findMany.mockResolvedValue([
      { id: 'prop-1', title: 'Test' }
    ]);
    prismaMock.property.count.mockResolvedValue(1);

    const req = {
      query: {
        page: '2',
        limit: '5',
        city: 'Paris',
        minPrice: '1000',
        maxPrice: '2000',
        bedrooms: '2',
        furnished: 'true',
        sortBy: 'monthlyRent',
        sortOrder: 'asc'
      }
    } as unknown as Request;

    const res = createRes();

    PropertyController.getAllProperties(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          listedAt: { not: null },
          city: { contains: 'Paris', mode: 'insensitive' },
          monthlyRent: { gte: 1000, lte: 2000 },
          bedrooms: { gte: 2 },
          furnished: true
        }),
        orderBy: { monthlyRent: 'asc' },
        skip: 5,
        take: 5
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        pagination: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1
        }
      })
    );
  });

  it('handles alternate query aliases and default sorting', async () => {
    prismaMock.property.findMany.mockResolvedValue([]);
    prismaMock.property.count.mockResolvedValue(0);

    const req = {
      query: {
        propertyType: 'HOUSE',
        minBedrooms: '3',
        bathrooms: '2',
        petsAllowed: 'true',
        smokingAllowed: 'false',
        sortBy: 'invalid',
        sortOrder: 'invalid'
      }
    } as unknown as Request;

    const res = createRes();

    PropertyController.getAllProperties(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'HOUSE',
          bedrooms: { gte: 3 },
          bathrooms: { gte: 2 },
          petsAllowed: true,
          smokingAllowed: false
        }),
        orderBy: { createdAt: 'desc' }
      })
    );
  });

  it('builds search filters for searchProperties', async () => {
    prismaMock.property.findMany.mockResolvedValue([
      { id: 'prop-1', title: 'Search' }
    ]);

    const req = {
      query: {
        q: 'search',
        city: 'Lyon',
        minPrice: '500'
      }
    } as unknown as Request;

    const res = createRes();

    PropertyController.searchProperties(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          listedAt: { not: null },
          city: { contains: 'Lyon', mode: 'insensitive' },
          monthlyRent: { gte: 500, lte: undefined },
          OR: expect.any(Array)
        }),
        take: 20
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });

  it('searches properties without query term', async () => {
    prismaMock.property.findMany.mockResolvedValue([]);

    const req = {
      query: {
        type: 'APARTMENT',
        status: 'AVAILABLE',
        maxPrice: '1500'
      }
    } as unknown as Request;

    const res = createRes();

    PropertyController.searchProperties(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'APARTMENT',
          status: 'AVAILABLE',
          monthlyRent: { gte: undefined, lte: 1500 }
        })
      })
    );
  });
});
