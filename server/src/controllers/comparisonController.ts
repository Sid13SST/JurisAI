import { Request, Response } from 'express';
import * as Diff from 'diff';
import {
  getFirestoreDoc,
  queryFirestoreCollection,
  writeFirestoreDoc
} from '../utils/firestoreRest';
import {
  compareContractsAI,
  compareSpecificClausesAI,
  explainVersionChangesAI,
  compareRiskAI
} from '../services/aiService';
import { generateComparisonPdfReport } from '../services/pdfReportService';
import { generateComparisonDocxReport } from '../services/docxReportService';
import { TopIssue, StructuredSection } from '../types/contractTypes';
import { StoredComparison, DiffToken, SectionDiff, ClauseComparisonDetail, VersionComparisonResult, RiskComparisonResult } from '../types/comparisonTypes';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'jurisai-13ad0';

/**
 * Decodes UID and extracts auth bearer token from the request
 */
function getAuthDetails(req: Request): { uid: string | null; idToken: string } {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { uid: null, idToken: '' };
  }
  const idToken = authHeader.split(' ')[1];
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return { uid: null, idToken };
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return { uid: payload.user_id || payload.sub || null, idToken };
  } catch {
    return { uid: null, idToken };
  }
}

/**
 * Validates user ownership of a list of contracts.
 * Returns the full contract documents if valid, otherwise throws an error.
 */
async function validateContractOwnership(
  contractIds: string[],
  uid: string,
  idToken: string
): Promise<any[]> {
  const contracts: any[] = [];
  for (const id of contractIds) {
    const contract = await getFirestoreDoc('contracts', id, idToken);
    if (!contract) {
      throw new Error(`Contract ${id} not found.`);
    }
    if (contract.userId !== uid) {
      throw new Error(`Access denied. You do not own contract ${id}.`);
    }
    contracts.push(contract);
  }
  return contracts;
}

/**
 * POST /api/comparison/contracts
 * Body: { contractIds: string[] }
 */
export const compareContracts = async (req: Request, res: Response): Promise<void> => {
  const { contractIds } = req.body;
  const { uid, idToken } = getAuthDetails(req);

  if (!contractIds || !Array.isArray(contractIds) || contractIds.length < 2 || contractIds.length > 4) {
    res.status(400).json({ error: 'Please provide between 2 and 4 contractIds in an array.' });
    return;
  }
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    // 1. Verify ownership
    const contractDocs = await validateContractOwnership(contractIds, uid, idToken);

    // 2. Fetch clauses and risk records for all contracts
    const contractListForAI: any[] = [];
    for (const doc of contractDocs) {
      const clauses = await queryFirestoreCollection('clauses', 'contractId', doc.contractId, idToken, { field: 'userId', value: uid });
      const clauseRisks = await queryFirestoreCollection('clauseRisk', 'contractId', doc.contractId, idToken, { field: 'userId', value: uid });

      const optimizedClauses = clauses.map(c => {
        const risk = clauseRisks.find(r => r.clauseId === c.clauseId);
        return {
          clauseType: c.clauseType,
          summary: c.summary || '',
          riskScore: risk ? risk.riskScore : 0,
          marketClassification: risk && risk.marketComparison ? risk.marketComparison.classification : 'Neutral'
        };
      });

      contractListForAI.push({
        id: doc.contractId,
        name: doc.contractName,
        clauses: optimizedClauses
      });
    }

    // 3. Call Gemini
    const aiResults = await compareContractsAI(contractListForAI);

    // 4. Save to history
    const comparisonId = `compare-c-${Math.random().toString(36).substring(2, 11)}`;
    const storedComparison: StoredComparison = {
      comparisonId,
      userId: uid,
      contractsCompared: contractDocs.map(c => ({ contractId: c.contractId, contractName: c.contractName })),
      comparisonType: 'contracts',
      createdAt: new Date().toISOString(),
      results: aiResults
    };

    await writeFirestoreDoc('comparisons', comparisonId, storedComparison as any, idToken);

    res.status(200).json(storedComparison);

  } catch (err: any) {
    console.error('Multi-contract comparison failure:', err);
    res.status(500).json({ error: err.message || 'Comparison failed.' });
  }
};

