import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  Footer,
  Header,
  PageNumber,
  LevelFormat
} from 'docx';
import {
  ExecutiveSummaryData,
  BusinessSummaryData,
  LegalSummaryData,
  RiskAnalysis,
  ReportType
} from '../types/contractTypes';

const COLOR_PRIMARY = '6B5BDB';
const COLOR_SECONDARY = '22B5CC';
const COLOR_TEXT = '1F2937';
const COLOR_MUTED = '6B7280';
const COLOR_SUCCESS = '10A85A';
const COLOR_WARNING = 'F59E0B';
const COLOR_DANGER = 'DC2626';
const COLOR_CRITICAL = 'A11619';

function riskColor(score: number): string {
  if (score >= 81) return COLOR_CRITICAL;
  if (score >= 61) return COLOR_DANGER;
  if (score >= 41) return COLOR_WARNING;
  if (score >= 21) return COLOR_SECONDARY;
  return COLOR_SUCCESS;
}

function riskLevelColor(level: string): string {
  switch (level) {
    case 'Critical': return COLOR_CRITICAL;
    case 'High': return COLOR_DANGER;
    case 'Moderate': return COLOR_WARNING;
    case 'Low': return COLOR_SECONDARY;
    case 'Very Low': return COLOR_SUCCESS;
    default: return COLOR_MUTED;
  }
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'Critical': return COLOR_CRITICAL;
    case 'High': return COLOR_DANGER;
    case 'Medium': return COLOR_WARNING;
    case 'Low': return COLOR_SECONDARY;
    default: return COLOR_MUTED;
  }
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'Immediate': return COLOR_CRITICAL;
    case 'High': return COLOR_DANGER;
    case 'Medium': return COLOR_WARNING;
    case 'Low': return COLOR_SECONDARY;
    default: return COLOR_MUTED;
  }
}

function p(text: string, options: { bold?: boolean; italics?: boolean; size?: number; color?: string; spacingAfter?: number; alignment?: any } = {}): Paragraph {
  const { bold = false, italics = false, size = 22, color = COLOR_TEXT, spacingAfter = 120, alignment } = options;
  return new Paragraph({
    alignment,
    spacing: { after: spacingAfter },
    children: [new TextRun({ text, bold, italics, size, color, font: 'Calibri' })]
  });
}

function heading(text: string, level: 'Heading1' | 'Heading2' | 'Heading3' = 'Heading1' as const): Paragraph {
  const sizes: Record<string, { size: number; color: string }> = {
    Heading1: { size: 32, color: COLOR_PRIMARY },
    Heading2: { size: 26, color: COLOR_PRIMARY },
    Heading3: { size: 22, color: COLOR_SECONDARY }
  };
  const cfg = sizes[level] || sizes.Heading1;
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: cfg.size, color: cfg.color, font: 'Calibri' })]
  });
}

function labelP(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 16, color: COLOR_MUTED, font: 'Calibri', characterSpacing: 40 })]
  });
}

function bulletList(items: string[]): Paragraph[] {
  if (items.length === 0) return [];
  return items.map(item => new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text: item, size: 22, color: COLOR_TEXT, font: 'Calibri' })]
  }));
}

function buildCoverPage(reportType: ReportType, contractName: string, generatedAt: string, riskAnalysis: RiskAnalysis | null): Paragraph[] {
  const typeLabels: Record<ReportType, string> = {
    executive: 'EXECUTIVE BRIEFING',
    business: 'BUSINESS BRIEFING',
    legal: 'LEGAL BRIEFING',
    full: 'COMPREHENSIVE BRIEFING'
  };

  const blocks: Paragraph[] = [
    new Paragraph({ spacing: { before: 1200 }, children: [new TextRun({ text: 'JurisAI', bold: true, size: 96, color: COLOR_PRIMARY, font: 'Calibri' })] }),
    new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: 'Executive Intelligence', bold: true, size: 48, color: COLOR_SECONDARY, font: 'Calibri' })] }),
    new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: 'Reporting System', italics: true, size: 32, color: COLOR_MUTED, font: 'Calibri' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: typeLabels[reportType], bold: true, size: 24, color: COLOR_SECONDARY, font: 'Calibri', characterSpacing: 80 })] }),
    new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: contractName, bold: true, size: 56, color: COLOR_TEXT, font: 'Calibri' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `Report generated on ${generatedAt}`, italics: true, size: 22, color: COLOR_MUTED, font: 'Calibri' })] }),
  ];

  if (riskAnalysis) {
    blocks.push(
      new Paragraph({ spacing: { before: 400, after: 80 }, children: [new TextRun({ text: 'OVERALL RISK ASSESSMENT', bold: true, size: 20, color: COLOR_MUTED, font: 'Calibri', characterSpacing: 80 })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `${riskAnalysis.overallRiskScore} / 100 — ${riskAnalysis.riskLevel.toUpperCase()}`, bold: true, size: 36, color: riskColor(riskAnalysis.overallRiskScore), font: 'Calibri' })] })
    );
  }

  blocks.push(new Paragraph({ children: [new PageBreak()] }));
  return blocks;
}

