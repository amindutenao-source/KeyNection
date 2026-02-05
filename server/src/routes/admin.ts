import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/admin/overview
 * @desc    Obtenir la vue d'ensemble admin
 * @access  Private (Admin)
 */
router.get('/overview', authenticateToken, requireAdmin, AdminController.getOverview);

/**
 * @route   GET /api/admin/audits
 * @desc    Obtenir les événements d'audit récents
 * @access  Private (Admin)
 */
router.get('/audits', authenticateToken, requireAdmin, AdminController.getAudits);

export default router;
