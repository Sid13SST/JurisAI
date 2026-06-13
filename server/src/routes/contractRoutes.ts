import { Router } from 'express';
import { uploadContract, downloadContract, deleteContract } from '../controllers/contractController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/upload', authenticateToken as any, uploadContract as any);
router.get('/download/:id', downloadContract as any);
router.delete('/:id', authenticateToken as any, deleteContract as any);

export default router;
