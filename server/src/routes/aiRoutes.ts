import { Router } from 'express';
import { chunkContract, analyzeChunk, finalizeAnalysis } from '../controllers/aiController';

const router = Router();

router.post('/chunk', chunkContract);
router.post('/analyze-chunk', analyzeChunk);
router.post('/finalize-analysis', finalizeAnalysis);

export default router;
