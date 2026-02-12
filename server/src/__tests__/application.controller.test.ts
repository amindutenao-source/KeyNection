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

  it('returns applications for a property owner', async () => {
    const req = {
      params: { propertyId: 'prop-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findFirst.mockResolvedValue({ id: 'prop-1', ownerId: 'owner-1' });
    prismaMock.application.findMany.mockResolvedValue([{ id: 'app-1' }]);

    const res = createRes();

    ApplicationController.getApplicationsForProperty(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { propertyId: 'prop-1' } })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
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

  it('handles invalid numeric and array inputs when creating application', async () => {
    const req = {
      body: {
        propertyId: 'prop-1',
        leaseTerm: '',
        monthlyIncome: 'abc',
        creditScore: 'bad',
        annualIncome: null,
        personalReferences: 123,
        personalReferencePhones: '   ',
        documents: ['doc-1']
      },
      user: { id: 'applicant-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({
      id: 'prop-1',
      status: 'AVAILABLE',
      listedAt: new Date()
    });
    prismaMock.application.findFirst.mockResolvedValue(null);
    prismaMock.application.create.mockResolvedValue({ id: 'app-2' });

    const res = createRes();

    ApplicationController.createApplication(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          leaseTerm: undefined,
          monthlyIncome: undefined,
          creditScore: undefined,
          annualIncome: undefined,
          personalReferences: ['123'],
          personalReferencePhones: [],
          documents: ['doc-1']
        })
      })
    );
  });

  it('returns 404 when property does not exist for create', async () => {
    const req = {
      body: { propertyId: 'missing' },
      user: { id: 'applicant-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue(null);

    const res = createRes();

    ApplicationController.createApplication(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when property is not available', async () => {
    const req = {
      body: { propertyId: 'prop-1' },
      user: { id: 'applicant-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({
      id: 'prop-1',
      status: 'RENTED',
      listedAt: null
    });

    const res = createRes();

    ApplicationController.createApplication(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when application already exists', async () => {
    const req = {
      body: { propertyId: 'prop-1' },
      user: { id: 'applicant-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.property.findUnique.mockResolvedValue({
      id: 'prop-1',
      status: 'AVAILABLE',
      listedAt: new Date()
    });
    prismaMock.application.findFirst.mockResolvedValue({ id: 'existing' });

    const res = createRes();

    ApplicationController.createApplication(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(400);
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

  it('returns 404 when updating non-owned application', async () => {
    const req = {
      params: { id: 'app-1' },
      user: { id: 'owner-1' },
      body: {}
    } as unknown as AuthenticatedRequest;

    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app-1',
      property: { ownerId: 'other-owner' }
    });

    const res = createRes();

    ApplicationController.updateApplication(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('does not set review fields when status missing', async () => {
    const req = {
      params: { id: 'app-2' },
      user: { id: 'owner-1' },
      body: {
        personalReferences: ['Ref A']
      }
    } as unknown as AuthenticatedRequest;

    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app-2',
      property: { ownerId: 'owner-1' }
    });
    prismaMock.application.update.mockResolvedValue({ id: 'app-2' });

    const res = createRes();

    ApplicationController.updateApplication(req, res, jest.fn());
    await flushPromises();

    expect(prismaMock.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reviewedAt: undefined,
          reviewedBy: undefined,
          personalReferences: { set: ['Ref A'] }
        })
      })
    );
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

  it('returns 404 when withdrawing non-owned application', async () => {
    const req = {
      params: { id: 'app-1' },
      user: { id: 'other-user' }
    } as unknown as AuthenticatedRequest;

    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app-1',
      applicantId: 'applicant-1'
    });

    const res = createRes();

    ApplicationController.withdrawApplication(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
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

  it('returns 404 when application is missing', async () => {
    const req = {
      params: { id: 'missing' },
      user: { id: 'user-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.application.findUnique.mockResolvedValue(null);

    const res = createRes();

    ApplicationController.getApplicationById(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns application for owner', async () => {
    const req = {
      params: { id: 'app-1' },
      user: { id: 'owner-1' }
    } as unknown as AuthenticatedRequest;

    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app-1',
      applicantId: 'applicant-1',
      property: { ownerId: 'owner-1' }
    });

    const res = createRes();

    ApplicationController.getApplicationById(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
