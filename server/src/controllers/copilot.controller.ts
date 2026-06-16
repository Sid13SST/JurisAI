import { Request, Response } from 'express';
import { OpenRouterService } from '../services/openrouter.service';

export class CopilotController {
  
  /**
   * Evaluates whether a contract contains standard protections.
   * POST /api/compliance/analyze
   */
  static async analyzeCompliance(req: Request, res: Response) {
    try {
      const { contractType, contractText } = req.body;

      if (!contractType || !contractText) {
        return res.status(400).json({ error: 'Missing contractType or contractText' });
      }

      const systemPrompt = `
You are a Compliance Checker AI. Evaluate whether the provided contract text contains standard protections for a ${contractType}.
Check for presence and quality of standard clauses (e.g. Liability, Termination, Confidentiality, Force Majeure, Data Protection, IP Ownership).
Output MUST be strict JSON matching this schema:
{
  "complianceScore": <number 0-100>,
  "classification": <"Excellent" | "Good" | "Needs Review" | "Poor">,
  "presentProtections": [<string array>],
  "missingProtections": [<string array>],
  "weakProtections": [
    { "clause": <string>, "reason": <string> }
  ],
  "recommendedAdditions": [<string array>]
}`;

      const aiRes = await OpenRouterService.generateStructuredResponse<any>(systemPrompt, contractText);
      
      if (aiRes.error) {
        return res.status(500).json({ error: aiRes.error });
      }

      return res.status(200).json(aiRes.data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Generates negotiation suggestions for risky clauses.
   * POST /api/negotiation/suggestions
   */
  static async generateNegotiationSuggestions(req: Request, res: Response) {
    try {
      const { clauses } = req.body; // Array of risky clauses text

      if (!clauses || !Array.isArray(clauses)) {
        return res.status(400).json({ error: 'Missing clauses array' });
      }

      const systemPrompt = `
You are a Negotiation Assistant AI. Help the user understand which clauses should be negotiated and how.
For each risky clause provided, generate a recommendation.
Output MUST be strict JSON matching this schema:
{
  "suggestions": [
    {
      "currentClause": <string>,
      "riskExplanation": <string>,
      "recommendation": <string>,
      "suggestedRevision": <string>,
      "expectedRiskReduction": <string>,
      "priority": <"Critical" | "High" | "Medium" | "Low">
    }
  ]
}`;

      const userPrompt = JSON.stringify({ clauses });
      const aiRes = await OpenRouterService.generateStructuredResponse<any>(systemPrompt, userPrompt);
      
      if (aiRes.error) {
        return res.status(500).json({ error: aiRes.error });
      }

      return res.status(200).json(aiRes.data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Generates draft clauses for missing protections.
   * POST /api/negotiation/clause-rewrite
   * Reusing this for Missing Clause Generator as well based on prompt structure.
   */
  static async generateClauseRewrite(req: Request, res: Response) {
    try {
      const { missingClauseName, context } = req.body;

      if (!missingClauseName) {
        return res.status(400).json({ error: 'Missing missingClauseName' });
      }

      const systemPrompt = `
You are a Missing Clause Generator AI. Generate a draft clause for the missing protection requested.
Use professional legal language. The generated text should be ready to be reviewed by a human lawyer.
Context of the agreement may be provided.
Output MUST be strict JSON matching this schema:
{
  "suggestedClauseName": <string>,
  "draftLanguage": <string>,
  "label": "Draft Language - Legal Review Recommended"
}`;

      const userPrompt = `Missing Clause: ${missingClauseName}\nContext: ${context || 'None'}`;
      const aiRes = await OpenRouterService.generateStructuredResponse<any>(systemPrompt, userPrompt);

      if (aiRes.error) {
        return res.status(500).json({ error: aiRes.error });
      }

      return res.status(200).json(aiRes.data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Provides intelligent observations.
   * POST /api/legal-insights
   */
  static async getLegalInsights(req: Request, res: Response) {
    try {
      const { contractText } = req.body;

      if (!contractText) {
        return res.status(400).json({ error: 'Missing contractText' });
      }

      const systemPrompt = `
You are a Legal Insights Engine AI. Provide intelligent observations on the contract text provided.
Output MUST be strict JSON matching this schema:
{
  "mostRiskyClause": { "clause": <string>, "reason": <string> },
  "mostUnusualClause": { "clause": <string>, "reason": <string> },
  "mostNegotiableClause": { "clause": <string>, "reason": <string> },
  "mostFavorableClause": { "clause": <string>, "reason": <string> },
  "mostProblematicSection": { "section": <string>, "reason": <string> }
}`;

      const aiRes = await OpenRouterService.generateStructuredResponse<any>(systemPrompt, contractText);

      if (aiRes.error) {
        return res.status(500).json({ error: aiRes.error });
      }

      return res.status(200).json(aiRes.data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Determines whether contract appears ready for signing.
   * POST /api/readiness/score
   */
  static async calculateReadinessScore(req: Request, res: Response) {
    try {
      const { complianceScore, riskScore, missingClausesCount, contractText } = req.body;

      const systemPrompt = `
You are a Contract Readiness AI. Determine whether the contract appears ready for signing.
You will be given the compliance score, risk score, missing clauses count, and optionally some contract text context.
Generate Top 10 Recommendations prioritizing by impact.
Output MUST be strict JSON matching this schema:
{
  "readinessScore": <number 0-100>,
  "classification": <"Ready to Sign" | "Needs Minor Review" | "Needs Legal Review" | "High Concern">,
  "topRecommendations": [<string array, max 10>]
}`;

      const userPrompt = JSON.stringify({ complianceScore, riskScore, missingClausesCount });
      const aiRes = await OpenRouterService.generateStructuredResponse<any>(systemPrompt, userPrompt);

      if (aiRes.error) {
        return res.status(500).json({ error: aiRes.error });
      }

      return res.status(200).json(aiRes.data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  /**
   * Placeholder for compliance report generation if needed by backend (usually can just return data for frontend to render PDF)
   * POST /api/compliance/report
   */
  static async generateComplianceReport(req: Request, res: Response) {
    // In a full implementation, this might use pdf-lib to generate a binary PDF and return it.
    // For now, returning success so frontend can generate it.
    res.status(200).json({ message: 'Use frontend to generate PDF from compliance data.' });
  }

}
