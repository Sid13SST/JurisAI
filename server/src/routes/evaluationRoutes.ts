import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getResults,
  evaluateClauses,
  evaluateRisks,
  evaluateSummary,
  evaluateMarket,
  evaluateComparison,
  logHumanEvaluation
} from '../controllers/evaluationController';
import { generatePdfReport } from '../controllers/reportController'; // We will create this controller next

const router = Router();

// Apply auth middleware to all evaluation endpoints
router.use(authenticateToken);

router.get('/results', getResults);
router.post('/clauses', evaluateClauses);
router.post('/risks', evaluateRisks);
router.post('/summary', evaluateSummary);
router.post('/market', evaluateMarket);
router.post('/comparison', evaluateComparison);
router.post('/human', logHumanEvaluation);
router.post('/generate-report', generatePdfReport);

export default router;
