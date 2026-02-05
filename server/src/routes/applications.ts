import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { authenticateToken, requireOwner, requireManager } from '../middleware/auth';
import { validate, applicationSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/applications
 * @desc    Obtenir toutes les candidatures de l'utilisateur connecté
 * @access  Private
 */
router.get('/', authenticateToken, ApplicationController.getMyApplications);

/**
 * @route   GET /api/applications/property/:propertyId
 * @desc    Obtenir les candidatures pour une propriété (propriétaire uniquement)
 * @access  Private (Owner)
 */
router.get('/property/:propertyId', 
  authenticateToken, 
  requireOwner, 
  ApplicationController.getApplicationsForProperty
);

/**
 * @route   POST /api/applications
 * @desc    Créer une nouvelle candidature
 * @access  Private (Manager)
 */
router.post('/', 
  authenticateToken, 
  requireManager, 
  validate(applicationSchemas.create), 
  ApplicationController.createApplication
);

/**
 * @route   PUT /api/applications/:id
 * @desc    Mettre à jour le statut d'une candidature
 * @access  Private (Owner)
 */
router.put('/:id', 
  authenticateToken, 
  requireOwner, 
  validate(applicationSchemas.update), 
  ApplicationController.updateApplication
);

/**
 * @route   DELETE /api/applications/:id
 * @desc    Retirer une candidature
 * @access  Private (Manager)
 */
router.delete('/:id', 
  authenticateToken, 
  requireManager, 
  ApplicationController.withdrawApplication
);

/**
 * @route   GET /api/applications/:id
 * @desc    Obtenir une candidature par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, ApplicationController.getApplicationById);

export default router; 