import { Router } from 'express';

const router = Router();

// TODO: Implement document routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Documents endpoint - Coming soon'
  });
});

export default router; 