import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';
import { validate, paymentSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/payments
 * @desc    Obtenir les paiements accessibles
 * @access  Private
 */
router.get('/', authenticateToken, PaymentController.getPayments);

/**
 * @route   GET /api/payments/:id
 * @desc    Obtenir un paiement par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, PaymentController.getPaymentById);

/**
 * @route   POST /api/payments
 * @desc    Créer un paiement
 * @access  Private
 */
router.post('/', authenticateToken, validate(paymentSchemas.create), PaymentController.createPayment);

/**
 * @route   PUT /api/payments/:id
 * @desc    Mettre à jour un paiement
 * @access  Private
 */
router.put('/:id', authenticateToken, validate(paymentSchemas.update), PaymentController.updatePayment);

export default router;
