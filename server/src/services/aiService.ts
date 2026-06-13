import dotenv from 'dotenv';

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
