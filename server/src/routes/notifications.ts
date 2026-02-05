import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/notifications
 * @desc    Obtenir toutes les notifications de l'utilisateur connecté
 * @access  Private
 */
router.get('/', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Notifications - Route à implémenter',
    data: []
  });
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Marquer une notification comme lue
 * @access  Private
 */
router.put('/:id/read', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Marquer comme lue - Route à implémenter',
    data: {}
  });
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Marquer toutes les notifications comme lues
 * @access  Private
 */
router.put('/read-all', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Marquer tout comme lu - Route à implémenter',
    data: {}
  });
});

export default router; 