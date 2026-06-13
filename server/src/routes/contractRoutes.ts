import { Router } from 'express';
import { parseContract, deleteContract } from '../controllers/contractController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all endpoints
router.post('/parse', authenticateToken as any, parseContract as any);
router.delete('/:id', authenticateToken as any, deleteContract as any);

export default router;
