import { Router } from 'express';
import { CopilotController } from '../controllers/copilot.controller';

const router = Router();

// Apply auth middleware if you only want logged-in users to access the copilot
// For testing without auth, you can temporarily remove this or bypass it.
// router.use(requireAuth);

router.post('/compliance/analyze', CopilotController.analyzeCompliance);
router.post('/compliance/report', CopilotController.generateComplianceReport);
router.post('/negotiation/suggestions', CopilotController.generateNegotiationSuggestions);
router.post('/negotiation/clause-rewrite', CopilotController.generateClauseRewrite);
router.post('/legal-insights', CopilotController.getLegalInsights);
router.post('/readiness/score', CopilotController.calculateReadinessScore);

export default router;
