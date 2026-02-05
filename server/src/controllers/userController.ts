import { Prisma, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import prisma from '../lib/prisma';

const isAdminUser = (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN;

export class UserController {
  /**
   * @route   GET /api/users
   * @desc    Obtenir tous les utilisateurs
   * @access  Private (Admin)
   */
  static getUsers = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page = 1, limit = 20, role, status, search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role as any;
    if (status) where.status = status as any;
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              ownedProperties: true,
              managedProperties: true,
              applications: true,
              ownedContracts: true,
              managedContracts: true,
              tenantContracts: true,
              payments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });

  /**
   * @route   GET /api/users/:id
   * @desc    Obtenir un utilisateur par ID
   * @access  Private
   */
  static getUserById = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const requesterId = req.user!.id;
    const isAdmin = isAdminUser(req);

    if (!isAdmin && requesterId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        bio: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        dateOfBirth: true,
        identificationNumber: true,
        taxId: true,
        bankAccount: true,
        emergencyContact: true,
        emergencyPhone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    return res.json({
      success: true,
      data: user
    });
  });

  /**
   * @route   PUT /api/users/:id
   * @desc    Mettre à jour un utilisateur
   * @access  Private
   */
  static updateUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const requesterId = req.user!.id;
    const isAdmin = isAdminUser(req);

    if (!isAdmin && requesterId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const data: Prisma.UserUpdateInput = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      avatar: req.body.avatar,
      bio: req.body.bio,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      country: req.body.country,
      dateOfBirth: req.body.dateOfBirth,
      identificationNumber: req.body.identificationNumber,
      taxId: req.body.taxId,
      bankAccount: req.body.bankAccount,
      emergencyContact: req.body.emergencyContact,
      emergencyPhone: req.body.emergencyPhone
    };

    if (isAdmin) {
      if (req.body.role) data.role = req.body.role;
      if (req.body.status) data.status = req.body.status;
      if (req.body.emailVerified !== undefined) data.emailVerified = req.body.emailVerified;
      if (req.body.phoneVerified !== undefined) data.phoneVerified = req.body.phoneVerified;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        bio: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        dateOfBirth: true,
        identificationNumber: true,
        taxId: true,
        bankAccount: true,
        emergencyContact: true,
        emergencyPhone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: user
    });
  });

  /**
   * @route   DELETE /api/users/:id
   * @desc    Supprimer un utilisateur
   * @access  Private (Admin)
   */
  static deleteUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  });
}
