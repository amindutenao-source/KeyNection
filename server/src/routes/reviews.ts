import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { authenticateToken, requireOwnerOrManager } from '../middleware/auth';
import { validate, reviewSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/reviews
 * @desc    Obtenir les avis
 * @access  Public
 */
router.get('/', ReviewController.getReviews);

/**
 * @route   GET /api/reviews/:id
 * @desc    Obtenir un avis par ID
 * @access  Public
 */
router.get('/:id', ReviewController.getReviewById);

/**
 * @route   POST /api/reviews
 * @desc    Créer un avis
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  requireOwnerOrManager,
  validate(reviewSchemas.create),
  ReviewController.createReview
);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Mettre à jour un avis
 * @access  Private
 */
router.put(
  '/:id',
  authenticateToken,
  requireOwnerOrManager,
  validate(reviewSchemas.update),
  ReviewController.updateReview
);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Supprimer un avis
 * @access  Private
 */
router.delete('/:id', authenticateToken, requireOwnerOrManager, ReviewController.deleteReview);

export default router;