function buildExecutiveSections(ex: ExecutiveSummaryData): Paragraph[] {
  const blocks: Paragraph[] = [];

  // 1. Contract Overview
  blocks.push(heading('1. Contract Overview', 'Heading1'));
  blocks.push(labelP('Contract Type'));
  blocks.push(p(ex.contractType, { bold: true, size: 26 }));
  blocks.push(labelP('Contract Purpose'));
  blocks.push(p(ex.contractPurpose));
  blocks.push(labelP('Duration'));
  blocks.push(p(ex.duration));
  if (ex.effectiveDate) {
    blocks.push(labelP('Effective Date'));
    blocks.push(p(ex.effectiveDate));
  }
  if (ex.expirationDate) {
    blocks.push(labelP('Expiration Date'));
    blocks.push(p(ex.expirationDate));
  }

  // 2. Parties
  blocks.push(heading('2. Parties Involved', 'Heading1'));
  blocks.push(labelP('Vendor'));
  blocks.push(p(ex.parties.vendor, { bold: true }));
  blocks.push(labelP('Customer'));
  blocks.push(p(ex.parties.customer, { bold: true }));
  for (const other of ex.parties.otherParties) {
    blocks.push(labelP('Other Party'));
    blocks.push(p(other));
  }

  // 3. Key Commercial Terms
  blocks.push(heading('3. Key Commercial Terms', 'Heading1'));
  if (ex.keyCommercialTerms.length === 0) {
    blocks.push(p('No commercial terms could be extracted from the contract.'));
  } else {
    const termTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MUTED },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MUTED },
        left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MUTED },
        right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MUTED },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' }
      },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY, color: 'auto' },
              children: [new Paragraph({ children: [new TextRun({ text: 'TERM', bold: true, size: 22, color: 'FFFFFF', font: 'Calibri' })] })]
            }),
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY, color: 'auto' },
              children: [new Paragraph({ children: [new TextRun({ text: 'VALUE', bold: true, size: 22, color: 'FFFFFF', font: 'Calibri' })] })]
            })
          ]
        }),
        ...ex.keyCommercialTerms.map((t, i) => new TableRow({
          children: [
            new TableCell({
              shading: i % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F3F4F6', color: 'auto' } : undefined,
              children: [new Paragraph({ children: [new TextRun({ text: t.label, bold: true, size: 22, color: COLOR_TEXT, font: 'Calibri' })] })]
            }),
            new TableCell({
              shading: i % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F3F4F6', color: 'auto' } : undefined,
              children: [new Paragraph({ children: [new TextRun({ text: t.value, size: 22, color: COLOR_TEXT, font: 'Calibri' })] })]
            })
          ]
        }))
      ]
    });
    blocks.push(new Paragraph({ children: [termTable] }));
  }

  // 4. Risk Allocation
  blocks.push(heading('4. Risk Allocation', 'Heading1'));
  blocks.push(p(ex.riskAllocation));

  // 5. Risk Assessment
  blocks.push(heading('5. Overall Risk Assessment', 'Heading1'));
  blocks.push(labelP('Overall Risk Score'));
  blocks.push(p(`${ex.overallRiskScore} / 100 — ${ex.riskLevel.toUpperCase()}`, { bold: true, size: 28, color: riskLevelColor(ex.riskLevel) }));
  blocks.push(labelP('Risk Distribution by Category'));
  const breakdownRows: any[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY, color: 'auto' }, children: [new Paragraph({ children: [new TextRun({ text: 'CATEGORY', bold: true, size: 22, color: 'FFFFFF', font: 'Calibri' })] })] }),
        new TableCell({ shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY, color: 'auto' }, children: [new Paragraph({ children: [new TextRun({ text: 'SCORE', bold: true, size: 22, color: 'FFFFFF', font: 'Calibri' })] })] }),
        new TableCell({ shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY, color: 'auto' }, children: [new Paragraph({ children: [new TextRun({ text: 'INDICATOR', bold: true, size: 22, color: 'FFFFFF', font: 'Calibri' })] })] })
      ]
    })
  ];
  const catMap: [string, number][] = [
    ['Financial', ex.riskDistribution.Financial],
    ['Legal', ex.riskDistribution.Legal],
    ['Operational', ex.riskDistribution.Operational],
    ['Reputational', ex.riskDistribution.Reputational]
  ];
  catMap.forEach(([name, score], i) => {
    const level = score >= 81 ? 'Critical' : score >= 61 ? 'High' : score >= 41 ? 'Moderate' : score >= 21 ? 'Low' : 'Very Low';
    const indicator = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10));
    breakdownRows.push(new TableRow({
      children: [
        new TableCell({ shading: i % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F3F4F6', color: 'auto' } : undefined, children: [new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 22, color: COLOR_TEXT, font: 'Calibri' })] })] }),
        new TableCell({ shading: i % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F3F4F6', color: 'auto' } : undefined, children: [new Paragraph({ children: [new TextRun({ text: `${score} / 100`, bold: true, size: 22, color: riskColor(score), font: 'Calibri' })] })] }),
        new TableCell({ shading: i % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F3F4F6', color: 'auto' } : undefined, children: [new Paragraph({ children: [new TextRun({ text: `${indicator} (${level})`, size: 22, color: riskColor(score), font: 'Consolas' })] })] })
      ]
    }));
  });
  blocks.push(new Paragraph({ children: [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: breakdownRows, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MUTED }, bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MUTED }, left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MUTED }, right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_MUTED }, insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' }, insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' } } })] }));

  // 6. Important Obligations
  blocks.push(heading('6. Important Obligations', 'Heading1'));
  if (ex.importantObligations.vendor.length > 0) {
    blocks.push(heading('Vendor Obligations', 'Heading2'));
    blocks.push(...bulletList(ex.importantObligations.vendor));
  }
  if (ex.importantObligations.customer.length > 0) {
    blocks.push(heading('Customer Obligations', 'Heading2'));
    blocks.push(...bulletList(ex.importantObligations.customer));
  }
  if (ex.importantObligations.mutual.length > 0) {
    blocks.push(heading('Mutual Obligations', 'Heading2'));
    blocks.push(...bulletList(ex.importantObligations.mutual));
  }

  // 7. Missing Protections
  blocks.push(heading('7. Missing Protections', 'Heading1'));
  if (ex.missingProtections.length === 0) {
    blocks.push(p('All standard protections are present in this contract.', { color: COLOR_SUCCESS, bold: true }));
  } else {
    ex.missingProtections.forEach((m) => {
      blocks.push(heading(m.clauseType, 'Heading3'));
      blocks.push(p(m.businessImpact));
    });
  }

  // 8. Top Negotiation Points
  blocks.push(heading('8. Top Negotiation Points', 'Heading1'));
  if (ex.topNegotiationPoints.length === 0) {
    blocks.push(p('No high-priority negotiation points identified.'));
  } else {
    ex.topNegotiationPoints.forEach((np, i) => {
      blocks.push(heading(`${i + 1}. ${np.title}`, 'Heading2'));
      blocks.push(p(`Severity: ${np.severity}`, { bold: true, color: severityColor(np.severity) }));
      blocks.push(labelP('Why it matters'));
      blocks.push(p(np.whyImportant));
      blocks.push(labelP('Potential impact'));
      blocks.push(p(np.potentialImpact, { color: COLOR_DANGER }));
    });
  }

  // 9. Recommended Next Steps
  blocks.push(heading('9. Recommended Next Steps', 'Heading1'));
  if (ex.recommendedNextSteps.length === 0) {
    blocks.push(p('No specific recommendations at this time.'));
  } else {
    ex.recommendedNextSteps.forEach((r) => {
      blocks.push(p(`[${r.priority.toUpperCase()}] ${r.title}`, { bold: true, color: priorityColor(r.priority) }));
      blocks.push(p(r.description));
    });
  }

  return blocks;
}

