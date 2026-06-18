import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  compareContracts,
  compareClauses,
  compareVersions,
  compareRisk,
  exportComparison,
  getComparisonHistory,
  getComparisonById
} from '../controllers/comparisonController';

const router = Router();

// Secure all comparison endpoints with authentication middleware
router.use(authenticateToken);

router.post('/contracts', compareContracts);
router.post('/clauses', compareClauses);
router.post('/versions', compareVersions);
router.post('/risk', compareRisk);
router.post('/export', exportComparison);
router.get('/history', getComparisonHistory);
router.get('/:comparisonId', getComparisonById);

export default router;
