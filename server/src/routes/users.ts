import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate, userSchemas } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();

const validateUserUpdate = (req: AuthenticatedRequest, res: any, next: any) => {
  if (req.user?.role === 'ADMIN') {
    return validate(userSchemas.adminUpdate)(req, res, next);
  }
  return validate(userSchemas.update)(req, res, next);
};

/**
 * @route   GET /api/users
 * @desc    Obtenir tous les utilisateurs (admin uniquement)
 * @access  Private (Admin)
 */
router.get('/', authenticateToken, requireAdmin, UserController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obtenir un utilisateur par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, UserController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private
 */
router.put('/:id', authenticateToken, validateUserUpdate, UserController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur (admin uniquement)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, UserController.deleteUser);

export default router;
