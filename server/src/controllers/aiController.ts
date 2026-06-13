import { Request, Response } from 'express';
import { chunkContractSections } from '../services/chunkingService';
import { analyzeTextChunk, ExtractedClauseRaw } from '../services/aiService';
import { writeFirestoreDoc, updateFirestoreDoc, getFirestoreDoc } from '../utils/firestoreRest';

// Supported clause types for missing clause detection
const REQUIRED_CLAUSE_TYPES = [
  'Indemnity',
  'Limitation of Liability',
  'Governing Law',
  'Termination',
  'Confidentiality',
  'Intellectual Property',
  'Payment Terms',
  'Force Majeure',
  'Dispute Resolution',
  'Data Protection',
  'Non-Compete',
  'Assignment',
  'Warranty',
  'Audit Rights',
  'Insurance'
];

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
 * Endpoint: POST /api/ai/chunk
 * Groups parsed sections of a contract into size-optimized chunks
 */
export const chunkContract = async (req: Request, res: Response): Promise<void> => {
  const { structuredText } = req.body;

  if (!structuredText || !Array.isArray(structuredText)) {
    res.status(400).json({ error: 'Missing or invalid structuredText array.' });
    return;
  }

  try {
    const chunks = chunkContractSections(structuredText);
    res.status(200).json({ chunks });
  } catch (err: any) {
    console.error('Error in chunkContract:', err);
    res.status(500).json({ error: err.message || 'Chunking failed.' });
  }
};

/**
 * Endpoint: POST /api/ai/analyze-chunk
 * Passes a specific text chunk to OpenRouter to analyze and extract clauses
 */
export const analyzeChunk = async (req: Request, res: Response): Promise<void> => {
  const { chunkText, chunkInfo } = req.body;

  if (!chunkText) {
    res.status(400).json({ error: 'Missing chunkText parameter.' });
    return;
  }

  try {
    const clauses = await analyzeTextChunk(chunkText, chunkInfo || 'Section Chunk');
    res.status(200).json({ clauses });
  } catch (err: any) {
    console.error('Error in analyzeChunk:', err);
    res.status(500).json({ error: err.message || 'AI analysis on chunk failed.' });
  }
};

/**
 * Endpoint: POST /api/ai/finalize-analysis
 * Aggregates all extracted clauses, deduplicates overlapping findings, normalizes,
 * computes missing clauses, writes individual clauses to Firestore, and updates the contract status.
 */
export const finalizeAnalysis = async (req: Request, res: Response): Promise<void> => {
  const { contractId, clauses } = req.body;
  const uid = getUidFromRequest(req);
  const authHeader = req.headers.authorization;
  const idToken = authHeader ? authHeader.split(' ')[1] : '';

  if (!contractId || !clauses || !Array.isArray(clauses)) {
    res.status(400).json({ error: 'Missing contractId or clauses array.' });
    return;
  }

  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated (missing or invalid Bearer token).' });
    return;
  }

  try {
    // 1. Fetch contract record from Firestore (authenticating via ID Token)
    const contract = await getFirestoreDoc('contracts', contractId, idToken);
    if (!contract) {
      res.status(404).json({ error: 'Contract record not found in Firestore.' });
      return;
    }

    if (contract.userId !== uid) {
      res.status(403).json({ error: 'Access denied. You do not own this contract.' });
      return;
    }

    // Update contract status to analyzing
    await updateFirestoreDoc('contracts', contractId, { status: 'analyzing', analysisStatus: 'analyzing' }, ['status', 'analysisStatus'], idToken);

    // 2. Deduplicate clauses by normalizing text (ignoring case, spaces, and linebreaks)
    const uniqueClauses: ExtractedClauseRaw[] = [];
    const seenTexts = new Set<string>();

    for (const c of clauses) {
      const normText = c.text.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!normText) continue;
      if (!seenTexts.has(normText)) {
        seenTexts.add(normText);
        uniqueClauses.push(c);
      }
    }

    // 3. Compute missing expected clauses
    const detectedTypes = new Set(uniqueClauses.map(c => c.clauseType));
    const missingClauses = REQUIRED_CLAUSE_TYPES.filter(type => !detectedTypes.has(type));

    // 4. Save each unique clause to Firestore 'clauses' collection
    const savePromises = uniqueClauses.map(async (c) => {
      const clauseId = `${contractId}-${Math.random().toString(36).substring(2, 11)}`;
      const clauseDocData = {
        clauseId,
        contractId,
        userId: uid,
        clauseType: c.clauseType,
        sectionNumber: c.sectionNumber || '',
        sectionTitle: c.title || 'Section',
        confidence: c.confidence,
        summary: c.summary || '',
        keywords: c.keywords || [],
        fullText: c.text,
        createdAt: new Date().toISOString()
      };
      await writeFirestoreDoc('clauses', clauseId, clauseDocData, idToken);
    });

    await Promise.all(savePromises);

    // 5. Update Contract with final metadata (using PATCH merge)
    const totalConfidence = uniqueClauses.reduce((sum, c) => sum + c.confidence, 0);
    const averageConfidence = uniqueClauses.length > 0 ? Math.round(totalConfidence / uniqueClauses.length) : 100;

    const contractUpdate = {
      status: 'parsed',
      analysisStatus: 'completed',
      missingClauses,
      averageConfidence,
      clauseCount: uniqueClauses.length
    };

    await updateFirestoreDoc(
      'contracts',
      contractId,
      contractUpdate,
      ['status', 'analysisStatus', 'missingClauses', 'averageConfidence', 'clauseCount'],
      idToken
    );

    res.status(200).json({
      message: 'AI analysis successfully finalized and stored in Firestore.',
      contractId,
      clausesCount: uniqueClauses.length,
      missingClauses,
      averageConfidence
    });

  } catch (err: any) {
    console.error('Finalize analysis process failure:', err);
    // Attempt to set status to failed on error
    try {
      await updateFirestoreDoc('contracts', contractId, { analysisStatus: 'failed' }, ['analysisStatus'], idToken);
    } catch (_) {}
    res.status(500).json({ error: `Finalizing pipeline failed: ${err.message}` });
  }
};
