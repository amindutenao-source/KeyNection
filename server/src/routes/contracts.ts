import { Router } from 'express';
import { ContractController } from '../controllers/contractController';
import { authenticateToken, requireOwnerOrAdmin } from '../middleware/auth';
import { validate, contractSchemas } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/contracts
 * @desc    Obtenir tous les contrats de l'utilisateur connecte
 * @access  Private
 */
router.get('/', authenticateToken, ContractController.getMyContracts);

/**
 * @route   GET /api/contracts/:id
 * @desc    Obtenir un contrat par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, ContractController.getContractById);

/**
 * @route   POST /api/contracts
 * @desc    Creer un nouveau contrat
 * @access  Private (Owner/Admin)
 */
router.post(
  '/',
  authenticateToken,
  requireOwnerOrAdmin,
  validate(contractSchemas.create),
  ContractController.createContract
);

/**
 * @route   PUT /api/contracts/:id
 * @desc    Mettre a jour un contrat
 * @access  Private (Owner/Admin)
 */
router.put(
  '/:id',
  authenticateToken,
  requireOwnerOrAdmin,
  validate(contractSchemas.update),
  ContractController.updateContract
);

/**
 * @route   PUT /api/contracts/:id/sign
 * @desc    Signer un contrat
 * @access  Private
 */
router.put('/:id/sign', authenticateToken, ContractController.signContract);

export default router;
