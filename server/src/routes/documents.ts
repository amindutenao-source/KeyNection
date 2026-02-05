import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';
import { authenticateToken, requireOwnerOrManager } from '../middleware/auth';
import { validate, documentSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/documents
 * @desc    Obtenir les documents accessibles
 * @access  Private
 */
router.get('/', authenticateToken, requireOwnerOrManager, DocumentController.getDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Obtenir un document par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, requireOwnerOrManager, DocumentController.getDocumentById);

/**
 * @route   POST /api/documents
 * @desc    Créer un document
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  requireOwnerOrManager,
  validate(documentSchemas.create),
  DocumentController.createDocument
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Supprimer un document
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateToken,
  requireOwnerOrManager,
  DocumentController.deleteDocument
);

export default router;
