import { Prisma, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import prisma from '../lib/prisma';

const messageInclude = {
  sender: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  },
  recipient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  }
};

const isAdminUser = (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN;

export class MessageController {
  /**
   * @route   GET /api/messages
   * @desc    Obtenir les messages de l'utilisateur
   * @access  Private
   */
  static getMessages = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { page = 1, limit = 10, box = 'inbox', read } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.MessageWhereInput = {};

    if (box === 'sent') {
      where.senderId = userId;
    } else if (box === 'all') {
      where.OR = [{ senderId: userId }, { recipientId: userId }];
    } else {
      where.recipientId = userId;
    }

    if (read !== undefined) {
      const readValue = String(read).toLowerCase() === 'true';
      where.read = readValue;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: messageInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.message.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   GET /api/messages/:id
   * @desc    Obtenir un message par ID
   * @access  Private
   */
  static getMessageById = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const message = await prisma.message.findUnique({
      where: { id },
      include: messageInclude
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    const hasAccess = message.senderId === userId || message.recipientId === userId;

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    return res.json({
      success: true,
      data: message
    });
  });

  /**
   * @route   POST /api/messages
   * @desc    Envoyer un message
   * @access  Private
   */
  static createMessage = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const senderId = req.user!.id;
    const { recipientId, subject, content } = req.body;

    const recipient = await prisma.user.findUnique({
      where: { id: String(recipientId) },
      select: { id: true }
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Destinataire non trouvé'
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId,
        subject,
        content
      },
      include: messageInclude
    });

    return res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: message
    });
  });

  /**
   * @route   PUT /api/messages/:id/read
   * @desc    Marquer un message comme lu
   * @access  Private
   */
  static markAsRead = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const message = await prisma.message.findUnique({
      where: { id },
      select: { id: true, recipientId: true }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    if (!isAdmin && message.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date()
      },
      include: messageInclude
    });

    return res.json({
      success: true,
      message: 'Message marqué comme lu',
      data: updatedMessage
    });
  });

  /**
   * @route   DELETE /api/messages/:id
   * @desc    Supprimer un message
   * @access  Private
   */
  static deleteMessage = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = isAdminUser(req);

    const message = await prisma.message.findUnique({
      where: { id },
      select: { id: true, senderId: true, recipientId: true }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    const hasAccess = message.senderId === userId || message.recipientId === userId;

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    await prisma.message.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Message supprimé avec succès'
    });
  });
}
