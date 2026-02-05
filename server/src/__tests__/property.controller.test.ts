import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { PropertyController } from '../controllers/propertyController';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    property: {
      create: jest.fn(),
      findFirst: jest.fn(),
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
});
