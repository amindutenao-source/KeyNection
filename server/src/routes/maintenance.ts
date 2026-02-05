import { Router } from 'express';

const router = Router();

// TODO: Implement maintenance routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Maintenance endpoint - Coming soon'
  });
});

export default router; 