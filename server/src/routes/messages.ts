import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';
import { validate, messageSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/messages
 * @desc    Obtenir les messages de l'utilisateur
 * @access  Private
 */
router.get('/', authenticateToken, MessageController.getMessages);

/**
 * @route   GET /api/messages/:id
 * @desc    Obtenir un message par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, MessageController.getMessageById);

/**
 * @route   POST /api/messages
 * @desc    Envoyer un message
 * @access  Private
 */
router.post('/', authenticateToken, validate(messageSchemas.create), MessageController.createMessage);

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Marquer un message comme lu
 * @access  Private
 */
router.put('/:id/read', authenticateToken, MessageController.markAsRead);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Supprimer un message
 * @access  Private
 */
router.delete('/:id', authenticateToken, MessageController.deleteMessage);

export default router;
