import { Router } from 'express';

const router = Router();

// TODO: Implement review routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Reviews endpoint - Coming soon'
  });
});

export default router; 