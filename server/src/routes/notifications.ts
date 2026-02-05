import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate, notificationSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/notifications
 * @desc    Obtenir toutes les notifications de l'utilisateur connecté
 * @access  Private
 */
router.get('/', authenticateToken, NotificationController.getMyNotifications);

/**
 * @route   POST /api/notifications
 * @desc    Créer une notification
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(notificationSchemas.create),
  NotificationController.createNotification
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Marquer une notification comme lue
 * @access  Private
 */
router.put('/:id/read', authenticateToken, NotificationController.markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Marquer toutes les notifications comme lues
 * @access  Private
 */
router.put('/read-all', authenticateToken, NotificationController.markAllAsRead);

export default router; 
