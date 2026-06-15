import { Request, Response } from 'express';
import {
  getFirestoreDoc,
  queryFirestoreCollection,
  writeFirestoreDoc,
  updateFirestoreDoc
} from '../utils/firestoreRest';
import {
  generateExecutiveSummary,
  generateBusinessSummary,
  generateLegalSummary,
  ContractContextForSummary
} from '../services/summaryService';
import { generatePdfReport } from '../services/pdfReportService';
import { generateDocxReport } from '../services/docxReportService';
import {
  SummaryType,
  ReportType,
  ReportFormat,
  StoredSummary,
  StoredReport
} from '../types/contractTypes';

function getUidFromRequest(req: Request): { uid: string | null; idToken: string } {
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

async function buildContext(contractId: string, idToken: string, uid: string): Promise<ContractContextForSummary> {
  const contract = await getFirestoreDoc('contracts', contractId, idToken);
  if (!contract) throw new Error('Contract not found.');
  if (contract.userId !== uid) throw new Error('Access denied.');

  const clausesRaw = await queryFirestoreCollection('clauses', 'contractId', contractId, idToken, { field: 'userId', value: uid });
  const clauses = clausesRaw.map(c => ({
    clauseType: c.clauseType,
    sectionNumber: c.sectionNumber || '',
    sectionTitle: c.sectionTitle || '',
    summary: c.summary || '',
    fullText: c.fullText || ''
  }));

  const riskAnalysis = await getFirestoreDoc('riskAnalysis', contractId, idToken);

  return {
    contractName: contract.contractName || 'Untitled Contract',
    contractCategory: contract.contractCategory || 'Other',
    parties: contract.parties || [],
    effectiveDate: contract.effectiveDate || null,
    expirationDate: contract.expirationDate || null,
    pageCount: contract.pageCount || 0,
    clauses,
    missingClauses: contract.missingClauses || [],
    riskAnalysis: riskAnalysis || null
  };
}

function summaryIdFor(contractId: string, type: SummaryType): string {
  return `${contractId}-summary-${type}`;
}

function reportIdFor(contractId: string, type: ReportType, format: ReportFormat): string {
  return `${contractId}-${type}-${format}-${Date.now()}`;
}

/**
 * POST /api/ai/summary/generate
 * Body: { contractId, summaryType: 'executive' | 'business' | 'legal' | 'all' }
 * Generates and stores the requested summary(ies).
 */
export const generateSummary = async (req: Request, res: Response): Promise<void> => {
  const { contractId, summaryType = 'all' } = req.body;
  const { uid, idToken } = getUidFromRequest(req);

  if (!contractId) {
    res.status(400).json({ error: 'Missing contractId.' });
    return;
  }
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  const validTypes: (SummaryType | 'all')[] = ['executive', 'business', 'legal', 'all'];
  if (!validTypes.includes(summaryType)) {
    res.status(400).json({ error: 'Invalid summaryType. Must be executive | business | legal | all.' });
    return;
  }

  try {
    await updateFirestoreDoc('contracts', contractId, { summaryStatus: 'generating' }, ['summaryStatus'], idToken);

    const ctx = await buildContext(contractId, idToken, uid);

    const typesToGenerate: SummaryType[] = summaryType === 'all'
      ? ['executive', 'business', 'legal']
      : [summaryType as SummaryType];

    const modelUsed = 'gemini-2.5-flash';
    const results: StoredSummary[] = [];

    for (const t of typesToGenerate) {
      let data: any;
      if (t === 'executive') data = await generateExecutiveSummary(ctx);
      else if (t === 'business') data = await generateBusinessSummary(ctx);
      else data = await generateLegalSummary(ctx);

      const stored: StoredSummary = {
        summaryId: summaryIdFor(contractId, t),
        contractId,
        userId: uid,
        summaryType: t,
        data,
        generatedAt: new Date().toISOString(),
        modelUsed
      };
      await writeFirestoreDoc('summaries', stored.summaryId, stored as any, idToken);
      results.push(stored);
    }

    await updateFirestoreDoc('contracts', contractId, { summaryStatus: 'completed', summaryGeneratedAt: new Date().toISOString() }, ['summaryStatus', 'summaryGeneratedAt'], idToken);

    res.status(200).json({
      message: 'Summary generated successfully.',
      summaries: results
    });
  } catch (err: any) {
    console.error('Summary generation failed:', err);
    try {
      await updateFirestoreDoc('contracts', contractId, { summaryStatus: 'failed' }, ['summaryStatus'], idToken);
    } catch (_) {}
    res.status(500).json({ error: `Summary generation failed: ${err.message}` });
  }
};

/**
 * GET /api/ai/summary/:contractId
 * Returns all stored summaries for a contract.
 */
export const getSummaries = async (req: Request, res: Response): Promise<void> => {
  const { contractId } = req.params;
  const { uid, idToken } = getUidFromRequest(req);
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }
  try {
    const summaries = await queryFirestoreCollection('summaries', 'contractId', contractId, idToken, { field: 'userId', value: uid });
    res.status(200).json({ summaries });
  } catch (err: any) {
    console.error('Get summaries failed:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/ai/summary/regenerate
 * Body: { contractId, summaryType }
 * Convenience alias — same as /generate but with explicit semantics for clients.
 */
export const regenerateSummary = generateSummary;

/**
 * POST /api/ai/report/generate
 * Body: { contractId, reportType: 'executive' | 'business' | 'legal' | 'full', format: 'pdf' | 'docx' }
 * Generates a downloadable report (base64) and stores metadata in Firestore.
 */
export const generateReport = async (req: Request, res: Response): Promise<void> => {
  const { contractId, reportType = 'full', format = 'pdf' } = req.body;
  const { uid, idToken } = getUidFromRequest(req);

  if (!contractId) {
    res.status(400).json({ error: 'Missing contractId.' });
    return;
  }
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  const validReportTypes: ReportType[] = ['executive', 'business', 'legal', 'full'];
  const validFormats: ReportFormat[] = ['pdf', 'docx'];
  if (!validReportTypes.includes(reportType)) {
    res.status(400).json({ error: 'Invalid reportType.' });
    return;
  }
  if (!validFormats.includes(format)) {
    res.status(400).json({ error: 'Invalid format.' });
    return;
  }

  try {
    const ctx = await buildContext(contractId, idToken, uid);

    // Fetch stored summaries (so we don't always re-generate)
    const storedSummaries = await queryFirestoreCollection('summaries', 'contractId', contractId, idToken, { field: 'userId', value: uid });

    let executive: any = null;
    let business: any = null;
    let legal: any = null;

    for (const s of storedSummaries) {
      if (s.summaryType === 'executive') executive = s.data;
      else if (s.summaryType === 'business') business = s.data;
      else if (s.summaryType === 'legal') legal = s.data;
    }

    // If we need a particular summary and it doesn't exist, generate it.
    if (reportType === 'executive' || reportType === 'full') {
      if (!executive) executive = await generateExecutiveSummary(ctx);
    }
    if (reportType === 'business' || reportType === 'full') {
      if (!business) business = await generateBusinessSummary(ctx);
    }
    if (reportType === 'legal' || reportType === 'full') {
      if (!legal) legal = await generateLegalSummary(ctx);
    }

    const generatedAt = new Date().toISOString();
    const fileName = `${ctx.contractName.replace(/[^a-z0-9-_. ]/gi, '_')}-${reportType}-${Date.now()}.${format}`;

    let buffer: Buffer;
    if (format === 'pdf') {
      const bytes = await generatePdfReport({
        reportType,
        contractName: ctx.contractName,
        generatedAt,
        executive,
        business,
        legal,
        riskAnalysis: ctx.riskAnalysis
      });
      buffer = Buffer.from(bytes);
    } else {
      buffer = await generateDocxReport({
        reportType,
        contractName: ctx.contractName,
        generatedAt,
        executive,
        business,
        legal,
        riskAnalysis: ctx.riskAnalysis
      });
    }

    const reportId = reportIdFor(contractId, reportType, format);
    const report: StoredReport = {
      reportId,
      contractId,
      userId: uid,
      reportType,
      format,
      generatedAt,
      fileName,
      contentBase64: buffer.toString('base64'),
      contractName: ctx.contractName
    };
    await writeFirestoreDoc('reports', reportId, report as any, idToken);

    res.status(200).json({
      message: 'Report generated successfully.',
      reportId,
      fileName,
      format,
      reportType,
      contentBase64: report.contentBase64,
      generatedAt: report.generatedAt
    });
  } catch (err: any) {
    console.error('Report generation failed:', err);
    res.status(500).json({ error: `Report generation failed: ${err.message}` });
  }
};

/**
 * GET /api/ai/report/:contractId
 * Lists report metadata for a contract.
 */
export const listReports = async (req: Request, res: Response): Promise<void> => {
  const { contractId } = req.params;
  const { uid, idToken } = getUidFromRequest(req);
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }
  try {
    const reports = await queryFirestoreCollection('reports', 'contractId', contractId, idToken, { field: 'userId', value: uid });
    // Strip the heavy content field from list response
    const meta = reports.map((r: any) => ({
      reportId: r.reportId,
      contractId: r.contractId,
      reportType: r.reportType,
      format: r.format,
      generatedAt: r.generatedAt,
      fileName: r.fileName,
      contractName: r.contractName
    }));
    res.status(200).json({ reports: meta });
  } catch (err: any) {
    console.error('List reports failed:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/ai/report/download/:reportId
 * Returns a stored report (base64) for re-download.
 */
export const downloadReport = async (req: Request, res: Response): Promise<void> => {
  const { reportId } = req.params;
  const { uid, idToken } = getUidFromRequest(req);
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }
  try {
    const report = await getFirestoreDoc('reports', reportId, idToken);
    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    if (report.userId !== uid) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    res.status(200).json({
      reportId: report.reportId,
      fileName: report.fileName,
      format: report.format,
      reportType: report.reportType,
      generatedAt: report.generatedAt,
      contentBase64: report.contentBase64
    });
  } catch (err: any) {
    console.error('Download report failed:', err);
    res.status(500).json({ error: err.message });
  }
};