function buildBusinessSections(b: BusinessSummaryData): Paragraph[] {
  const blocks: Paragraph[] = [];
  blocks.push(heading('Business Summary', 'Heading1'));
  blocks.push(labelP('Business Purpose'));
  blocks.push(p(b.businessPurpose));
  blocks.push(labelP('Commercial Focus'));
  blocks.push(p(b.commercialFocus));

  blocks.push(heading('Commercial Terms', 'Heading1'));
  const rows: [string, string][] = [
    ['Payment Terms', b.paymentTerms],
    ['Renewal Terms', b.renewalTerms],
    ['Termination Notice', b.terminationNotice],
    ['Service Commitments', b.serviceCommitments],
    ['IP Ownership', b.ipOwnership]
  ];
  rows.forEach(([label, value]) => {
    blocks.push(labelP(label));
    blocks.push(p(value));
  });

  blocks.push(heading('Business Impact', 'Heading1'));
  blocks.push(labelP('Financial Risk'));
  blocks.push(p(b.financialRisk));
  blocks.push(labelP('Operational Impact'));
  blocks.push(p(b.operationalImpact));

  if (b.keyBenefits.length > 0) {
    blocks.push(heading('Key Benefits', 'Heading2'));
    blocks.push(...bulletList(b.keyBenefits));
  }
  if (b.keyConcerns.length > 0) {
    blocks.push(heading('Key Concerns', 'Heading2'));
    blocks.push(...bulletList(b.keyConcerns));
  }
  return blocks;
}

