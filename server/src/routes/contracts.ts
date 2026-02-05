import { Router } from 'express';
import { authenticateToken, requireOwner } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/contracts
 * @desc    Obtenir tous les contrats de l'utilisateur connecté
 * @access  Private
 */
router.get('/', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Contrats - Route à implémenter',
    data: []
  });
});

/**
 * @route   GET /api/contracts/:id
 * @desc    Obtenir un contrat par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Contrat détail - Route à implémenter',
    data: {}
  });
});

/**
 * @route   POST /api/contracts
 * @desc    Créer un nouveau contrat
 * @access  Private (Owner)
 */
router.post('/', authenticateToken, requireOwner, (req, res) => {
  res.json({
    success: true,
    message: 'Créer contrat - Route à implémenter',
    data: {}
  });
});

/**
 * @route   PUT /api/contracts/:id/sign
 * @desc    Signer un contrat
 * @access  Private
 */
router.put('/:id/sign', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Signer contrat - Route à implémenter',
    data: {}
  });
});

export default router; 