/**
 * POST /api/comparison/clauses
 * Body: { contractIds: string[], clauseType: string }
 */
export const compareClauses = async (req: Request, res: Response): Promise<void> => {
  const { contractIds, clauseType } = req.body;
  const { uid, idToken } = getAuthDetails(req);

  if (!contractIds || !Array.isArray(contractIds) || !clauseType) {
    res.status(400).json({ error: 'Missing required parameters: contractIds (array) and clauseType (string).' });
    return;
  }
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const contractDocs = await validateContractOwnership(contractIds, uid, idToken);

    const clausesList: ClauseComparisonDetail[] = [];
    const aiClausesInput: any[] = [];

    for (const doc of contractDocs) {
      const allClauses = await queryFirestoreCollection('clauses', 'contractId', doc.contractId, idToken, { field: 'userId', value: uid });
      const matchedClause = allClauses.find(c => c.clauseType.toLowerCase() === clauseType.toLowerCase());

      let riskScore = 0;
      let riskLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
      let marketClassification: 'Favourable' | 'Neutral' | 'Unfavourable' | 'Unusual' = 'Neutral';

      if (matchedClause) {
        const risk = await getFirestoreDoc('clauseRisk', matchedClause.clauseId, idToken);
        if (risk) {
          riskScore = risk.riskScore;
          riskLevel = risk.riskLevel;
          if (risk.marketComparison) {
            marketClassification = risk.marketComparison.classification;
          }
        }
      }

      const detail: ClauseComparisonDetail = {
        contractId: doc.contractId,
        contractName: doc.contractName,
        clauseText: matchedClause ? matchedClause.fullText : 'Clause not explicitly defined or missing from this agreement type.',
        summary: matchedClause ? matchedClause.summary : 'Not defined.',
        riskScore,
        riskLevel,
        marketClassification
      };

      clausesList.push(detail);
      aiClausesInput.push({
        contractName: doc.contractName,
        summary: detail.summary,
        riskScore: detail.riskScore,
        classification: detail.marketClassification
      });
    }

    // Call Gemini to explain the specific clause changes
    const aiExplanation = await compareSpecificClausesAI(clauseType, aiClausesInput);

    const comparisonId = `compare-l-${Math.random().toString(36).substring(2, 11)}`;
    const results = {
      clauses: clausesList,
      aiExplanation
    };

    const storedComparison: StoredComparison = {
      comparisonId,
      userId: uid,
      contractsCompared: contractDocs.map(c => ({ contractId: c.contractId, contractName: c.contractName })),
      comparisonType: 'clauses',
      createdAt: new Date().toISOString(),
      results
    };

    await writeFirestoreDoc('comparisons', comparisonId, storedComparison as any, idToken);

    res.status(200).json(storedComparison);

  } catch (err: any) {
    console.error('Clause comparison failure:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/comparison/versions
 * Body: { originalContractId: string, revisedContractId: string }
 */
export const compareVersions = async (req: Request, res: Response): Promise<void> => {
  const { originalContractId, revisedContractId } = req.body;
  const { uid, idToken } = getAuthDetails(req);

  if (!originalContractId || !revisedContractId) {
    res.status(400).json({ error: 'Missing originalContractId or revisedContractId.' });
    return;
  }
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const contracts = await validateContractOwnership([originalContractId, revisedContractId], uid, idToken);
    const originalContract = contracts.find(c => c.contractId === originalContractId);
    const revisedContract = contracts.find(c => c.contractId === revisedContractId);

    const originalSections: StructuredSection[] = originalContract.structuredText || [];
    const revisedSections: StructuredSection[] = revisedContract.structuredText || [];

    // Match sections by section number or title
    const makeMatchKey = (sec: StructuredSection) => {
      const num = sec.sectionNumber ? sec.sectionNumber.trim().toLowerCase() : '';
      const title = sec.title ? sec.title.trim().toLowerCase() : '';
      return num || title;
    };

    const matchedPairs: { title: string; originalContent: string; revisedContent: string; sectionNumber: string }[] = [];

    originalSections.forEach(origSec => {
      const origKey = makeMatchKey(origSec);
      const matchedRevised = revisedSections.find(revSec => makeMatchKey(revSec) === origKey);
      if (matchedRevised) {
        matchedPairs.push({
          title: origSec.title || matchedRevised.title || 'Section',
          sectionNumber: origSec.sectionNumber || matchedRevised.sectionNumber || '',
          originalContent: origSec.content || '',
          revisedContent: matchedRevised.content || ''
        });
      }
    });

    // Compute diffs for each matched pair using the diff package
    const sectionDiffs: SectionDiff[] = matchedPairs.map(pair => {
      const changes = Diff.diffWords(pair.originalContent, pair.revisedContent);
      const diffs: DiffToken[] = changes.map(c => ({
        type: c.added ? 'added' : c.removed ? 'removed' : 'unchanged',
        value: c.value
      }));

      return {
        title: pair.title,
        sectionNumber: pair.sectionNumber,
        originalContent: pair.originalContent,
        revisedContent: pair.revisedContent,
        diffs,
        explanation: '' // will be populated from AI
      };
    });

    // Send only matched section content to AI to optimize tokens
    const aiMatchedInput = matchedPairs.map(p => ({
      title: p.title,
      originalContent: p.originalContent,
      revisedContent: p.revisedContent
    }));

    const aiExplanation = await explainVersionChangesAI(aiMatchedInput);

    // Merge AI descriptions back into matched section diffs
    sectionDiffs.forEach(sd => {
      const matchedDesc = aiExplanation.sectionExplanations?.find(
        (se: any) => se.title.toLowerCase() === sd.title.toLowerCase()
      );
      if (matchedDesc) {
        sd.explanation = matchedDesc.explanation;
      }
    });

    const results: VersionComparisonResult = {
      originalContractId,
      revisedContractId,
      diffSummary: aiExplanation.diffSummary,
      sectionDiffs
    };

    const comparisonId = `compare-v-${Math.random().toString(36).substring(2, 11)}`;
    const storedComparison: StoredComparison = {
      comparisonId,
      userId: uid,
      contractsCompared: [
        { contractId: originalContractId, contractName: originalContract.contractName },
        { contractId: revisedContractId, contractName: revisedContract.contractName }
      ],
      comparisonType: 'versions',
      createdAt: new Date().toISOString(),
      results
    };

    await writeFirestoreDoc('comparisons', comparisonId, storedComparison as any, idToken);

    res.status(200).json(storedComparison);

  } catch (err: any) {
    console.error('Version comparison failure:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/comparison/risk
 * Body: { contractIds: string[] }
 */
export const compareRisk = async (req: Request, res: Response): Promise<void> => {
  const { contractIds } = req.body;
  const { uid, idToken } = getAuthDetails(req);

  if (!contractIds || !Array.isArray(contractIds) || contractIds.length < 2) {
    res.status(400).json({ error: 'Please provide at least 2 contractIds.' });
    return;
  }
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const contractDocs = await validateContractOwnership(contractIds, uid, idToken);

    const overallScores: Record<string, { contractName: string; score: number; riskLevel: string }> = {};
    const riskBreakdowns: Record<string, { Financial: number; Legal: number; Operational: number; Reputational: number }> = {};
    const missingClauses: Record<string, string[]> = {};
    const criticalRisks: Record<string, TopIssue[]> = {};

    const aiInput: any[] = [];

    for (const doc of contractDocs) {
      const riskAnalysis = await getFirestoreDoc('riskAnalysis', doc.contractId, idToken);

      const overallScore = riskAnalysis ? riskAnalysis.overallRiskScore : 0;
      const riskLevel = riskAnalysis ? riskAnalysis.riskLevel : 'Low';
      const breakdown = riskAnalysis ? riskAnalysis.riskBreakdown : { Financial: 0, Legal: 0, Operational: 0, Reputational: 0 };
      const topIssues = riskAnalysis ? riskAnalysis.topIssues : [];

      overallScores[doc.contractId] = {
        contractName: doc.contractName,
        score: overallScore,
        riskLevel
      };

      riskBreakdowns[doc.contractId] = breakdown;
      missingClauses[doc.contractId] = doc.missingClauses || [];
      criticalRisks[doc.contractId] = topIssues;

      aiInput.push({
        name: doc.contractName,
        overallRiskScore: overallScore,
        riskLevel,
        riskBreakdown: breakdown,
        topIssues
      });
    }

    const aiExplanation = await compareRiskAI(aiInput);

    const results: RiskComparisonResult = {
      overallScores,
      riskBreakdowns,
      missingClauses,
      criticalRisks,
      aiExplanation
    };

    const comparisonId = `compare-r-${Math.random().toString(36).substring(2, 11)}`;
    const storedComparison: StoredComparison = {
      comparisonId,
      userId: uid,
      contractsCompared: contractDocs.map(c => ({ contractId: c.contractId, contractName: c.contractName })),
      comparisonType: 'risk',
      createdAt: new Date().toISOString(),
      results
    };

    await writeFirestoreDoc('comparisons', comparisonId, storedComparison as any, idToken);

    res.status(200).json(storedComparison);

  } catch (err: any) {
    console.error('Risk comparison failure:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/comparison/history
 * Query: ?limit=10&offset=0
 */
export const getComparisonHistory = async (req: Request, res: Response): Promise<void> => {
  const { uid, idToken } = getAuthDetails(req);
  const limit = parseInt(req.query.limit as string || '10', 10);
  const offset = parseInt(req.query.offset as string || '0', 10);

  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    // We execute standard Firestore REST query to fetch list of comparisons
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

    const body = {
      structuredQuery: {
        from: [{ collectionId: 'comparisons' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'userId' },
            op: 'EQUAL',
            value: { stringValue: uid }
          }
        },
        orderBy: [
          {
            field: { fieldPath: 'createdAt' },
            direction: 'DESCENDING'
          }
        ],
        limit
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`History query failed: ${response.status} - ${errTxt}`);
    }

    const resData = await response.json();
    const results: any[] = [];

    if (Array.isArray(resData)) {
      // Helper function from firestoreRest mapping equivalent logic
      const fromFirestoreFields = (fields: any) => {
        const obj: any = {};
        for (const [k, v] of Object.entries(fields)) {
          if (!v) continue;
          const val = v as any;
          if ('stringValue' in val) obj[k] = val.stringValue;
          else if ('integerValue' in val) obj[k] = parseInt(val.integerValue, 10);
          else if ('doubleValue' in val) obj[k] = parseFloat(val.doubleValue);
          else if ('booleanValue' in val) obj[k] = val.booleanValue;
          else if ('arrayValue' in val) {
            const vals = val.arrayValue.values || [];
            obj[k] = vals.map((item: any) => {
              if ('mapValue' in item) {
                const innerObj: any = {};
                for (const [ik, iv] of Object.entries(item.mapValue.fields || {})) {
                  const valInner = iv as any;
                  if ('stringValue' in valInner) innerObj[ik] = valInner.stringValue;
                  else if ('integerValue' in valInner) innerObj[ik] = parseInt(valInner.integerValue, 10);
                }
                return innerObj;
              }
              return val.stringValue || item;
            });
          } else if ('mapValue' in val) {
            const innerObj: any = {};
            for (const [ik, iv] of Object.entries(val.mapValue.fields || {})) {
              const valInner = iv as any;
              if ('stringValue' in valInner) innerObj[ik] = valInner.stringValue;
              else if ('integerValue' in valInner) innerObj[ik] = parseInt(valInner.integerValue, 10);
            }
            obj[k] = innerObj;
          }
        }
        return obj;
      };

      for (const item of resData) {
        if (item.document && item.document.fields) {
          // Clean mapper for UI list performance (excludes heavy results)
          const fields = item.document.fields;
          const mapped = fromFirestoreFields(fields);
          results.push({
            comparisonId: mapped.comparisonId,
            userId: mapped.userId,
            comparisonType: mapped.comparisonType,
            contractsCompared: mapped.contractsCompared,
            createdAt: mapped.createdAt
          });
        }
      }
    }

    res.status(200).json({ history: results });

  } catch (err: any) {
    console.error('History fetch failure:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/comparison/:comparisonId
 */
export const getComparisonById = async (req: Request, res: Response): Promise<void> => {
  const { comparisonId } = req.params;
  const { uid, idToken } = getAuthDetails(req);

  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/comparisons/${comparisonId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        res.status(404).json({ error: 'Comparison record not found.' });
        return;
      }
      const errTxt = await response.text();
      throw new Error(`Comparison GET failed: ${response.status} - ${errTxt}`);
    }

    const resData = await response.json();
    
    // Convert Firestore REST representation back to standard JSON
    const fromFirestoreValue = (fieldVal: any): any => {
      if (!fieldVal) return null;
      if ('stringValue' in fieldVal) return fieldVal.stringValue;
      if ('integerValue' in fieldVal) return parseInt(fieldVal.integerValue, 10);
      if ('doubleValue' in fieldVal) return parseFloat(fieldVal.doubleValue);
      if ('booleanValue' in fieldVal) return fieldVal.booleanValue;
      if ('nullValue' in fieldVal) return null;
      if ('arrayValue' in fieldVal) {
        const vals = fieldVal.arrayValue.values || [];
        return vals.map(fromFirestoreValue);
      }
      if ('mapValue' in fieldVal) {
        const fields = fieldVal.mapValue.fields || {};
        const obj: any = {};
        for (const [k, v] of Object.entries(fields)) {
          obj[k] = fromFirestoreValue(v);
        }
        return obj;
      }
      return null;
    };

    const obj: any = {};
    for (const [k, v] of Object.entries(resData.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }

    if (obj.userId !== uid) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    res.status(200).json(obj);

  } catch (err: any) {
    console.error('Comparison retrieval failure:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/comparison/export
 * Body: { comparisonId: string, format: 'pdf' | 'docx' }
 */
export const exportComparison = async (req: Request, res: Response): Promise<void> => {
  const { comparisonId, format = 'pdf' } = req.body;
  const { uid, idToken } = getAuthDetails(req);

  if (!comparisonId) {
    res.status(400).json({ error: 'comparisonId is required.' });
    return;
  }
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    // 1. Fetch comparison result
    const comparison = await getFirestoreDoc('comparisons', comparisonId, idToken);
    if (!comparison) {
      res.status(404).json({ error: 'Comparison record not found.' });
      return;
    }
    if (comparison.userId !== uid) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    // 2. Fetch involved contracts
    const contractIds = comparison.contractsCompared.map((c: any) => c.contractId);
    const contracts = await validateContractOwnership(contractIds, uid, idToken);

    // 3. Generate report Buffer
    let buffer: Buffer;
    const generatedAt = new Date().toISOString();
    const compName = comparison.contractsCompared.map((c: any) => c.contractName).join('_vs_');
    const fileName = `Comparison_${compName.replace(/[^a-z0-9-_. ]/gi, '_')}-${Date.now()}.${format}`;

    if (format === 'pdf') {
      const bytes = await generateComparisonPdfReport(comparison, contracts, generatedAt);
      buffer = Buffer.from(bytes);
    } else if (format === 'docx') {
      buffer = await generateComparisonDocxReport(comparison, contracts, generatedAt);
    } else {
      res.status(400).json({ error: 'Unsupported format. Use pdf or docx.' });
      return;
    }

    // 4. Save report in reports collection
    const reportId = `report-comp-${Math.random().toString(36).substring(2, 11)}`;
    const reportDoc = {
      reportId,
      contractId: contractIds[0], // primary reference
      userId: uid,
      reportType: 'comparison',
      format,
      generatedAt,
      fileName,
      contentBase64: buffer.toString('base64'),
      contractName: `Comparison: ${comparison.contractsCompared.map((c: any) => c.contractName).join(', ')}`
    };

    await writeFirestoreDoc('reports', reportId, reportDoc, idToken);

    res.status(200).json({
      message: 'Comparison report generated successfully.',
      reportId,
      fileName,
      format,
      contentBase64: reportDoc.contentBase64,
      generatedAt
    });

  } catch (err: any) {
    console.error('Comparison export failure:', err);
    res.status(500).json({ error: err.message });
  }
};