function buildLegalSections(l: LegalSummaryData): Paragraph[] {
  const blocks: Paragraph[] = [];
  blocks.push(heading('Legal Summary', 'Heading1'));
  blocks.push(labelP('Governing Law'));
  blocks.push(p(l.governingLaw));

  const sections: [string, string][] = [
    ['Indemnification', l.indemnificationSummary],
    ['Limitation of Liability', l.liabilitySummary],
    ['Confidentiality', l.confidentialitySummary],
    ['Intellectual Property', l.ipSummary],
    ['Dispute Resolution', l.disputeResolutionSummary],
    ['Force Majeure', l.forceMajeureStatus],
    ['Data Protection', l.dataProtectionStatus]
  ];
  sections.forEach(([label, value]) => {
    blocks.push(heading(label, 'Heading2'));
    blocks.push(p(value));
  });

  if (l.clauseLevelFindings.length > 0) {
    blocks.push(heading('Clause-Level Findings', 'Heading1'));
    l.clauseLevelFindings.forEach((f) => {
      blocks.push(heading(`${f.clauseType}${f.sectionNumber ? ' § ' + f.sectionNumber : ''} (${f.riskLevel})`, 'Heading2'));
      blocks.push(p(f.finding));
    });
  }
  if (l.criticalLegalRisks.length > 0) {
    blocks.push(heading('Critical Legal Risks', 'Heading1'));
    blocks.push(...bulletList(l.criticalLegalRisks));
  }
  return blocks;
}

export interface DocxReportInput {
  reportType: ReportType;
  contractName: string;
  generatedAt: string;
  executive?: ExecutiveSummaryData | null;
  business?: BusinessSummaryData | null;
  legal?: LegalSummaryData | null;
  riskAnalysis: RiskAnalysis | null;
}

export async function generateDocxReport(input: DocxReportInput): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  children.push(...buildCoverPage(input.reportType, input.contractName, input.generatedAt, input.riskAnalysis));

  if (input.executive && (input.reportType === 'executive' || input.reportType === 'full')) {
    children.push(...buildExecutiveSections(input.executive));
  }
  if (input.business && (input.reportType === 'business' || input.reportType === 'full')) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...buildBusinessSections(input.business));
  }
  if (input.legal && (input.reportType === 'legal' || input.reportType === 'full')) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...buildLegalSections(input.legal));
  }

  const doc = new Document({
    creator: 'JurisAI',
    title: `${input.contractName} — Executive Report`,
    description: 'AI-generated executive intelligence report',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 }
        }
      }
    },
    numbering: {
      config: [
        {
          reference: 'default-bullet',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 240 } } }
            }
          ]
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'JurisAI Executive Report', size: 18, color: COLOR_MUTED, italics: true, font: 'Calibri' })]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', size: 18, color: COLOR_MUTED, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLOR_MUTED, font: 'Calibri' }),
                  new TextRun({ text: ' of ', size: 18, color: COLOR_MUTED, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: COLOR_MUTED, font: 'Calibri' })
                ]
              })
            ]
          })
        },
        children: children as any
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Generates a comparison report in Word (.docx) format compiling side-by-side differences,
 * clause alignments, version diffs, risk changes, and AI explanations.
 */
