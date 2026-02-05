import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Obtenir tous les utilisateurs (admin uniquement)
 * @access  Private (Admin)
 */
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Liste utilisateurs - Route à implémenter',
    data: []
  });
});

/**
 * @route   GET /api/users/:id
 * @desc    Obtenir un utilisateur par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Détail utilisateur - Route à implémenter',
    data: {}
  });
});

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private
 */
router.put('/:id', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Mettre à jour utilisateur - Route à implémenter',
    data: {}
  });
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur (admin uniquement)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Supprimer utilisateur - Route à implémenter',
    data: {}
  });
});

export default router; 