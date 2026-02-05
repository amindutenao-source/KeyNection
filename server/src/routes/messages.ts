import { Router } from 'express';

const router = Router();

// TODO: Implement message routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Messages endpoint - Coming soon'
  });
});

export default router; 