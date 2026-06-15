import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

import {
  ExecutiveSummaryData,
  BusinessSummaryData,
  LegalSummaryData,
  RiskAnalysis
} from '../types/contractTypes';

export interface ContractContextForSummary {
  contractName: string;
  contractCategory: string;
  parties: string[];
  effectiveDate: string | null;
  expirationDate: string | null;
  pageCount: number;
  clauses: {
    clauseType: string;
    sectionNumber: string;
    sectionTitle: string;
    summary: string;
    fullText: string;
  }[];
  missingClauses: string[];
  riskAnalysis: RiskAnalysis | null;
}

const PLAIN_ENGLISH_RULE = `
CRITICAL: Write in plain, business-friendly English. Avoid legal jargon. A non-lawyer
executive, founder, procurement manager, or business stakeholder must be able to
read your output without confusion. For example:
 - Do NOT use: "The indemnifying party shall hold harmless..."
   Use: "One party is required to compensate the other for losses under certain conditions."
 - Do NOT use: "Notwithstanding anything to the contrary..."
   Use: "Even if other parts of the contract say something different, this rule applies."
 - Do NOT use: "Party A hereby covenants and agrees..."
   Use: "Party A commits to doing X."
`;

async function callGemini(systemPrompt: string, userPrompt: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API Key. Please configure process.env.GEMINI_API_KEY.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  let attempts = 0;
  const maxAttempts = 4;
  let delay = 3000;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: userPrompt }] }
          ],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.status === 429) {
        console.warn(`Gemini API returned 429 (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2.5;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const resData: any = await response.json();
      const content = resData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!content) throw new Error('Gemini API returned an empty completion.');

      const cleanJson = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleanJson);
    } catch (err: any) {
      console.error(`Attempt ${attempts} failed in callGemini:`, err.message);
      if (attempts >= maxAttempts) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
  throw new Error('AI summary failed after multiple retries.');
}

function buildContextPrompt(ctx: ContractContextForSummary): string {
  return `
Contract Name: ${ctx.contractName}
Contract Category: ${ctx.contractCategory}
Parties: ${ctx.parties.join(', ')}
Effective Date: ${ctx.effectiveDate || 'Not specified'}
Expiration Date: ${ctx.expirationDate || 'Not specified'}
Page Count: ${ctx.pageCount}

Extracted Clauses (${ctx.clauses.length}):
${ctx.clauses.map(c => `- [${c.clauseType}] Section ${c.sectionNumber} "${c.sectionTitle}": ${c.summary}`).join('\n')}

Missing Clauses: ${ctx.missingClauses.length === 0 ? 'None' : ctx.missingClauses.join(', ')}

Risk Analysis: ${
  ctx.riskAnalysis
    ? `Overall Score: ${ctx.riskAnalysis.overallRiskScore}/100, Level: ${ctx.riskAnalysis.riskLevel}
Top Issues: ${ctx.riskAnalysis.topIssues.map(i => `${i.title} (${i.severity}) — ${i.description}`).join('; ')}
Risk Breakdown: Financial=${ctx.riskAnalysis.riskBreakdown.Financial}, Legal=${ctx.riskAnalysis.riskBreakdown.Legal}, Operational=${ctx.riskAnalysis.riskBreakdown.Operational}, Reputational=${ctx.riskAnalysis.riskBreakdown.Reputational}`
    : 'Not yet computed.'
}
`.trim();
}

function deriveVendorCustomer(parties: string[]): { vendor: string; customer: string; otherParties: string[] } {
  if (!parties || parties.length === 0) {
    return { vendor: 'Vendor (Unspecified)', customer: 'Customer (Unspecified)', otherParties: [] };
  }
  if (parties.length === 1) {
    return { vendor: parties[0], customer: parties[0], otherParties: [] };
  }
  return { vendor: parties[0], customer: parties[1], otherParties: parties.slice(2) };
}

export async function generateExecutiveSummary(
  ctx: ContractContextForSummary
): Promise<ExecutiveSummaryData> {
  const parties = deriveVendorCustomer(ctx.parties);
  const systemPrompt = `You are a senior legal analyst writing a plain-English executive briefing for a CEO, founder, procurement manager, or non-lawyer executive.
${PLAIN_ENGLISH_RULE}
Generate a structured Executive Summary that answers:
 - What is this contract about?
 - Who are the parties and what are their roles?
 - What is the contract purpose?
 - What are the key commercial terms (payment, renewal, termination, IP)?
 - Who carries the risk and who benefits?
 - What are the major obligations of each party?
 - What standard protections are MISSING from the contract?
 - What are the top 3 negotiation points?
 - What is the overall risk assessment?
 - What are the recommended next steps?

Output ONLY a raw JSON object matching the schema below. No conversational text.
{
  "contractType": "short contract category, e.g. SaaS Agreement, NDA, Vendor Services",
  "contractPurpose": "1-2 sentence plain-English description of what this contract does and why it exists.",
  "duration": "e.g. 12 months, 3 years, perpetual, or 'Not specified'",
  "keyCommercialTerms": [
    { "label": "Payment Terms", "value": "Net 30 days from invoice" },
    { "label": "Renewal Terms", "value": "Auto-renews for successive 1-year terms unless 60 days notice" },
    { "label": "Termination Notice", "value": "30 days written notice" },
    { "label": "Service Commitments", "value": "99.9% uptime SLA" },
    { "label": "IP Ownership", "value": "Vendor retains background IP; deliverables assigned to customer upon payment" }
  ],
  "riskAllocation": "A 2-3 sentence plain-English explanation of who carries the financial, legal, and operational risk and why.",
  "importantObligations": {
    "vendor": ["plain-English bullet obligation 1", "obligation 2"],
    "customer": ["plain-English bullet obligation 1", "obligation 2"],
    "mutual": ["plain-English bullet obligation 1", "obligation 2"]
  },
  "missingProtections": [
    { "clauseType": "Force Majeure", "businessImpact": "Plain-English explanation of what business risk this creates for the customer." }
  ],
  "topNegotiationPoints": [
    {
      "title": "Concise issue title",
      "whyImportant": "Plain-English reason this matters to the business.",
      "potentialImpact": "Plain-English description of the worst-case outcome if unaddressed.",
      "severity": "High"
    }
  ],
  "recommendedNextSteps": [
    { "priority": "Immediate", "title": "Action title", "description": "Plain-English concrete next step." }
  ]
}
Use severity values: Low, Medium, High, Critical.
Use priority values: Immediate, High, Medium, Low.
Be concise. Each field should be tight — 1-3 sentences or a short bullet list.`;

  const userPrompt = `${buildContextPrompt(ctx)}

Parties (already identified):
- Vendor: ${parties.vendor}
- Customer: ${parties.customer}
${parties.otherParties.length > 0 ? `- Other Parties: ${parties.otherParties.join(', ')}` : ''}

Generate the Executive Summary JSON now.`;

  const json = await callGemini(systemPrompt, userPrompt);

  const overallRiskScore = ctx.riskAnalysis?.overallRiskScore ?? 0;
  const riskLevel = ctx.riskAnalysis?.riskLevel ?? 'Very Low';
  const riskBreakdown = ctx.riskAnalysis?.riskBreakdown ?? { Financial: 0, Legal: 0, Operational: 0, Reputational: 0 };

  return {
    contractName: ctx.contractName,
    contractType: String(json.contractType || ctx.contractCategory || 'Contract'),
    contractPurpose: String(json.contractPurpose || 'Not available.'),
    duration: String(json.duration || 'Not specified'),
    effectiveDate: ctx.effectiveDate,
    expirationDate: ctx.expirationDate,
    parties,
    keyCommercialTerms: Array.isArray(json.keyCommercialTerms) ? json.keyCommercialTerms.map((t: any) => ({
      label: String(t.label || 'Term'),
      value: String(t.value || 'Not specified')
    })) : [],
    riskAllocation: String(json.riskAllocation || 'Risk allocation not analyzed.'),
    importantObligations: {
      vendor: Array.isArray(json.importantObligations?.vendor) ? json.importantObligations.vendor.map((s: any) => String(s)) : [],
      customer: Array.isArray(json.importantObligations?.customer) ? json.importantObligations.customer.map((s: any) => String(s)) : [],
      mutual: Array.isArray(json.importantObligations?.mutual) ? json.importantObligations.mutual.map((s: any) => String(s)) : []
    },
    missingProtections: Array.isArray(json.missingProtections) ? json.missingProtections.map((m: any) => ({
      clauseType: String(m.clauseType || 'Unknown'),
      businessImpact: String(m.businessImpact || 'May create legal or business exposure.')
    })) : [],
    topNegotiationPoints: Array.isArray(json.topNegotiationPoints) ? json.topNegotiationPoints.slice(0, 3).map((n: any) => ({
      title: String(n.title || 'Issue'),
      whyImportant: String(n.whyImportant || ''),
      potentialImpact: String(n.potentialImpact || ''),
      severity: ['Low', 'Medium', 'High', 'Critical'].includes(n.severity) ? n.severity : 'Medium'
    })) : [],
    overallRiskScore,
    riskLevel,
    riskDistribution: riskBreakdown,
    recommendedNextSteps: Array.isArray(json.recommendedNextSteps) ? json.recommendedNextSteps.map((r: any) => ({
      priority: ['Immediate', 'High', 'Medium', 'Low'].includes(r.priority) ? r.priority : 'Medium',
      title: String(r.title || 'Action'),
      description: String(r.description || '')
    })) : [],
    generatedAt: new Date().toISOString()
  };
}

export async function generateBusinessSummary(
  ctx: ContractContextForSummary
): Promise<BusinessSummaryData> {
  const systemPrompt = `You are a procurement and commercial analyst writing a Business Summary for a non-legal stakeholder.
${PLAIN_ENGLISH_RULE}
Focus on commercial terms, financial impact, operational impact, and what the business is buying and committing to.
Be specific about money, time commitments, and the practical impact on daily operations.

Output ONLY a raw JSON object matching this schema:
{
  "businessPurpose": "1-2 sentence plain-English explanation of the business purpose of this contract.",
  "commercialFocus": "2-3 sentence plain-English summary of the most important commercial terms and what the company is paying for / committing to.",
  "paymentTerms": "Plain-English statement of how and when money changes hands (e.g. 'Net 30 from invoice, 50% upfront, etc.').",
  "renewalTerms": "Plain-English statement of how renewals work and what triggers automatic continuation.",
  "terminationNotice": "Plain-English statement of how either side can exit and on what notice.",
  "serviceCommitments": "Plain-English statement of any service levels, performance guarantees, or uptime commitments.",
  "ipOwnership": "Plain-English statement of who owns the intellectual property and any work product.",
  "financialRisk": "2-3 sentence plain-English explanation of the financial exposure (liability caps, indemnity scope, payment commitments).",
  "operationalImpact": "2-3 sentence plain-English explanation of how this contract will affect day-to-day operations, delivery, and risk management.",
  "keyBenefits": ["plain-English benefit 1", "benefit 2"],
  "keyConcerns": ["plain-English concern 1", "concern 2"]
}`;

  const userPrompt = `${buildContextPrompt(ctx)}\n\nGenerate the Business Summary JSON now.`;

  const json = await callGemini(systemPrompt, userPrompt);

  return {
    contractName: ctx.contractName,
    businessPurpose: String(json.businessPurpose || 'Not available.'),
    commercialFocus: String(json.commercialFocus || 'Not analyzed.'),
    paymentTerms: String(json.paymentTerms || 'Not specified'),
    renewalTerms: String(json.renewalTerms || 'Not specified'),
    terminationNotice: String(json.terminationNotice || 'Not specified'),
    serviceCommitments: String(json.serviceCommitments || 'Not specified'),
    ipOwnership: String(json.ipOwnership || 'Not specified'),
    financialRisk: String(json.financialRisk || 'Not analyzed.'),
    operationalImpact: String(json.operationalImpact || 'Not analyzed.'),
    keyBenefits: Array.isArray(json.keyBenefits) ? json.keyBenefits.map((s: any) => String(s)) : [],
    keyConcerns: Array.isArray(json.keyConcerns) ? json.keyConcerns.map((s: any) => String(s)) : [],
    generatedAt: new Date().toISOString()
  };
}

export async function generateLegalSummary(
  ctx: ContractContextForSummary
): Promise<LegalSummaryData> {
  const systemPrompt = `You are a legal counsel writing a clause-level Legal Summary for an internal legal team review.
The audience is legal-adjacent (paralegals, contract managers, junior counsel) and can handle clause-level references, but you should still be clear and concise.
${PLAIN_ENGLISH_RULE}

Output ONLY a raw JSON object matching this schema:
{
  "clauseLevelFindings": [
    {
      "clauseType": "Termination",
      "sectionNumber": "12.3",
      "finding": "Plain-English 1-2 sentence finding about how this clause is structured and whether it deviates from market standard.",
      "riskLevel": "High"
    }
  ],
  "indemnificationSummary": "Plain-English paragraph on what indemnity coverage exists, its scope, and any gaps.",
  "liabilitySummary": "Plain-English paragraph on liability cap, exclusions, and un-capped exposures.",
  "confidentialitySummary": "Plain-English paragraph on confidentiality scope, duration, and exceptions.",
  "ipSummary": "Plain-English paragraph on IP ownership, license grants, and assignment of deliverables.",
  "disputeResolutionSummary": "Plain-English paragraph on how disputes are resolved (litigation, arbitration, mediation).",
  "forceMajeureStatus": "Plain-English paragraph — either confirm force majeure is present and what it covers, or note that it is MISSING and what risk that creates.",
  "dataProtectionStatus": "Plain-English paragraph on data protection obligations and whether GDPR/CCPA or similar is referenced.",
  "governingLaw": "Plain-English statement of the governing law and jurisdiction.",
  "criticalLegalRisks": ["plain-English legal risk 1", "legal risk 2"]
}
Use riskLevel values: Very Low, Low, Moderate, High, Critical.`;

  const userPrompt = `${buildContextPrompt(ctx)}\n\nGenerate the Legal Summary JSON now.`;

  const json = await callGemini(systemPrompt, userPrompt);

  return {
    contractName: ctx.contractName,
    clauseLevelFindings: Array.isArray(json.clauseLevelFindings) ? json.clauseLevelFindings.map((f: any) => ({
      clauseType: String(f.clauseType || 'Unknown'),
      sectionNumber: String(f.sectionNumber || ''),
      finding: String(f.finding || ''),
      riskLevel: ['Very Low', 'Low', 'Moderate', 'High', 'Critical'].includes(f.riskLevel) ? f.riskLevel : 'Moderate'
    })) : [],
    indemnificationSummary: String(json.indemnificationSummary || 'No indemnity clause detected.'),
    liabilitySummary: String(json.liabilitySummary || 'No limitation of liability clause detected.'),
    confidentialitySummary: String(json.confidentialitySummary || 'No confidentiality clause detected.'),
    ipSummary: String(json.ipSummary || 'No IP clause detected.'),
    disputeResolutionSummary: String(json.disputeResolutionSummary || 'No dispute resolution clause detected.'),
    forceMajeureStatus: String(json.forceMajeureStatus || 'Force majeure status unknown.'),
    dataProtectionStatus: String(json.dataProtectionStatus || 'Data protection status unknown.'),
    governingLaw: String(json.governingLaw || 'Not specified.'),
    criticalLegalRisks: Array.isArray(json.criticalLegalRisks) ? json.criticalLegalRisks.map((s: any) => String(s)) : [],
    generatedAt: new Date().toISOString()
  };
}
