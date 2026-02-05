import { Router } from 'express';
import { PropertyController } from '../controllers/propertyController';
import { authenticateToken, requireOwner, requireManagerOrAdmin } from '../middleware/auth';
import { validate, propertySchemas } from '../middleware/validation';
import { upload } from '../middleware/upload';

const router = Router();

/**
 * @route   GET /api/properties
 * @desc    Obtenir toutes les propriétés avec filtres
 * @access  Public
 */
router.get('/', PropertyController.getAllProperties);

/**
 * @route   GET /api/properties/search
 * @desc    Rechercher des propriétés
 * @access  Public
 */
router.get('/search', PropertyController.searchProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Obtenir une propriété par ID
 * @access  Public
 */
router.get('/:id', PropertyController.getPropertyById);

/**
 * @route   POST /api/properties
 * @desc    Créer une nouvelle propriété
 * @access  Private (Owner)
 */
router.post('/', 
  authenticateToken, 
  requireOwner, 
  upload.array('images', 10), 
  validate(propertySchemas.create), 
  PropertyController.createProperty
);

/**
 * @route   PUT /api/properties/:id
 * @desc    Mettre à jour une propriété
 * @access  Private (Owner)
 */
router.put('/:id', 
  authenticateToken, 
  requireOwner, 
  validate(propertySchemas.update), 
  PropertyController.updateProperty
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Supprimer une propriété
 * @access  Private (Owner)
 */
router.delete('/:id', 
  authenticateToken, 
  requireOwner, 
  PropertyController.deleteProperty
);

/**
 * @route   POST /api/properties/:id/images
 * @desc    Ajouter des images à une propriété
 * @access  Private (Owner)
 */
router.post('/:id/images', 
  authenticateToken, 
  requireOwner, 
  upload.array('images', 10), 
  PropertyController.addImages
);

/**
 * @route   DELETE /api/properties/:id/images/:imageIndex
 * @desc    Supprimer une image d'une propriété
 * @access  Private (Owner)
 */
router.delete('/:id/images/:imageIndex', 
  authenticateToken, 
  requireOwner, 
  PropertyController.removeImage
);

/**
 * @route   PUT /api/properties/:id/publish
 * @desc    Publier une propriété
 * @access  Private (Owner)
 */
router.put('/:id/publish', 
  authenticateToken, 
  requireOwner, 
  PropertyController.publishProperty
);

/**
 * @route   PUT /api/properties/:id/unpublish
 * @desc    Dépublier une propriété
 * @access  Private (Owner)
 */
router.put('/:id/unpublish', 
  authenticateToken, 
  requireOwner, 
  PropertyController.unpublishProperty
);

/**
 * @route   GET /api/properties/owner/my-properties
 * @desc    Obtenir les propriétés de l'utilisateur connecté
 * @access  Private (Owner)
 */
router.get('/owner/my-properties', 
  authenticateToken, 
  requireOwner, 
  PropertyController.getMyProperties
);

/**
 * @route   GET /api/properties/manager/available
 * @desc    Obtenir les propriétés disponibles pour les gestionnaires
 * @access  Private (Manager)
 */
router.get('/manager/available', 
  authenticateToken, 
  requireManagerOrAdmin, 
  PropertyController.getAvailableProperties
);

export default router; 
