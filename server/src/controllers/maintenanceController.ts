import { Prisma, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import prisma from '../lib/prisma';

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseDate = (value: unknown): Date | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
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

const maintenanceInclude = {
  property: {
    select: {
      id: true,
      title: true,
      city: true,
      state: true,
      ownerId: true,
      managerId: true
    }
  },
  contract: {
    select: {
      id: true,
      status: true,
      ownerId: true,
      managerId: true,
      tenantId: true
    }
  }
};

const isAdminUser = (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN;

const buildAccessWhere = (userId: string): Prisma.MaintenanceRequestWhereInput => ({
  OR: [
    { property: { ownerId: userId } },
    { property: { managerId: userId } },
    { contract: { ownerId: userId } },
    { contract: { managerId: userId } },
    { contract: { tenantId: userId } }
  ]
});

export class MaintenanceController {
  /**
   * @route   GET /api/maintenance
   * @desc    Obtenir les demandes de maintenance
   * @access  Private
   */
  static getMaintenanceRequests = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { page = 1, limit = 10, status, priority, propertyId, all } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (propertyId) where.propertyId = String(propertyId);

    const isAdmin = isAdminUser(req);
    if (isAdmin) {
      if (String(all).toLowerCase() !== 'true') {
        Object.assign(where, buildAccessWhere(userId));
      }
    } else {
      Object.assign(where, buildAccessWhere(userId));
    }

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: maintenanceInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.maintenanceRequest.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   GET /api/maintenance/:id
   * @desc    Obtenir une demande de maintenance par ID
   * @access  Private
   */
  static getMaintenanceById = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: maintenanceInclude
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande de maintenance non trouvée'
      });
    }

    const property = request.property;
    const contract = request.contract;

    const hasAccess =
      property?.ownerId === userId ||
      property?.managerId === userId ||
      contract?.ownerId === userId ||
      contract?.managerId === userId ||
      contract?.tenantId === userId;

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    return res.json({
      success: true,
      data: request
    });
  });

  /**
   * @route   POST /api/maintenance
   * @desc    Créer une demande de maintenance
   * @access  Private
   */
  static createMaintenanceRequest = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const {
      propertyId,
      contractId,
      title,
      description,
      priority,
      status = 'PENDING',
      category,
      estimatedCost,
      scheduledDate,
      images
    } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: String(propertyId) },
      select: { id: true, ownerId: true, managerId: true }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée'
      });
    }

    let contract: {
      id: string;
      ownerId: string;
      managerId: string | null;
      tenantId: string | null;
      propertyId: string;
    } | null = null;
    if (contractId) {
      contract = await prisma.contract.findUnique({
        where: { id: String(contractId) },
        select: { id: true, ownerId: true, managerId: true, tenantId: true, propertyId: true }
      });

      if (!contract || contract.propertyId !== property.id) {
        return res.status(400).json({
          success: false,
          message: 'Contrat invalide pour cette propriété'
        });
      }
    }

    const isAdmin = isAdminUser(req);
    const hasAccess =
      property.ownerId === userId ||
      property.managerId === userId ||
      contract?.ownerId === userId ||
      contract?.managerId === userId ||
      contract?.tenantId === userId;

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const maintenance = await prisma.maintenanceRequest.create({
      data: {
        propertyId: property.id,
        contractId: contract?.id,
        title,
        description,
        priority,
        status,
        category,
        estimatedCost: parseNumber(estimatedCost),
        scheduledDate: parseDate(scheduledDate),
        images: parseStringArray(images, []) || []
      },
      include: maintenanceInclude
    });

    return res.status(201).json({
      success: true,
      message: 'Demande de maintenance créée avec succès',
      data: maintenance
    });
  });

  /**
   * @route   PUT /api/maintenance/:id
   * @desc    Mettre à jour une demande de maintenance
   * @access  Private
   */
  static updateMaintenanceRequest = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const existing = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: maintenanceInclude
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Demande de maintenance non trouvée'
      });
    }

    const property = existing.property;
    const contract = existing.contract;

    const hasAccess =
      property?.ownerId === userId ||
      property?.managerId === userId ||
      contract?.ownerId === userId ||
      contract?.managerId === userId;

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const status = req.body.status;
    const completedDate = parseDate(req.body.completedDate);

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        status,
        category: req.body.category,
        estimatedCost: parseNumber(req.body.estimatedCost),
        actualCost: parseNumber(req.body.actualCost),
        scheduledDate: parseDate(req.body.scheduledDate),
        completedDate: completedDate ?? (status === 'COMPLETED' ? new Date() : undefined)
      },
      include: maintenanceInclude
    });

    return res.json({
      success: true,
      message: 'Demande de maintenance mise à jour avec succès',
      data: updated
    });
  });

  /**
   * @route   DELETE /api/maintenance/:id
   * @desc    Supprimer une demande de maintenance
   * @access  Private (Admin)
   */
  static deleteMaintenanceRequest = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const isAdmin = isAdminUser(req);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    await prisma.maintenanceRequest.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Demande de maintenance supprimée'
    });
  });
}
