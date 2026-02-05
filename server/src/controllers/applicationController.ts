import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import prisma from '../lib/prisma';

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseInteger = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseStringArray = (value: unknown, fallback?: string[]): string[] | undefined => {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [trimmed];
    }
  }
  return [String(value)];
};

const buildCreateData = (
  body: Record<string, any>,
  applicantId: string
): Prisma.ApplicationUncheckedCreateInput => {
  return {
    propertyId: body.propertyId,
    applicantId,
    moveInDate: parseDate(body.moveInDate),
    leaseTerm: parseInteger(body.leaseTerm),
    monthlyIncome: parseNumber(body.monthlyIncome),
    employmentStatus: body.employmentStatus,
    employerName: body.employerName,
    employerPhone: body.employerPhone,
    currentAddress: body.currentAddress,
    currentLandlord: body.currentLandlord,
    currentLandlordPhone: body.currentLandlordPhone,
    reasonForMoving: body.reasonForMoving,
    additionalInfo: body.additionalInfo,
    creditScore: parseInteger(body.creditScore),
    annualIncome: parseNumber(body.annualIncome),
    bankReferences: body.bankReferences,
    personalReferences: parseStringArray(body.personalReferences, []) || [],
    personalReferencePhones: parseStringArray(body.personalReferencePhones, []) || [],
    documents: parseStringArray(body.documents, []) || []
  };
};

const buildUpdateData = (
  body: Record<string, any>,
  reviewerId?: string
): Prisma.ApplicationUpdateInput => {
  const personalReferences = parseStringArray(body.personalReferences);
  const personalReferencePhones = parseStringArray(body.personalReferencePhones);
  const documents = parseStringArray(body.documents);
  const status = body.status;

  return {
    status,
    moveInDate: parseDate(body.moveInDate),
    leaseTerm: parseInteger(body.leaseTerm),
    monthlyIncome: parseNumber(body.monthlyIncome),
    employmentStatus: body.employmentStatus,
    employerName: body.employerName,
    employerPhone: body.employerPhone,
    currentAddress: body.currentAddress,
    currentLandlord: body.currentLandlord,
    currentLandlordPhone: body.currentLandlordPhone,
    reasonForMoving: body.reasonForMoving,
    additionalInfo: body.additionalInfo,
    creditScore: parseInteger(body.creditScore),
    annualIncome: parseNumber(body.annualIncome),
    bankReferences: body.bankReferences,
    personalReferences: personalReferences ? { set: personalReferences } : undefined,
    personalReferencePhones: personalReferencePhones ? { set: personalReferencePhones } : undefined,
    documents: documents ? { set: documents } : undefined,
    reviewedAt: status ? new Date() : undefined,
    reviewedBy: status && reviewerId ? reviewerId : undefined
  };
};

export class ApplicationController {
  /**
   * @route   GET /api/applications
   * @desc    Obtenir toutes les candidatures de l'utilisateur connecté
   * @access  Private
   */
  static getMyApplications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    const applications = await prisma.application.findMany({
      where: { applicantId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            monthlyRent: true,
            images: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: applications
    });
  });

  /**
   * @route   GET /api/applications/property/:propertyId
   * @desc    Obtenir les candidatures pour une propriété (propriétaire uniquement)
   * @access  Private (Owner)
   */
  static getApplicationsForProperty = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId } = req.params;
    const userId = req.user!.id;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: userId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée ou accès non autorisé'
      });
    }

    const applications = await prisma.application.findMany({
      where: { propertyId },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: applications
    });
  });

  /**
   * @route   POST /api/applications
   * @desc    Créer une nouvelle candidature
   * @access  Private (Manager)
   */
  static createApplication = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { propertyId } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée'
      });
    }

    if (property.status !== 'AVAILABLE' || !property.listedAt) {
      return res.status(400).json({
        success: false,
        message: 'La propriété n\'est pas disponible'
      });
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        propertyId,
        applicantId: userId
      }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà postulé pour cette propriété'
      });
    }

    const applicationData = buildCreateData(req.body, userId);

    const application = await prisma.application.create({
      data: applicationData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Candidature créée avec succès',
      data: application
    });
  });

  /**
   * @route   PUT /api/applications/:id
   * @desc    Mettre à jour le statut d'une candidature
   * @access  Private (Owner)
   */
  static updateApplication = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const existingApplication = await prisma.application.findUnique({
      where: { id },
      include: {
        property: true
      }
    });

    if (!existingApplication || existingApplication.property.ownerId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée ou accès non autorisé'
      });
    }

    const updateData = buildUpdateData(req.body, userId);

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Candidature mise à jour avec succès',
      data: updatedApplication
    });
  });

  /**
   * @route   DELETE /api/applications/:id
   * @desc    Retirer une candidature
   * @access  Private (Manager)
   */
  static withdrawApplication = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const application = await prisma.application.findUnique({
      where: { id }
    });

    if (!application || application.applicantId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée ou accès non autorisé'
      });
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status: 'WITHDRAWN' }
    });

    return res.json({
      success: true,
      message: 'Candidature retirée avec succès',
      data: updatedApplication
    });
  });

  /**
   * @route   GET /api/applications/:id
   * @desc    Obtenir une candidature par ID
   * @access  Private
   */
  static getApplicationById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            ownerId: true
          }
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }

    const isOwner = application.property?.ownerId === userId;
    const isApplicant = application.applicantId === userId;

    if (!isOwner && !isApplicant) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    return res.json({
      success: true,
      data: application
    });
  });
}
