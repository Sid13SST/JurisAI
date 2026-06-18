import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { 
  getFirestoreDoc, 
  updateFirestoreDoc, 
  queryFirestoreCollection, 
  writeFirestoreDoc, 
  deleteFirestoreDoc 
} from '../utils/firestoreRest';
import { analyzeClauseRisks, ClauseForAnalysis } from '../services/aiService';

// Path to market standards configuration (with fallback for built production runs where tsc doesn't copy JSON files)
const BASELINES_FILE_PATH = (() => {
  const primaryPath = path.join(__dirname, '..', 'data', 'marketBaselines.json');
  if (fs.existsSync(primaryPath)) {
    return primaryPath;
  }
  return path.join(__dirname, '..', '..', 'src', 'data', 'marketBaselines.json');
})();

/**
 * Decodes a Firebase ID Token manually (without network call) to extract the user's UID
 */
function getUidFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload.user_id || payload.sub || null;
  } catch (err) {
    console.error('Error decoding ID token:', err);
    return null;
  }
}

/**
 * Load baselines from JSON configuration file
 */
function loadMarketBaselines(): any {
  try {
    if (!fs.existsSync(BASELINES_FILE_PATH)) {
      throw new Error(`Market baselines file not found at: ${BASELINES_FILE_PATH}`);
    }
    const rawData = fs.readFileSync(BASELINES_FILE_PATH, 'utf8');
    return JSON.parse(rawData);
  } catch (err: any) {
    console.error('Error loading market baselines:', err);
    throw new Error(`Failed to load market standards baselines: ${err.message}`);
  }
}

/**
 * Endpoint: POST /api/ai/analyze-risk
 * Runs risk analysis and market standard comparison on all extracted clauses of a contract
 */
export const analyzeContractRisk = async (req: Request, res: Response): Promise<void> => {
  const { contractId } = req.body;
  const uid = getUidFromRequest(req);
  const authHeader = req.headers.authorization;
  const idToken = authHeader ? authHeader.split(' ')[1] : '';

  if (!contractId) {
    res.status(400).json({ error: 'Missing contractId parameter.' });
    return;
  }

  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated (missing or invalid Bearer token).' });
    return;
  }

  try {
    // 1. Fetch contract record and verify ownership
    const contract = await getFirestoreDoc('contracts', contractId, idToken);
    if (!contract) {
      res.status(404).json({ error: 'Contract record not found in Firestore.' });
      return;
    }

    if (contract.userId !== uid) {
      res.status(403).json({ error: 'Access denied. You do not own this contract.' });
      return;
    }

    // Set status to analyzing in contract
    await updateFirestoreDoc(
      'contracts', 
      contractId, 
      { riskAnalysisStatus: 'analyzing' }, 
      ['riskAnalysisStatus'], 
      idToken
    );

    // 2. Fetch all extracted clauses for this contract
    const clauses = await queryFirestoreCollection('clauses', 'contractId', contractId, idToken, { field: 'userId', value: uid });
    if (!clauses || clauses.length === 0) {
      // Revert status
      await updateFirestoreDoc(
        'contracts', 
        contractId, 
        { riskAnalysisStatus: 'idle' }, 
        ['riskAnalysisStatus'], 
        idToken
      );
      res.status(400).json({ error: 'No extracted clauses found for this contract. Run Clause Extraction first.' });
      return;
    }

    // Format clauses for risk analysis
    const clausesForAnalysis: ClauseForAnalysis[] = clauses.map(c => ({
      clauseId: c.clauseId,
      clauseType: c.clauseType,
      sectionNumber: c.sectionNumber || '',
      sectionTitle: c.sectionTitle || 'Section',
      summary: c.summary || '',
      fullText: c.fullText || ''
    }));

    // 3. Retrieve missing expected clauses stored during extraction
    const missingClauses: string[] = contract.missingClauses || [];

    // 4. Load market standard baseline guidelines
    const marketBaselines = loadMarketBaselines();

    // 5. Send to Gemini for Risk Analysis
    const analysisResult = await analyzeClauseRisks(clausesForAnalysis, missingClauses, marketBaselines);

    // 6. Delete existing clauseRisk documents for this contract to prevent stale records
    const existingClauseRisks = await queryFirestoreCollection('clauseRisk', 'contractId', contractId, idToken, { field: 'userId', value: uid });
    if (existingClauseRisks && existingClauseRisks.length > 0) {
      const deletePromises = existingClauseRisks.map(r => 
        deleteFirestoreDoc('clauseRisk', r.clauseId, idToken)
      );
      await Promise.all(deletePromises);
    }

    // 7. Write new clauseRisk documents to Firestore
    const writeClauseRiskPromises = analysisResult.clauses.map(cRisk => {
      const clauseDocData = {
        clauseId: cRisk.clauseId,
        contractId,
        userId: uid,
        clauseType: cRisk.clauseType,
        riskScore: cRisk.riskScore,
        riskCategory: cRisk.riskCategory,
        riskLevel: cRisk.riskLevel,
        reasoning: cRisk.reasoning,
        whyFlagged: cRisk.whyFlagged,
        potentialImpact: cRisk.potentialImpact,
        recommendedAction: cRisk.recommendedAction,
        priority: cRisk.priority,
        marketComparison: cRisk.marketComparison,
        createdAt: new Date().toISOString()
      };
      return writeFirestoreDoc('clauseRisk', cRisk.clauseId, clauseDocData, idToken);
    });
    await Promise.all(writeClauseRiskPromises);

    // 8. Write overall riskAnalysis record
    const riskAnalysisDocData = {
      analysisId: contractId,
      contractId,
      userId: uid,
      overallRiskScore: analysisResult.overallRiskScore,
      riskLevel: analysisResult.riskLevel,
      topIssues: analysisResult.topIssues,
      riskBreakdown: analysisResult.riskBreakdown,
      createdAt: new Date().toISOString()
    };
    await writeFirestoreDoc('riskAnalysis', contractId, riskAnalysisDocData, idToken);

    // 9. Update Contract status and overall score
    const contractUpdate = {
      overallRiskScore: analysisResult.overallRiskScore,
      riskLevel: analysisResult.riskLevel,
      riskAnalysisStatus: 'completed'
    };
    await updateFirestoreDoc(
      'contracts',
      contractId,
      contractUpdate,
      ['overallRiskScore', 'riskLevel', 'riskAnalysisStatus'],
      idToken
    );

    res.status(200).json({
      message: 'Risk analysis successfully completed.',
      overallRiskScore: analysisResult.overallRiskScore,
      riskLevel: analysisResult.riskLevel,
      topIssues: analysisResult.topIssues,
      riskBreakdown: analysisResult.riskBreakdown
    });

  } catch (err: any) {
    console.error('Risk analysis pipeline failure:', err);
    // Mark as failed in contract status
    try {
      await updateFirestoreDoc(
        'contracts', 
        contractId, 
        { riskAnalysisStatus: 'failed' }, 
        ['riskAnalysisStatus'], 
        idToken
      );
    } catch (_) {}
    res.status(500).json({ error: `Risk analysis failed: ${err.message}` });
  }
};
