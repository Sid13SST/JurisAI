import { Router } from 'express';
import { analyzeContractRisk } from '../controllers/riskController';

const router = Router();

router.post('/analyze-risk', analyzeContractRisk);

export default router;
