import { KnowledgeChunk, ContractChunkDoc } from '../types/chatTypes';
import { cosineSimilarity } from './embeddingService';

// Sections longer than this are split into multiple chunks so embeddings stay focused.
const MAX_SECTION_CHARS = 1500;

/**
 * Splits a long block of text into <= MAX_SECTION_CHARS pieces on paragraph/sentence boundaries.
 */
function splitText(text: string, maxChars: number): string[] {
  const clean = (text || '').trim();
  if (clean.length <= maxChars) {
    return clean ? [clean] : [];
  }

  const parts: string[] = [];
  let remaining = clean;

  while (remaining.length > maxChars) {
    let cut = remaining.lastIndexOf('\n', maxChars);
    if (cut < maxChars * 0.5) cut = remaining.lastIndexOf('. ', maxChars);
    if (cut < maxChars * 0.5) cut = maxChars;
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);

  return parts;
}

/**
 * Builds the full set of knowledge chunks for a contract from its parsed sections,
 * extracted clauses, clause-level risk findings, overall risk analysis, and metadata.
 *
 * Inputs mirror the Firestore shapes produced by earlier phases (loosely typed `any`
 * because they come back from the Firestore REST deserializer).
 */
export function buildKnowledgeChunks(
  contract: any,
  clauses: any[],
  clauseRisks: any[],
  riskAnalysis: any | null
): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  // 1. Metadata chunk
  const metaParts: string[] = [];
  if (contract?.contractName) metaParts.push(`Contract Name: ${contract.contractName}`);
  if (contract?.contractCategory) metaParts.push(`Category: ${contract.contractCategory}`);
  if (Array.isArray(contract?.parties) && contract.parties.length) {
    metaParts.push(`Parties: ${contract.parties.join(', ')}`);
  }
  if (contract?.effectiveDate) metaParts.push(`Effective Date: ${contract.effectiveDate}`);
  if (contract?.expirationDate) metaParts.push(`Expiration Date: ${contract.expirationDate}`);
  if (metaParts.length) {
    chunks.push({
      sourceType: 'metadata',
      sourceRef: 'metadata',
      title: 'Contract Metadata',
      content: metaParts.join('\n')
    });
  }

  // 2. Section chunks from parsed structured text
  const sections: any[] = Array.isArray(contract?.structuredText) ? contract.structuredText : [];
  for (const sec of sections) {
    const sectionNumber = sec?.sectionNumber || '';
    const sectionTitle = sec?.title || 'Section';
    const body = sec?.content || '';
    const pieces = splitText(body, MAX_SECTION_CHARS);
    pieces.forEach((piece, idx) => {
      const partLabel = pieces.length > 1 ? ` (part ${idx + 1}/${pieces.length})` : '';
      chunks.push({
        sourceType: 'section',
        sourceRef: sectionNumber || sectionTitle,
        title: `${sectionNumber ? sectionNumber + ' ' : ''}${sectionTitle}${partLabel}`.trim(),
        content: `Section ${sectionNumber} - ${sectionTitle}\n${piece}`
      });
    });
  }

  // 3. Clause chunks
  for (const c of clauses || []) {
    const lines = [
      `Clause Type: ${c.clauseType}`,
      c.sectionNumber ? `Section: ${c.sectionNumber}` : '',
      c.summary ? `Summary: ${c.summary}` : '',
      c.fullText ? `Text: ${c.fullText}` : ''
    ].filter(Boolean);
    chunks.push({
      sourceType: 'clause',
      sourceRef: c.clauseId,
      title: `${c.clauseType}${c.sectionNumber ? ' (Section ' + c.sectionNumber + ')' : ''}`,
      content: lines.join('\n')
    });
  }

  // 4. Clause-level risk chunks
  for (const r of clauseRisks || []) {
    const mc = r.marketComparison || {};
    const lines = [
      `Risk Finding for ${r.clauseType}`,
      `Risk Level: ${r.riskLevel} (score ${r.riskScore}, ${r.riskCategory})`,
      r.whyFlagged ? `Why Flagged: ${r.whyFlagged}` : '',
      r.potentialImpact ? `Potential Impact: ${r.potentialImpact}` : '',
      r.recommendedAction ? `Recommended Action: ${r.recommendedAction}` : '',
      mc.contractValue || mc.marketValue
        ? `Market Comparison: contract says "${mc.contractValue}" vs market standard "${mc.marketValue}" (${mc.classification})`
        : ''
    ].filter(Boolean);
    chunks.push({
      sourceType: 'risk',
      sourceRef: r.clauseId,
      title: `Risk: ${r.clauseType} — ${r.riskLevel}`,
      content: lines.join('\n')
    });
  }

  // 5. Overall risk analysis chunk(s)
  if (riskAnalysis) {
    const overallLines = [
      `Overall Contract Risk Score: ${riskAnalysis.overallRiskScore} (${riskAnalysis.riskLevel})`
    ];
    if (riskAnalysis.riskBreakdown) {
      const b = riskAnalysis.riskBreakdown;
      overallLines.push(`Risk Breakdown — Financial: ${b.Financial}, Legal: ${b.Legal}, Operational: ${b.Operational}, Reputational: ${b.Reputational}`);
    }
    chunks.push({
      sourceType: 'risk',
      sourceRef: 'overall',
      title: 'Overall Risk Assessment',
      content: overallLines.join('\n')
    });

    const topIssues: any[] = Array.isArray(riskAnalysis.topIssues) ? riskAnalysis.topIssues : [];
    if (topIssues.length) {
      const issueText = topIssues
        .map((iss, i) => `${i + 1}. [${iss.severity}] ${iss.title}: ${iss.description}`)
        .join('\n');
      chunks.push({
        sourceType: 'risk',
        sourceRef: 'overall',
        title: 'Top Risk Issues',
        content: `Top Issues in this contract:\n${issueText}`
      });
    }
  }

  return chunks;
}

export interface RetrievedChunk {
  chunk: ContractChunkDoc;
  score: number;
}

/**
 * Ranks persisted chunk docs against a query embedding via cosine similarity and returns top-K.
 */
export function retrieveTopK(
  queryEmbedding: number[],
  chunkDocs: ContractChunkDoc[],
  k = 5
): RetrievedChunk[] {
  const scored = chunkDocs
    .filter(doc => Array.isArray(doc.embedding) && doc.embedding.length > 0)
    .map(doc => ({ chunk: doc, score: cosineSimilarity(queryEmbedding, doc.embedding) }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
