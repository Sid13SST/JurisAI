import dotenv from 'dotenv';
import { TopIssue } from '../types/contractTypes';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export interface ExtractedClauseRaw {
  clauseType: string;
  sectionNumber: string;
  title: string;
  confidence: number;
  text: string;
  summary: string;
  keywords: string[];
}

/**
 * Validates if a string is a supported clause type
 */
const SUPPORTED_CLAUSE_TYPES = [
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
 * Sends a contract text chunk to Gemini REST API to analyze and extract clauses
 */
export async function analyzeTextChunk(chunkText: string, chunkInfo: string): Promise<ExtractedClauseRaw[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API Key. Please configure process.env.GEMINI_API_KEY.');
  }

  const systemPrompt = `You are an expert legal AI assistant specializing in contract clause extraction and document layout analysis.
Your task is to analyze the provided contract text chunk and extract any of the following supported legal clauses if present:
1. Indemnity
2. Limitation of Liability
3. Governing Law
4. Termination
5. Confidentiality
6. Intellectual Property
7. Payment Terms
8. Force Majeure
9. Dispute Resolution
10. Data Protection
11. Non-Compete
12. Assignment
13. Warranty
14. Audit Rights
15. Insurance

For every clause found, you MUST return a structured object with:
- clauseType: Must be EXACTLY one of the 15 supported clause types listed above (case-sensitive). Do not return any other category.
- sectionNumber: The exact section, clause, or paragraph number from the text (e.g. "12.3", "4(a)", or empty if none).
- title: The title/heading of the section (e.g. "Termination for Cause", "Limitation of Damages", or empty if none).
- confidence: An integer between 0 and 100 indicating your confidence score (95+ for Strong Match, 70-90 for Probable Match, 50-69 for Weak Match).
- text: The exact verbatim text of the clause extracted from the contract.
- summary: A concise, clear summary of the clause's provisions and legal impact.
- keywords: An array of 3-5 relevant lowercase search keywords (e.g. ["termination", "notice", "breach"]).

You must output a raw JSON object and nothing else. Do NOT write any conversational text.
Your response must match the following JSON schema:
{
  "clauses": [
    {
      "clauseType": "Termination",
      "sectionNumber": "12.3",
      "title": "Termination Rights",
      "confidence": 96,
      "text": "...",
      "summary": "...",
      "keywords": ["termination", "notice", "breach"]
    }
  ]
}`;

  const userPrompt = `Contract Chunk Context: ${chunkInfo}

[Contract Chunk Text Start]
${chunkText}
[Contract Chunk Text End]

Extract all relevant clauses. If no clauses from the 15 supported types are found in this chunk, return an empty array for "clauses".`;

  let attempts = 0;
  const maxAttempts = 4;
  let delay = 3000;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: userPrompt
                }
              ]
            }
          ],
          systemInstruction: {
            parts: [
              {
                text: systemPrompt
              }
            ]
          },
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.status === 429) {
        console.warn(`Gemini API returned 429 (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2.5; // Backoff multiplier
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const resData = await response.json();
      const content = resData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!content) {
        throw new Error('Gemini API returned an empty completion response.');
      }

      let jsonResult;
      try {
        const cleanJson = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        jsonResult = JSON.parse(cleanJson);
      } catch (parseErr: any) {
        console.error('Failed to parse Gemini API JSON content. Content was:', content);
        throw new Error(`Invalid JSON format returned by Gemini model: ${parseErr.message}`);
      }

      const clauses: ExtractedClauseRaw[] = jsonResult.clauses || [];

      const validatedClauses = clauses.filter(c => {
        const isValidType = SUPPORTED_CLAUSE_TYPES.includes(c.clauseType);
        const hasText = !!c.text && c.text.trim().length > 10;
        return isValidType && hasText;
      }).map(c => ({
        clauseType: c.clauseType,
        sectionNumber: c.sectionNumber ? String(c.sectionNumber).trim() : '',
        title: c.title ? String(c.title).trim() : 'Section',
        confidence: typeof c.confidence === 'number' ? Math.min(Math.max(c.confidence, 0), 100) : 80,
        text: c.text.trim(),
        summary: c.summary ? c.summary.trim() : '',
        keywords: Array.isArray(c.keywords) ? c.keywords.map(k => String(k).toLowerCase().trim()) : []
      }));

      return validatedClauses;

    } catch (err: any) {
      console.error(`Attempt ${attempts} failed in analyzeTextChunk:`, err.message);
      if (attempts >= maxAttempts) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
  throw new Error('AI analysis failed after multiple retries due to Gemini API rate limits.');
}

export interface ClauseForAnalysis {
  clauseId: string;
  clauseType: string;
  sectionNumber: string;
  sectionTitle: string;
  summary: string;
  fullText: string;
}

export interface ClauseRiskAnalysisResult {
  clauseId: string;
  clauseType: string;
  riskScore: number;
  riskCategory: 'Financial' | 'Legal' | 'Operational' | 'Reputational';
  riskLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Critical';
  reasoning: string;
  whyFlagged: string;
  potentialImpact: string;
  recommendedAction: string;
  priority: 'Low Priority' | 'Medium Priority' | 'High Priority' | 'Immediate Review';
  marketComparison: {
    contractValue: string;
    marketValue: string;
    classification: 'Favourable' | 'Neutral' | 'Unfavourable' | 'Unusual';
  };
}

export interface ContractRiskAnalysisResult {
  clauses: ClauseRiskAnalysisResult[];
  overallRiskScore: number;
  riskLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Critical';
  topIssues: {
    title: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
  }[];
  riskBreakdown: {
    Financial: number;
    Legal: number;
    Operational: number;
    Reputational: number;
  };
}

/**
 * Analyzes clauses and missing clauses against market standard baselines to produce risk reports
 */
export async function analyzeClauseRisks(
  clauses: ClauseForAnalysis[],
  missingClauses: string[],
  marketBaselines: Record<string, { marketValue: string; standardDescription: string }>
): Promise<ContractRiskAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API Key. Please configure process.env.GEMINI_API_KEY.');
  }

  const systemPrompt = `You are a premium AI legal analyst specializing in contract risk assessment and market standard compliance.
Analyze the provided extracted clauses of a contract against a set of market-standard baselines.
Also evaluate the impact of missing contract clauses (if any) on the overall risk.

For EVERY clause provided in the list:
1. Compare it to the market baseline provided for its clause type.
2. Determine:
   - riskScore: An integer between 0 and 100 representing the risk severity (0-20 Very Low, 21-40 Low, 41-60 Moderate, 61-80 High, 81-100 Critical).
   - riskCategory: Must be exactly one of: Financial, Legal, Operational, Reputational.
   - riskLevel: Must be exactly one of: Very Low, Low, Moderate, High, Critical.
   - reasoning: A clean, concise summary of the risk finding.
   - whyFlagged: Specifically why this was flagged as a risk, written in clear, plain language (avoid legalese).
   - potentialImpact: The potential real-world legal, financial, or operational impact of this clause on the party.
   - recommendedAction: What concrete action should be taken during review/negotiation (e.g., renegotiate, delete, modify).
   - priority: Must be exactly one of: Low Priority, Medium Priority, High Priority, Immediate Review.
   - marketComparison:
     * contractValue: A brief summary of what the contract currently states for this clause (e.g., "Uncapped", "15 days notice", "Mutual").
     * marketValue: The baseline standard value provided in the rules.
     * classification: Must be exactly one of: Favourable, Neutral, Unfavourable, Unusual.

Also compute the following overall contract level risk metrics:
1. overallRiskScore: An integer (0 - 100) calculated by weighting high-risk clauses, missing clauses (e.g., missing Limitation of Liability, Indemnity, or Force Majeure increases overall risk), and general risk distribution.
2. riskLevel: Overall risk level (Very Low, Low, Moderate, High, Critical).
3. topIssues: Identify the Top 3 most important legal/financial issues (could be specific high-risk clauses or critical missing clauses). Each issue must have a title, description, and severity (Low, Medium, High, Critical).
4. riskBreakdown: A score (0-100) for each of the four categories: Financial, Legal, Operational, Reputational representing the average or maximum risk intensity in that category.

You must output a raw JSON object and nothing else. Do NOT write any conversational text.
Your response must match the following JSON schema:
{
  "clauses": [
    {
      "clauseId": "string",
      "clauseType": "string",
      "riskScore": 88,
      "riskCategory": "Financial",
      "riskLevel": "High",
      "reasoning": "...",
      "whyFlagged": "...",
      "potentialImpact": "...",
      "recommendedAction": "...",
      "priority": "Immediate Review",
      "marketComparison": {
        "contractValue": "...",
        "marketValue": "...",
        "classification": "Unfavourable"
      }
    }
  ],
  "overallRiskScore": 82,
  "riskLevel": "High",
  "topIssues": [
    {
      "title": "Unlimited Liability Exposure",
      "description": "...",
      "severity": "Critical"
    }
  ],
  "riskBreakdown": {
    "Financial": 80,
    "Legal": 60,
    "Operational": 40,
    "Reputational": 20
  }
}`;

  const userPrompt = `Extracted Clauses for Analysis:
${JSON.stringify(clauses, null, 2)}

Missing Expected Clauses:
${JSON.stringify(missingClauses, null, 2)}

Market Baseline Library:
${JSON.stringify(marketBaselines, null, 2)}

Please perform the complete risk assessment and market standard comparison. Ensure every clause in the input list is analyzed and returned in the "clauses" array of the JSON response with the exact same clauseId.`;

  let attempts = 0;
  const maxAttempts = 4;
  let delay = 3000;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: userPrompt
                }
              ]
            }
          ],
          systemInstruction: {
            parts: [
              {
                text: systemPrompt
              }
            ]
          },
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.status === 429) {
        console.warn(`Gemini API returned 429 in analyzeClauseRisks (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2.5;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const resData = await response.json();
      const content = resData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!content) {
        throw new Error('Gemini API returned an empty completion response.');
      }

      let jsonResult: ContractRiskAnalysisResult;
      try {
        const cleanJson = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        jsonResult = JSON.parse(cleanJson);
      } catch (parseErr: any) {
        console.error('Failed to parse Gemini API JSON content. Content was:', content);
        throw new Error(`Invalid JSON format returned by Gemini model: ${parseErr.message}`);
      }

      // Validate structure
      if (typeof jsonResult.overallRiskScore !== 'number' || !jsonResult.clauses || !Array.isArray(jsonResult.clauses)) {
        throw new Error('Malformed JSON schema: missing overallRiskScore or clauses array.');
      }

      return jsonResult;

    } catch (err: any) {
      console.error(`Attempt ${attempts} failed in analyzeClauseRisks:`, err.message);
      if (attempts >= maxAttempts) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
  throw new Error('AI risk analysis failed after multiple retries due to Gemini API rate limits.');
}

/**
 * Reusable helper to send prompts to the Gemini API and handle retries/backoff
 */
async function callGemini(systemPrompt: string, userPrompt: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API Key. Please configure process.env.GEMINI_API_KEY.');
  }

  const maxAttempts = 4;
  let attempts = 0;
  let delay = 3000;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: userPrompt
                }
              ]
            }
          ],
          systemInstruction: {
            parts: [
              {
                text: systemPrompt
              }
            ]
          },
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.status === 429) {
        console.warn(`Gemini API returned 429 in callGemini (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2.5;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const resData = await response.json();
      const content = resData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!content) {
        throw new Error('Gemini API returned an empty completion response.');
      }

      const cleanJson = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleanJson);

    } catch (err: any) {
      console.error(`Attempt ${attempts} failed in callGemini:`, err.message);
      if (attempts >= maxAttempts) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
  throw new Error('AI request failed after multiple retries due to Gemini API rate limits.');
}

/**
 * AI Compare multiple contracts based on clause summaries and risk scores to save tokens
 */
export async function compareContractsAI(
  contracts: {
    id: string;
    name: string;
    clauses: {
      clauseType: string;
      summary: string;
      riskScore: number;
      marketClassification: string;
    }[];
  }[]
): Promise<any> {
  const systemPrompt = `You are an expert legal AI assistant specializing in comparative contract analysis.
Compare the clauses and risk profiles of multiple contracts based on their summaries and risk scores.
Produce a side-by-side comparison explaining the differences, business impact, and risk impact of the main categories (Termination, Limitation of Liability, Indemnity, Confidentiality, Intellectual Property, Payment Terms, Force Majeure, Data Protection, Dispute Resolution).
Also identify any "unusual clauses" (e.g. clauses that appear only in one contract, or are significantly different/out-of-line with market norms).
Additionally, estimate the semantic similarity percentage (0-100) for each compared category between agreements, and the overall pairwise contract similarity scores (keys formatted like "contractId1_contractId2").

You must output a raw JSON object and nothing else. Do NOT write any conversational text.
Your response must match the following JSON schema:
{
  "summary": {
    "keyDifferences": ["string"],
    "topRisks": ["string"],
    "businessImpact": ["string"],
    "negotiationConsiderations": ["string"]
  },
  "categories": {
    "CategoryName": {
      "explanation": "string",
      "businessImpact": "string",
      "riskImpact": "string",
      "similarityScore": 85
    }
  },
  "unusualClauses": [
    {
      "contractId": "string",
      "contractName": "string",
      "clauseType": "string",
      "explanation": "...",
      "whyUnusual": "..."
    }
  ],
  "overallSimilarityScores": {
    "contractId1_contractId2": 80
  }
}`;

  const userPrompt = `Contracts to Compare:
${JSON.stringify(contracts, null, 2)}

Please perform the complete side-by-side comparison analysis and return the structured JSON results.`;

  return callGemini(systemPrompt, userPrompt);
}

/**
 * AI Compare specific clause types across multiple contracts
 */
export async function compareSpecificClausesAI(
  clauseType: string,
  clauses: {
    contractName: string;
    summary: string;
    riskScore: number;
    classification: string;
  }[]
): Promise<{ explanation: string; businessImpact: string; riskImpact: string; similarityScore: number }> {
  const systemPrompt = `You are a premium legal AI assistant.
Compare the variations of a single clause type (${clauseType}) across multiple contracts.
Explain the differences in wording and scope, describe the business implications of these differences, and assess the risk changes. Also provide a visual similarity score (0 to 100) representing how close these clauses are semantically.

You must output a raw JSON object matching this schema:
{
  "explanation": "string",
  "businessImpact": "string",
  "riskImpact": "string",
  "similarityScore": 75
}`;

  const userPrompt = `Clause Type: ${clauseType}
Clauses across contracts:
${JSON.stringify(clauses, null, 2)}`;

  return callGemini(systemPrompt, userPrompt);
}

/**
 * AI Explain the differences between matched section pairs of an original and revised contract
 */
export async function explainVersionChangesAI(
  matchedSections: {
    title: string;
    originalContent: string;
    revisedContent: string;
  }[]
): Promise<{
  diffSummary: { explanation: string; businessImpact: string; riskImpact: string; similarityScore: number };
  sectionExplanations: { title: string; explanation: string }[];
}> {
  const systemPrompt = `You are a professional legal AI assistant.
Analyze the matched text changes between an original and revised version of a contract.
Explain what protections were removed, what risks were introduced, and the business/operational impacts of these changes.
For each matched section, provide a concise explanation of the changes.

You must output a raw JSON object matching this schema:
{
  "diffSummary": {
    "explanation": "string",
    "businessImpact": "string",
    "riskImpact": "string",
    "similarityScore": 80
  },
  "sectionExplanations": [
    {
      "title": "string",
      "explanation": "string"
    }
  ]
}`;

  const userPrompt = `Aligned sections of original and revised contracts:
${JSON.stringify(matchedSections, null, 2)}`;

  return callGemini(systemPrompt, userPrompt);
}

/**
 * AI Explain risk variations, delta and Top Issues differences
 */
export async function compareRiskAI(
  contracts: {
    name: string;
    overallRiskScore: number;
    riskLevel: string;
    riskBreakdown: {
      Financial: number;
      Legal: number;
      Operational: number;
      Reputational: number;
    };
    topIssues: TopIssue[];
  }[]
): Promise<{ deltaExplanation: string; businessImpact: string; practicalSignificance: string }> {
  const systemPrompt = `You are a premium AI risk management analyst.
Compare the risk profiles, overall scores, and top issues of these contracts.
Provide a clear analysis of the risk delta, explanation of what the score difference means in practical business terms, and the business impact.

You must output a raw JSON object matching this schema:
{
  "deltaExplanation": "string",
  "businessImpact": "string",
  "practicalSignificance": "string"
}`;

  const userPrompt = `Contracts Risk Data to Compare:
${JSON.stringify(contracts, null, 2)}`;

  return callGemini(systemPrompt, userPrompt);
}

