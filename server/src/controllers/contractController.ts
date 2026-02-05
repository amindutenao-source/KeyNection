import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

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

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const parseDate = (value: unknown): Date | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const buildRelationUpdate = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return { disconnect: true };
  return { connect: { id: String(value) } };
};

const buildUpdateData = (body: Record<string, any>): Prisma.ContractUpdateInput => {
  return {
    status: body.status,
    startDate: parseDate(body.startDate),
    endDate: parseDate(body.endDate),
    monthlyRent: parseNumber(body.monthlyRent),
    securityDeposit: parseNumber(body.securityDeposit),
    utilitiesIncluded: parseBoolean(body.utilitiesIncluded),
    lateFee: parseNumber(body.lateFee),
    gracePeriod: parseInteger(body.gracePeriod),
    contractType: body.contractType,
    terms: body.terms,
    specialConditions: body.specialConditions,
    manager: buildRelationUpdate(body.managerId),
    tenant: buildRelationUpdate(body.tenantId)
  };
};

const contractInclude = {
  property: {
    select: {
      id: true,
      title: true,
      city: true,
      state: true,
      monthlyRent: true,
      status: true
    }
  },
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  },
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  },
  tenant: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  },
  application: {
    select: {
      id: true,
      status: true,
      applicantId: true
    }
  }
};

const isAdminUser = (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN;

export class ContractController {
  /**
   * @route   GET /api/contracts
   * @desc    Obtenir tous les contrats de l'utilisateur connecte
   * @access  Private
   */
  static getMyContracts = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { page = 1, limit = 10, status, userId: queryUserId, all } = req.query;
    const isAdmin = isAdminUser(req);

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.ContractWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (isAdmin) {
      if (queryUserId) {
        where.OR = [
          { ownerId: String(queryUserId) },
          { managerId: String(queryUserId) },
          { tenantId: String(queryUserId) }
        ];
      } else if (!(String(all).toLowerCase() === 'true')) {
        where.OR = [
          { ownerId: userId },
          { managerId: userId },
          { tenantId: userId }
        ];
      }
    } else {
      where.OR = [
        { ownerId: userId },
        { managerId: userId },
        { tenantId: userId }
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: contractInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.contract.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: contracts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   GET /api/contracts/:id
   * @desc    Obtenir un contrat par ID
   * @access  Private
   */
  static getContractById = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: contractInclude
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouve'
      });
    }

    const isParticipant =
      contract.ownerId === userId ||
      contract.managerId === userId ||
      contract.tenantId === userId;

    if (!isAdmin && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Acces non autorise'
      });
    }

    return res.json({
      success: true,
      data: contract
    });
  });

  /**
   * @route   POST /api/contracts
   * @desc    Creer un nouveau contrat
   * @access  Private (Owner/Admin)
   */
  static createContract = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);
    const {
      propertyId,
      applicationId,
      managerId,
      tenantId,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      utilitiesIncluded,
      lateFee,
      gracePeriod,
      contractType,
      terms,
      specialConditions
    } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: String(propertyId) },
      select: { id: true, ownerId: true }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriete non trouvee'
      });
    }

    if (!isAdmin && property.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acces non autorise'
      });
    }

    const resolvedApplicationId = applicationId ? String(applicationId) : undefined;
    let resolvedManagerId = managerId ? String(managerId) : undefined;

    if (resolvedApplicationId) {
      const application = await prisma.application.findUnique({
        where: { id: resolvedApplicationId },
        select: { id: true, propertyId: true, applicantId: true }
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Candidature non trouvee'
        });
      }

      if (application.propertyId !== property.id) {
        return res.status(400).json({
          success: false,
          message: 'La candidature ne correspond pas a la propriete'
        });
      }

      if (!resolvedManagerId) {
        resolvedManagerId = application.applicantId;
      }
    }

    const contract = await prisma.contract.create({
      data: {
        propertyId: property.id,
        ownerId: property.ownerId,
        applicationId: resolvedApplicationId,
        managerId: resolvedManagerId,
        tenantId: tenantId ? String(tenantId) : undefined,
        startDate: parseDate(startDate),
        endDate: parseDate(endDate),
        monthlyRent: parseNumber(monthlyRent),
        securityDeposit: parseNumber(securityDeposit),
        utilitiesIncluded: parseBoolean(utilitiesIncluded) ?? false,
        lateFee: parseNumber(lateFee),
        gracePeriod: parseInteger(gracePeriod),
        contractType,
        terms,
        specialConditions
      },
      include: contractInclude
    });

    return res.status(201).json({
      success: true,
      message: 'Contrat cree avec succes',
      data: contract
    });
  });

  /**
   * @route   PUT /api/contracts/:id
   * @desc    Mettre a jour un contrat
   * @access  Private (Owner/Admin)
   */
  static updateContract = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { id: true, ownerId: true }
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouve'
      });
    }

    if (!isAdmin && contract.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acces non autorise'
      });
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: buildUpdateData(req.body),
      include: contractInclude
    });

    return res.json({
      success: true,
      message: 'Contrat mis a jour avec succes',
      data: updated
    });
  });

  /**
   * @route   PUT /api/contracts/:id/sign
   * @desc    Signer un contrat
   * @access  Private
   */
  static signContract = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const contract = await prisma.contract.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        managerId: true,
        tenantId: true,
        ownerSignedAt: true,
        managerSignedAt: true,
        tenantSignedAt: true,
        status: true
      }
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouve'
      });
    }

    const now = new Date();

    const nextOwnerSignedAt =
      contract.ownerId === userId ? contract.ownerSignedAt ?? now : contract.ownerSignedAt;
    const nextManagerSignedAt =
      contract.managerId === userId ? contract.managerSignedAt ?? now : contract.managerSignedAt;
    const nextTenantSignedAt =
      contract.tenantId === userId ? contract.tenantSignedAt ?? now : contract.tenantSignedAt;

    const didSign =
      contract.ownerId === userId || contract.managerId === userId || contract.tenantId === userId;

    if (!didSign) {
      return res.status(403).json({
        success: false,
        message: 'Acces non autorise'
      });
    }

    const shouldActivate =
      Boolean(nextOwnerSignedAt) &&
      (!contract.managerId || Boolean(nextManagerSignedAt)) &&
      (!contract.tenantId || Boolean(nextTenantSignedAt));

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        ownerSignedAt: nextOwnerSignedAt ?? undefined,
        managerSignedAt: nextManagerSignedAt ?? undefined,
        tenantSignedAt: nextTenantSignedAt ?? undefined,
        status: shouldActivate ? 'ACTIVE' : contract.status
      },
      include: contractInclude
    });

    return res.json({
      success: true,
      message: 'Contrat signe avec succes',
      data: updated
    });
  });
}
