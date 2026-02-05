import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

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

const paymentInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  },
  contract: {
    select: {
      id: true,
      status: true,
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          state: true
        }
      },
      ownerId: true,
      managerId: true,
      tenantId: true
    }
  }
};

const isAdminUser = (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN;

const buildAccessWhere = (userId: string): Prisma.PaymentWhereInput => ({
  OR: [
    { userId },
    { contract: { ownerId: userId } },
    { contract: { managerId: userId } },
    { contract: { tenantId: userId } }
  ]
});

export class PaymentController {
  /**
   * @route   GET /api/payments
   * @desc    Obtenir les paiements accessibles par l'utilisateur
   * @access  Private
   */
  static getPayments = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const {
      page = 1,
      limit = 10,
      status,
      method,
      contractId,
      userId: queryUserId,
      all,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.PaymentWhereInput = {};

    if (status) where.status = status as any;
    if (method) where.method = method as any;
    if (contractId) where.contractId = String(contractId);

    const isAdmin = isAdminUser(req);

    if (isAdmin) {
      if (queryUserId) {
        where.userId = String(queryUserId);
      } else if (String(all).toLowerCase() !== 'true') {
        Object.assign(where, buildAccessWhere(userId));
      }
    } else {
      Object.assign(where, buildAccessWhere(userId));
    }

    const allowedSortFields = ['createdAt', 'amount', 'status'];
    const sortField = allowedSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: paymentInclude,
        orderBy: { [sortField]: sortDirection } as Prisma.PaymentOrderByWithRelationInput,
        skip,
        take: limitNum
      }),
      prisma.payment.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   GET /api/payments/:id
   * @desc    Obtenir un paiement par ID
   * @access  Private
   */
  static getPaymentById = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: paymentInclude
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    const contract = payment.contract;
    const hasAccess =
      payment.userId === userId ||
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
      data: payment
    });
  });

  /**
   * @route   POST /api/payments
   * @desc    Créer un paiement
   * @access  Private
   */
  static createPayment = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { contractId, amount, currency, method, description } = req.body;

    let contract: { id: string; ownerId: string; managerId: string | null; tenantId: string | null } | null = null;

    if (contractId) {
      contract = await prisma.contract.findUnique({
        where: { id: String(contractId) },
        select: { id: true, ownerId: true, managerId: true, tenantId: true }
      });

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contrat non trouvé'
        });
      }

      const isAdmin = isAdminUser(req);
      const isParticipant =
        contract.ownerId === userId ||
        contract.managerId === userId ||
        contract.tenantId === userId;

      if (!isAdmin && !isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        contractId: contract?.id,
        amount: parseNumber(amount) || 0,
        currency: currency || 'USD',
        method,
        description
      },
      include: paymentInclude
    });

    return res.status(201).json({
      success: true,
      message: 'Paiement créé avec succès',
      data: payment
    });
  });

  /**
   * @route   PUT /api/payments/:id
   * @desc    Mettre à jour un paiement
   * @access  Private
   */
  static updatePayment = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        contract: {
          select: {
            ownerId: true,
            managerId: true,
            tenantId: true
          }
        }
      }
    });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    const contract = existingPayment.contract;
    const isParticipant =
      existingPayment.userId === userId ||
      contract?.ownerId === userId ||
      contract?.managerId === userId ||
      contract?.tenantId === userId;

    if (!isAdmin && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const processedAt = parseDate(req.body.processedAt);
    const status = req.body.status;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        receiptUrl: req.body.receiptUrl,
        failureReason: req.body.failureReason,
        transactionId: req.body.transactionId,
        processedAt: processedAt ?? (status === 'COMPLETED' ? new Date() : undefined)
      },
      include: paymentInclude
    });

    return res.json({
      success: true,
      message: 'Paiement mis à jour avec succès',
      data: payment
    });
  });
}
