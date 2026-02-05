import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';
import { authenticateToken } from '../middleware/auth';
import { validate, documentSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/documents
 * @desc    Obtenir les documents accessibles
 * @access  Private
 */
router.get('/', authenticateToken, DocumentController.getDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Obtenir un document par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, DocumentController.getDocumentById);

/**
 * @route   POST /api/documents
 * @desc    Créer un document
 * @access  Private
 */
router.post('/', authenticateToken, validate(documentSchemas.create), DocumentController.createDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Supprimer un document
 * @access  Private
 */
router.delete('/:id', authenticateToken, DocumentController.deleteDocument);

export default router;
