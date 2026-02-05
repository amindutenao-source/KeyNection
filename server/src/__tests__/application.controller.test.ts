import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { ApplicationController } from '../controllers/applicationController';

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    application: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    property: {
      findFirst: jest.fn(),
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

describe('ApplicationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists applications for the current user', async () => {
    const req = {
      user: { id: 'user-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.application.findMany.mockResolvedValue([{ id: 'app-1' }]);

    const res = createRes();

    ApplicationController.getMyApplications(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { applicantId: 'user-1' } })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when property is missing for owner applications', async () => {
    const req = {
      params: { propertyId: 'prop-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue(null);

    const res = createRes();

    ApplicationController.getApplicationsForProperty(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('creates an application when property is available', async () => {
    const req = {
      body: {
        propertyId: 'prop-1',
        moveInDate: '2026-01-01',
        leaseTerm: '12',
        monthlyIncome: '4500',
        creditScore: '720',
        annualIncome: '84000',
        personalReferences: '["Alice","Bob"]',
        personalReferencePhones: '["111","222"]',
        documents: 'doc.pdf'
      },
      user: { id: 'applicant-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({
      id: 'prop-1',
      status: 'AVAILABLE',
      listedAt: new Date()
    });
    prismaMock.application.findFirst.mockResolvedValue(null);
    prismaMock.application.create.mockResolvedValue({ id: 'app-1' });

    const res = createRes();

    ApplicationController.createApplication(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          propertyId: 'prop-1',
          applicantId: 'applicant-1',
          leaseTerm: 12,
          monthlyIncome: 4500,
          creditScore: 720,
          annualIncome: 84000,
          personalReferences: ['Alice', 'Bob'],
          personalReferencePhones: ['111', '222'],
          documents: ['doc.pdf']
        })
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('updates application status for the owner', async () => {
    const req = {
      params: { id: 'app-1' },
      user: { id: 'owner-1' },
      body: {
        status: 'APPROVED',
        personalReferences: '["Ref"]',
        personalReferencePhones: '["000"]'
      }
    } as unknown as AuthenticatedRequest;

    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app-1',
      property: { ownerId: 'owner-1' }
    });
    prismaMock.application.update.mockResolvedValue({ id: 'app-1', status: 'APPROVED' });

    const res = createRes();

    ApplicationController.updateApplication(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app-1' },
        data: expect.objectContaining({
          status: 'APPROVED',
          reviewedBy: 'owner-1',
          reviewedAt: expect.any(Date),
          personalReferences: { set: ['Ref'] },
          personalReferencePhones: { set: ['000'] }
        })
      })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('withdraws an application for the applicant', async () => {
    const req = {
      params: { id: 'app-1' },
      user: { id: 'applicant-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app-1',
      applicantId: 'applicant-1'
    });
    prismaMock.application.update.mockResolvedValue({ id: 'app-1', status: 'WITHDRAWN' });

    const res = createRes();

    ApplicationController.withdrawApplication(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.application.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'WITHDRAWN' } })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 403 when user is not owner or applicant', async () => {
    const req = {
      params: { id: 'app-1' },
      user: { id: 'other-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app-1',
      applicantId: 'applicant-1',
      property: { ownerId: 'owner-1' }
    });

    const res = createRes();

    ApplicationController.getApplicationById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