export async function generateComparisonDocxReport(
  comparison: any,
  contracts: any[],
  generatedAt: string
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // Cover Page
  children.push(
    new Paragraph({ spacing: { before: 1200 }, children: [new TextRun({ text: 'JurisAI', bold: true, size: 96, color: COLOR_PRIMARY, font: 'Calibri' })] }),
    new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: 'Due Diligence & Comparison', bold: true, size: 48, color: COLOR_SECONDARY, font: 'Calibri' })] }),
    new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: `Type: ${comparison.comparisonType.toUpperCase()}`, italics: true, size: 32, color: COLOR_MUTED, font: 'Calibri' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'AGREEMENTS AUDITED:', bold: true, size: 20, color: COLOR_SECONDARY, font: 'Calibri', characterSpacing: 80 })] })
  );

  contracts.forEach((c, idx) => {
    children.push(new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `${idx + 1}. ${c.contractName} (${c.contractCategory || 'Other'})`, bold: true, size: 24, color: COLOR_TEXT, font: 'Calibri' }),
        new TextRun({ text: ` — Risk Score: ${c.overallRiskScore || 0} / 100 (${c.riskLevel || 'Low'} Risk)`, size: 20, color: COLOR_MUTED, font: 'Calibri' })
      ]
    }));
  });

  children.push(
    new Paragraph({ spacing: { before: 400, after: 120 }, children: [new TextRun({ text: `Report generated on ${generatedAt}`, italics: true, size: 20, color: COLOR_MUTED, font: 'Calibri' })] }),
    new Paragraph({ children: [new PageBreak()] })
  );

  const res = comparison.results;

  if (comparison.comparisonType === 'contracts') {
    children.push(heading('Executive Summary', 'Heading1'));
    if (res.summary) {
      if (res.summary.keyDifferences && res.summary.keyDifferences.length > 0) {
        children.push(heading('Key Differences', 'Heading2'));
        children.push(...bulletList(res.summary.keyDifferences));
      }
      if (res.summary.topRisks && res.summary.topRisks.length > 0) {
        children.push(heading('Top Risks & Exposures', 'Heading2'));
        children.push(...bulletList(res.summary.topRisks));
      }
      if (res.summary.businessImpact && res.summary.businessImpact.length > 0) {
        children.push(heading('Business Impact', 'Heading2'));
        children.push(...bulletList(res.summary.businessImpact));
      }
      if (res.summary.negotiationConsiderations && res.summary.negotiationConsiderations.length > 0) {
        children.push(heading('Negotiation Considerations', 'Heading2'));
        children.push(...bulletList(res.summary.negotiationConsiderations));
      }
    }

    if (res.categories) {
      children.push(heading('Side-by-Side Clause Matrix', 'Heading1'));
      for (const [catName, catData] of Object.entries(res.categories)) {
        const cData = catData as any;
        children.push(heading(catName, 'Heading2'));
        children.push(p(`Semantic Similarity Score: ${cData.similarityScore}%`, { bold: true, color: COLOR_MUTED }));
        
        children.push(labelP('Explanation'));
        children.push(p(cData.explanation));

        children.push(labelP('Business Impact'));
        children.push(p(cData.businessImpact));

        children.push(labelP('Risk Impact'));
        children.push(p(cData.riskImpact, { color: COLOR_DANGER }));
      }
    }

    if (res.unusualClauses && res.unusualClauses.length > 0) {
      children.push(heading('Unusual / Deviating Clauses', 'Heading1'));
      res.unusualClauses.forEach((uc: any) => {
        children.push(heading(`${uc.clauseType} (in ${uc.contractName})`, 'Heading2'));
        children.push(p(`Findings: ${uc.explanation}`));
        children.push(p(`Why it deviates: ${uc.whyUnusual}`, { color: COLOR_DANGER }));
      });
    }

  } else if (comparison.comparisonType === 'clauses') {
    const clauseName = comparison.results.clauses?.[0]?.clauseType || 'Clause';
    children.push(heading(`Clause Differential: ${clauseName}`, 'Heading1'));

    if (res.aiExplanation) {
      children.push(p('Comparative AI Overview:', { bold: true }));
      children.push(p(res.aiExplanation.explanation));
      children.push(labelP('Business Impact'));
      children.push(p(res.aiExplanation.businessImpact));
      children.push(labelP('Risk Impact'));
      children.push(p(res.aiExplanation.riskImpact, { color: COLOR_DANGER }));
      children.push(p(`Semantic Similarity Index: ${res.aiExplanation.similarityScore}%`, { bold: true, color: COLOR_PRIMARY }));
    }

    if (res.clauses) {
      children.push(heading('Individual Clause Alignments', 'Heading1'));
      res.clauses.forEach((cl: any) => {
        children.push(heading(cl.contractName, 'Heading2'));
        children.push(p(`Risk Score: ${cl.riskScore} (${cl.riskLevel}) | Classification: ${cl.marketClassification}`, { bold: true, color: COLOR_MUTED }));
        children.push(p(`"${cl.clauseText}"`, { italics: true }));
        children.push(p(`Summary: ${cl.summary}`));
      });
    }

  } else if (comparison.comparisonType === 'versions') {
    children.push(heading('Document Version Comparison', 'Heading1'));

    if (res.diffSummary) {
      children.push(heading('Revision Summary', 'Heading2'));
      children.push(p(res.diffSummary.explanation));
      children.push(labelP('Business Impact'));
      children.push(p(res.diffSummary.businessImpact));
      children.push(labelP('Risk Profile Changes'));
      children.push(p(res.diffSummary.riskImpact, { color: COLOR_DANGER }));
      children.push(p(`Similarity Index: ${res.diffSummary.similarityScore}%`, { bold: true, color: COLOR_PRIMARY }));
    }

    if (res.sectionDiffs) {
      children.push(heading('Aligned Section Variances', 'Heading1'));
      res.sectionDiffs.forEach((sd: any) => {
        const secLabel = sd.sectionNumber ? `${sd.sectionNumber} ${sd.title}` : sd.title;
        children.push(heading(secLabel, 'Heading2'));
        if (sd.explanation) {
          children.push(p(`Change explanation: ${sd.explanation}`));
        }

        const diffText = sd.diffs.map((d: any) => {
          if (d.type === 'added') return `[+] ${d.value}`;
          if (d.type === 'removed') return `[-] ${d.value}`;
          return d.value;
        }).join(' ');

        const truncated = diffText.length > 500 ? diffText.substring(0, 500) + '... (truncated)' : diffText;
        children.push(p(`Diff preview: "${truncated}"`, { color: COLOR_MUTED, italics: true }));
      });
    }

  } else if (comparison.comparisonType === 'risk') {
    children.push(heading('Risk Delta Comparison', 'Heading1'));

    if (res.aiExplanation) {
      children.push(heading('Risk Exposure Assessment', 'Heading2'));
      children.push(p(res.aiExplanation.deltaExplanation));
      children.push(labelP('Business Impact'));
      children.push(p(res.aiExplanation.businessImpact));
      children.push(labelP('Practical Significance'));
      children.push(p(res.aiExplanation.practicalSignificance));
    }

    if (res.overallScores) {
      children.push(heading('Agreement Risk Scoring', 'Heading1'));
      for (const [cid, val] of Object.entries(res.overallScores)) {
        const v = val as any;
        children.push(heading(`${v.contractName}: Score ${v.score} / 100 (${v.riskLevel} Risk)`, 'Heading2'));
        
        const breakdown = res.riskBreakdowns?.[cid];
        if (breakdown) {
          const bdText = `Financial: ${breakdown.Financial} | Legal: ${breakdown.Legal} | Operational: ${breakdown.Operational} | Reputational: ${breakdown.Reputational}`;
          children.push(p(bdText, { color: COLOR_MUTED }));
        }

        const missing = res.missingClauses?.[cid];
        if (missing && missing.length > 0) {
          children.push(p(`Missing Protections: ${missing.join(', ')}`, { color: COLOR_DANGER }));
        }
      }
    }
  }

  const doc = new Document({
    creator: 'JurisAI',
    title: `JurisAI Comparison Report`,
    description: 'AI-generated contract comparison report',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'JurisAI Comparison Report', size: 18, color: COLOR_MUTED, italics: true, font: 'Calibri' })]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', size: 18, color: COLOR_MUTED, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLOR_MUTED, font: 'Calibri' }),
                  new TextRun({ text: ' of ', size: 18, color: COLOR_MUTED, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: COLOR_MUTED, font: 'Calibri' })
                ]
              })
            ]
          })
        },
        children: children as any
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
