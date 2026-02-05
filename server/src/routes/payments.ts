import { Router } from 'express';

const router = Router();

// TODO: Implement payment routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payments endpoint - Coming soon'
  });
});

export default router; 