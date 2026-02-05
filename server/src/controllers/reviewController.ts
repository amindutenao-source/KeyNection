import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

const reviewInclude = {
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
      state: true
    }
  }
};

const isAdminUser = (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN;

export class ReviewController {
  /**
   * @route   GET /api/reviews
   * @desc    Obtenir les avis
   * @access  Public
   */
  static getReviews = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page = 1, limit = 20, propertyId, userId } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.ReviewWhereInput = {};
    if (propertyId) where.propertyId = String(propertyId);
    if (userId) where.userId = String(userId);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: reviewInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.review.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   GET /api/reviews/:id
   * @desc    Obtenir un avis par ID
   * @access  Public
   */
  static getReviewById = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: reviewInclude
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    return res.json({
      success: true,
      data: review
    });
  });

  /**
   * @route   POST /api/reviews
   * @desc    Créer un avis
   * @access  Private
   */
  static createReview = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { propertyId, rating, title, comment } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: String(propertyId) },
      select: { id: true }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propriété non trouvée'
      });
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        propertyId_userId: {
          propertyId: property.id,
          userId
        }
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis pour cette propriété'
      });
    }

    const review = await prisma.review.create({
      data: {
        propertyId: property.id,
        userId,
        rating,
        title,
        comment
      },
      include: reviewInclude
    });

    return res.status(201).json({
      success: true,
      message: 'Avis créé avec succès',
      data: review
    });
  });

  /**
   * @route   PUT /api/reviews/:id
   * @desc    Mettre à jour un avis
   * @access  Private
   */
  static updateReview = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    if (!isAdmin && review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: req.body.rating,
        title: req.body.title,
        comment: req.body.comment
      },
      include: reviewInclude
    });

    return res.json({
      success: true,
      message: 'Avis mis à jour avec succès',
      data: updated
    });
  });

  /**
   * @route   DELETE /api/reviews/:id
   * @desc    Supprimer un avis
   * @access  Private
   */
  static deleteReview = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    if (!isAdmin && review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    await prisma.review.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Avis supprimé avec succès'
    });
  });
}
