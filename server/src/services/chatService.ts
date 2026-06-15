import dotenv from 'dotenv';
import { GroundedAnswer, ChatSource, HistoryTurn } from '../types/chatTypes';
import { RetrievedChunk } from './chatRetrievalService';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export const NO_ANSWER_TEXT =
  'The contract does not appear to contain information answering this question.';

const SYSTEM_PROMPT = `You are JurisAI, a legal document assistant. You answer questions strictly and only from the provided contract evidence (parsed sections, extracted clauses, risk findings, and metadata).

Rules:
- Answer ONLY using the supplied EVIDENCE. Never use outside/general legal knowledge.
- If the evidence does not contain the answer, set "answer" to EXACTLY: "${NO_ANSWER_TEXT}" and return an empty "sources" array with confidence 0.
- Never fabricate clauses, section numbers, figures, or legal conclusions.
- Cite the specific evidence items you used in "sources" (copy their sourceType, sourceRef, and title verbatim from the evidence; snippet = the short phrase from the evidence that supports your answer).
- "confidence" is an integer 0-100 reflecting how well the evidence supports the answer.
- Keep the answer clear, concise, and professional. Plain language, not legalese.
- Use prior conversation turns only to resolve references in follow-up questions (e.g. "it", "that clause"); still ground the answer in the evidence.

Output a raw JSON object and nothing else, matching:
{
  "answer": "string",
  "sources": [{ "sourceType": "section|clause|risk|metadata", "sourceRef": "string", "title": "string", "snippet": "string" }],
  "confidence": 0
}`;

/**
 * Generates a grounded answer for a question using the retrieved evidence chunks and
 * recent conversation history. Returns a structured GroundedAnswer.
 */
export async function answerQuestion(
  question: string,
  retrieved: RetrievedChunk[],
  history: HistoryTurn[] = []
): Promise<GroundedAnswer> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API Key. Please configure process.env.GEMINI_API_KEY.');
  }

  // Short-circuit: nothing retrieved -> canonical not-found answer, no LLM call.
  if (!retrieved || retrieved.length === 0) {
    return { answer: NO_ANSWER_TEXT, sources: [], confidence: 0 };
  }

  const evidenceText = retrieved
    .map((r, i) => {
      return `[Evidence ${i + 1}]
sourceType: ${r.chunk.sourceType}
sourceRef: ${r.chunk.sourceRef}
title: ${r.chunk.title}
content: ${r.chunk.content}`;
    })
    .join('\n\n');

  const historyText = history.length
    ? history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n')
    : '(none)';

  const userPrompt = `Recent conversation (for resolving follow-up references only):
${historyText}

EVIDENCE (the ONLY source of truth):
${evidenceText}

Current question: ${question}

Answer the question using only the evidence above. Respond with the required JSON object.`;

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
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      });

      if (response.status === 429) {
        console.warn(`Chat Gemini API returned 429 (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2.5;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat Gemini API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const resData = await response.json();
      const content = resData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!content) {
        throw new Error('Chat Gemini API returned an empty completion response.');
      }

      let parsed: any;
      try {
        const cleanJson = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch (parseErr: any) {
        console.error('Failed to parse chat JSON content. Content was:', content);
        throw new Error(`Invalid JSON format returned by chat model: ${parseErr.message}`);
      }

      return normalizeAnswer(parsed);
    } catch (err: any) {
      console.error(`Attempt ${attempts} failed in answerQuestion:`, err.message);
      if (attempts >= maxAttempts) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
  throw new Error('Chat answer generation failed after multiple retries due to Gemini API rate limits.');
}

/**
 * Coerces a raw model object into a safe GroundedAnswer.
 */
function normalizeAnswer(parsed: any): GroundedAnswer {
  const answer = typeof parsed?.answer === 'string' && parsed.answer.trim()
    ? parsed.answer.trim()
    : NO_ANSWER_TEXT;

  const isNoAnswer = answer === NO_ANSWER_TEXT;

  const rawSources = Array.isArray(parsed?.sources) ? parsed.sources : [];
  const sources: ChatSource[] = isNoAnswer
    ? []
    : rawSources
        .filter((s: any) => s && (s.sourceRef || s.title))
        .map((s: any) => ({
          sourceType: ['section', 'clause', 'risk', 'metadata'].includes(s.sourceType) ? s.sourceType : 'section',
          sourceRef: String(s.sourceRef ?? ''),
          title: String(s.title ?? ''),
          snippet: String(s.snippet ?? '')
        }));

  let confidence = typeof parsed?.confidence === 'number' ? Math.round(parsed.confidence) : 0;
  confidence = Math.min(Math.max(confidence, 0), 100);
  if (isNoAnswer) confidence = 0;

  return { answer, sources, confidence };
}
