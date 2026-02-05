import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenanceController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate, maintenanceRequestSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/maintenance
 * @desc    Obtenir les demandes de maintenance
 * @access  Private
 */
router.get('/', authenticateToken, MaintenanceController.getMaintenanceRequests);

/**
 * @route   GET /api/maintenance/:id
 * @desc    Obtenir une demande de maintenance par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, MaintenanceController.getMaintenanceById);

/**
 * @route   POST /api/maintenance
 * @desc    Créer une demande de maintenance
 * @access  Private
 */
router.post('/', authenticateToken, validate(maintenanceRequestSchemas.create), MaintenanceController.createMaintenanceRequest);

/**
 * @route   PUT /api/maintenance/:id
 * @desc    Mettre à jour une demande de maintenance
 * @access  Private
 */
router.put('/:id', authenticateToken, validate(maintenanceRequestSchemas.update), MaintenanceController.updateMaintenanceRequest);

/**
 * @route   DELETE /api/maintenance/:id
 * @desc    Supprimer une demande de maintenance
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, MaintenanceController.deleteMaintenanceRequest);

export default router;
