import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

const documentInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  },
  property: {
    select: {
      id: true,
      title: true,
      city: true,
      state: true,
      ownerId: true,
      managerId: true
    }
  }
};

const isAdminUser = (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN;

const buildAccessWhere = (userId: string): Prisma.DocumentWhereInput => ({
  OR: [
    { userId },
    { property: { ownerId: userId } },
    { property: { managerId: userId } }
  ]
});

export class DocumentController {
  /**
   * @route   GET /api/documents
   * @desc    Obtenir les documents accessibles
   * @access  Private
   */
  static getDocuments = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { page = 1, limit = 10, propertyId, userId: queryUserId, all } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.DocumentWhereInput = {};

    if (propertyId) where.propertyId = String(propertyId);

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

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: documentInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.document.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: documents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   GET /api/documents/:id
   * @desc    Obtenir un document par ID
   * @access  Private
   */
  static getDocumentById = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const document = await prisma.document.findUnique({
      where: { id },
      include: documentInclude
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    const hasAccess =
      document.userId === userId ||
      document.property?.ownerId === userId ||
      document.property?.managerId === userId;

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    return res.json({
      success: true,
      data: document
    });
  });

  /**
   * @route   POST /api/documents
   * @desc    Créer un document
   * @access  Private
   */
  static createDocument = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);
    const { propertyId, name, type, url, size, mimeType, userId: bodyUserId } = req.body;

    let property: { id: string; ownerId: string; managerId: string | null } | null = null;
    if (propertyId) {
      property = await prisma.property.findUnique({
        where: { id: String(propertyId) },
        select: { id: true, ownerId: true, managerId: true }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Propriété non trouvée'
        });
      }

      const hasAccess = property.ownerId === userId || property.managerId === userId;
      if (!isAdmin && !hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
    }

    let resolvedUserId = userId;
    if (isAdmin && bodyUserId) {
      const user = await prisma.user.findUnique({
        where: { id: String(bodyUserId) },
        select: { id: true }
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      resolvedUserId = user.id;
    }

    const document = await prisma.document.create({
      data: {
        userId: resolvedUserId,
        propertyId: property?.id,
        name,
        type,
        url,
        size,
        mimeType
      },
      include: documentInclude
    });

    return res.status(201).json({
      success: true,
      message: 'Document créé avec succès',
      data: document
    });
  });

  /**
   * @route   DELETE /api/documents/:id
   * @desc    Supprimer un document
   * @access  Private
   */
  static deleteDocument = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        property: {
          select: { ownerId: true, managerId: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    const hasAccess =
      document.userId === userId ||
      document.property?.ownerId === userId ||
      document.property?.managerId === userId;

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    await prisma.document.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
  });
}
