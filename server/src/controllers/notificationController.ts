import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

const isAdminUser = (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN;

export class NotificationController {
  /**
   * @route   GET /api/notifications
   * @desc    Obtenir toutes les notifications de l'utilisateur connecte
   * @access  Private
   */
  static getMyNotifications = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { page = 1, limit = 10, status, type, userId: queryUserId, all } = req.query;
    const isAdmin = isAdminUser(req);

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.NotificationWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (type) {
      where.type = type as any;
    }

    if (isAdmin) {
      if (queryUserId) {
        where.userId = String(queryUserId);
      } else if (!parseBoolean(all)) {
        where.userId = userId;
      }
    } else {
      where.userId = userId;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.notification.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   POST /api/notifications
   * @desc    Creer une notification
   * @access  Private (Admin)
   */
  static createNotification = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      userId,
      type,
      status,
      title,
      message,
      data,
      propertyId,
      applicationId,
      contractId,
      paymentId
    } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        status,
        title,
        message,
        data,
        propertyId,
        applicationId,
        contractId,
        paymentId
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Notification creee avec succes',
      data: notification
    });
  });

  /**
   * @route   PUT /api/notifications/:id/read
   * @desc    Marquer une notification comme lue
   * @access  Private
   */
  static markAsRead = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvee'
      });
    }

    if (!isAdmin && notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acces non autorise'
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status: 'READ',
        readAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Notification marquee comme lue',
      data: updated
    });
  });

  /**
   * @route   PUT /api/notifications/read-all
   * @desc    Marquer toutes les notifications comme lues
   * @access  Private
   */
  static markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);
    const { userId: queryUserId, all } = req.query;

    const where: Prisma.NotificationWhereInput = {
      status: 'UNREAD'
    };

    if (isAdmin) {
      if (queryUserId) {
        where.userId = String(queryUserId);
      } else if (!parseBoolean(all)) {
        where.userId = userId;
      }
    } else {
      where.userId = userId;
    }

    const result = await prisma.notification.updateMany({
      where,
      data: {
        status: 'READ',
        readAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Notifications mises a jour',
      data: { count: result.count }
    });
  });
}
