import { Router } from 'express';
import {
  generateSummary,
  getSummaries,
  regenerateSummary,
  generateReport,
  listReports,
  downloadReport
} from '../controllers/summaryController';

const router = Router();

// Summary generation
router.post('/summary/generate', generateSummary);
router.post('/summary/regenerate', regenerateSummary);
router.get('/summary/:contractId', getSummaries);

// Report generation
router.post('/report/generate', generateReport);
router.get('/report/list/:contractId', listReports);
router.get('/report/download/:reportId', downloadReport);

export default router;
