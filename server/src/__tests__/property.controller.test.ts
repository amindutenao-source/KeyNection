import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { PropertyController } from '../controllers/propertyController';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    property: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  };

  return {
    __esModule: true,
    default: mockPrisma
  };
});

jest.mock('../middleware/upload', () => {
  const mockUpload = {
    deleteFile: jest.fn().mockResolvedValue(undefined),
    getFileUrl: jest.fn((filename: string) => `http://localhost/uploads/${filename}`)
  };

  return {
    ...mockUpload,
    __mock: mockUpload
  };
});

const prismaMock = (jest.requireMock('../lib/prisma') as { default: any }).default;
const uploadMock = (jest.requireMock('../middleware/upload') as { __mock: any }).__mock;
const getFileUrlMock = uploadMock.getFileUrl as jest.Mock;
const deleteFileMock = uploadMock.deleteFile as jest.Mock;


const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  return res;
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('PropertyController CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a property without files and parses fields', async () => {
    const req = {
      body: {
        title: 'Test property',
        description: 'Nice place',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        address: '123 Main St',
        city: 'Paris',
        state: 'Ile-de-France',
        zipCode: '75001',
        country: 'France',
        bedrooms: '2',
        bathrooms: '1',
        furnished: 'true',
        petsAllowed: 'false',
        smokingAllowed: '',
        features: '["Balcony","Parking"]',
        amenities: 123
      },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.create.mockResolvedValue({
      id: 'prop-2',
      title: 'Test property'
    });

    const res = createRes();

    PropertyController.createProperty(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bedrooms: 2,
          bathrooms: 1,
          furnished: true,
          petsAllowed: false,
          smokingAllowed: false,
          features: ['Balcony', 'Parking'],
          amenities: ['123'],
          images: []
        })
      })
    );
  });

  it('creates a property for the owner', async () => {
    const req = {
      body: {
        title: 'Test property',
        description: 'Nice place',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        address: '123 Main St',
        city: 'Paris',
        state: 'Ile-de-France',
        zipCode: '75001',
        country: 'France',
        features: ['Balcony'],
        amenities: ['Elevator']
      },
      user: { id: 'owner-1' },
      files: [{ filename: 'photo.jpg' }]
    } as unknown as AuthenticatedRequest;

    prismaMock.property.create.mockResolvedValue({
      id: 'prop-1',
      title: 'Test property'
    });

    const res = createRes();

    PropertyController.createProperty(req, res, jest.fn());
    await flushPromises();

    expect(getFileUrlMock).toHaveBeenCalledWith('photo.jpg');
    expect(prismaMock.property.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: 'owner-1',
          images: ['http://localhost/uploads/photo.jpg']
        })
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });

  it('updates a property owned by the user', async () => {
    const req = {
      params: { id: 'prop-1' },
      body: { title: 'Updated title' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-1',
      images: []
    });
    prismaMock.property.update.mockResolvedValue({
      id: 'prop-1',
      title: 'Updated title'
    });

    const res = createRes();

    PropertyController.updateProperty(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prop-1' }
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });

  it('returns 404 when updating missing property', async () => {
    const req = {
      params: { id: 'prop-1' },
      body: { title: 'Updated title' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue(null);

    const res = createRes();

    PropertyController.updateProperty(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deletes a property owned by the user', async () => {
    const req = {
      params: { id: 'prop-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-1',
      images: ['http://localhost/uploads/photo.jpg']
    });
    prismaMock.property.delete.mockResolvedValue({ id: 'prop-1' });

    const res = createRes();

    PropertyController.deleteProperty(req, res, jest.fn());
    await flushPromises();

    expect(deleteFileMock).toHaveBeenCalledWith('photo.jpg');
    expect(prismaMock.property.delete).toHaveBeenCalledWith({ where: { id: 'prop-1' } });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });

  it('handles image delete errors when removing property', async () => {
    const req = {
      params: { id: 'prop-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-1',
      images: ['http://localhost/uploads/photo.jpg']
    });
    prismaMock.property.delete.mockResolvedValue({ id: 'prop-1' });
    deleteFileMock.mockRejectedValueOnce(new Error('unlink failed'));

    const res = createRes();

    PropertyController.deleteProperty(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.delete).toHaveBeenCalledWith({ where: { id: 'prop-1' } });
  });

  it('returns 404 when deleting missing property', async () => {
    const req = {
      params: { id: 'prop-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue(null);

    const res = createRes();

    PropertyController.deleteProperty(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('PropertyController media and publishing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when property not found for getPropertyById', async () => {
    const req = { params: { id: 'missing' } } as any;
    const res = createRes();

    prismaMock.property.findUnique.mockResolvedValue(null);

    PropertyController.getPropertyById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns property by id when found', async () => {
    const req = { params: { id: 'prop-1' } } as any;
    const res = createRes();

    prismaMock.property.findUnique.mockResolvedValue({ id: 'prop-1' });

    PropertyController.getPropertyById(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('adds images to property', async () => {
    const req = {
      params: { id: 'prop-1' },
      user: { id: 'owner-1' },
      files: [{ filename: 'new.jpg' }]
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-1',
      images: ['http://localhost/uploads/old.jpg']
    });
    prismaMock.property.update.mockResolvedValue({ id: 'prop-1' });

    const res = createRes();

    PropertyController.addImages(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { images: { set: ['http://localhost/uploads/old.jpg', 'http://localhost/uploads/new.jpg'] } }
      })
    );
  });

  it('returns 404 when adding images to missing property', async () => {
    const req = {
      params: { id: 'prop-1' },
      user: { id: 'owner-1' },
      files: []
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue(null);

    const res = createRes();

    PropertyController.addImages(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when removing invalid image index', async () => {
    const req = {
      params: { id: 'prop-1', imageIndex: '5' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-1',
      images: ['http://localhost/uploads/one.jpg']
    });

    const res = createRes();

    PropertyController.removeImage(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('removes image and handles delete errors', async () => {
    const req = {
      params: { id: 'prop-1', imageIndex: '0' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue({
      id: 'prop-1',
      ownerId: 'owner-1',
      images: ['http://localhost/uploads/one.jpg']
    });
    deleteFileMock.mockRejectedValueOnce(new Error('unlink failed'));
    prismaMock.property.update.mockResolvedValue({ id: 'prop-1' });

    const res = createRes();

    PropertyController.removeImage(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { images: { set: [] } }
      })
    );
  });

  it('publishes a property', async () => {
    const req = {
      params: { id: 'prop-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue({ id: 'prop-1', ownerId: 'owner-1' });
    prismaMock.property.update.mockResolvedValue({ id: 'prop-1' });

    const res = createRes();

    PropertyController.publishProperty(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { listedAt: expect.any(Date) }
      })
    );
  });

  it('returns 404 when publishing missing property', async () => {
    const req = {
      params: { id: 'prop-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue(null);

    const res = createRes();

    PropertyController.publishProperty(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('unpublishes a property', async () => {
    const req = {
      params: { id: 'prop-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue({ id: 'prop-1', ownerId: 'owner-1' });
    prismaMock.property.update.mockResolvedValue({ id: 'prop-1' });

    const res = createRes();

    PropertyController.unpublishProperty(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { listedAt: null }
      })
    );
  });

  it('returns 404 when unpublishing missing property', async () => {
    const req = {
      params: { id: 'prop-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue(null);

    const res = createRes();

    PropertyController.unpublishProperty(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('lists properties for current owner', async () => {
    const req = {
      user: { id: 'owner-1' },
      query: { page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findMany.mockResolvedValue([]);
    prismaMock.property.count.mockResolvedValue(0);

    const res = createRes();

    PropertyController.getMyProperties(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'owner-1' }
      })
    );
  });

  it('lists available properties for manager', async () => {
    const req = {
      user: { id: 'manager-1' },
      query: { page: '1', limit: '5' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findMany.mockResolvedValue([]);
    prismaMock.property.count.mockResolvedValue(0);

    const res = createRes();

    PropertyController.getAvailableProperties(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'AVAILABLE'
        })
      })
    );
  });
});
