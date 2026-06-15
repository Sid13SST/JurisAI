import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import {
  getFirestoreDoc,
  writeFirestoreDoc,
  updateFirestoreDoc,
  deleteFirestoreDoc,
  queryFirestoreCollection
} from '../utils/firestoreRest';
import { generateEmbedding, generateEmbeddingsBatch } from '../services/embeddingService';
import { buildKnowledgeChunks, retrieveTopK } from '../services/chatRetrievalService';
import { answerQuestion } from '../services/chatService';
import {
  ContractChunkDoc,
  ChatMessageDoc,
  ChatSessionDoc,
  HistoryTurn
} from '../types/chatTypes';

const TOP_K = 5;
const HISTORY_TURNS = 6;

/**
 * Decodes a Firebase ID Token manually (without network call) to extract the user's UID.
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

function getIdToken(req: Request): string {
  const authHeader = req.headers.authorization;
  return authHeader ? authHeader.split(' ')[1] : '';
}

/**
 * Loads a contract and verifies ownership. Returns the contract or null (with response sent).
 */
async function loadOwnedContract(
  contractId: string,
  uid: string,
  idToken: string,
  res: Response
): Promise<any | null> {
  const contract = await getFirestoreDoc('contracts', contractId, idToken);
  if (!contract) {
    res.status(404).json({ error: 'Contract record not found.' });
    return null;
  }
  if (contract.userId !== uid) {
    res.status(403).json({ error: 'Access denied. You do not own this contract.' });
    return null;
  }
  return contract;
}

/**
 * Builds and persists embedding chunks for a contract. Deletes stale chunks first.
 * Returns the number of chunks written.
 */
async function rebuildContractIndex(
  contract: any,
  contractId: string,
  uid: string,
  idToken: string
): Promise<number> {
  const clauses = await queryFirestoreCollection('clauses', 'contractId', contractId, idToken, { field: 'userId', value: uid });
  const clauseRisks = await queryFirestoreCollection('clauseRisk', 'contractId', contractId, idToken, { field: 'userId', value: uid });
  const riskAnalysis = await getFirestoreDoc('riskAnalysis', contractId, idToken);

  const knowledge = buildKnowledgeChunks(contract, clauses, clauseRisks, riskAnalysis);
  if (knowledge.length === 0) {
    return 0;
  }

  // Generate embeddings for all chunk contents in batches.
  const vectors = await generateEmbeddingsBatch(knowledge.map(k => k.content));

  // Delete stale chunks for this contract.
  const existing = await queryFirestoreCollection('contractChunks', 'contractId', contractId, idToken, { field: 'userId', value: uid });
  if (existing && existing.length > 0) {
    await Promise.all(existing.map(e => deleteFirestoreDoc('contractChunks', e.chunkId, idToken)));
  }

  // Write new chunk docs.
  const now = new Date().toISOString();
  const writes = knowledge.map((k, i) => {
    const chunkId = `${contractId}-${randomUUID()}`;
    const doc: ContractChunkDoc = {
      chunkId,
      contractId,
      userId: uid,
      sourceType: k.sourceType,
      sourceRef: k.sourceRef,
      title: k.title,
      content: k.content,
      embedding: vectors[i] || [],
      createdAt: now
    };
    return writeFirestoreDoc('contractChunks', chunkId, doc, idToken);
  });
  await Promise.all(writes);

  return knowledge.length;
}

/**
 * POST /api/chat/index/:contractId
 * Rebuilds the embedding index for a contract (idempotent).
 */
export const indexContract = async (req: Request, res: Response): Promise<void> => {
  const { contractId } = req.params;
  const uid = getUidFromRequest(req);
  const idToken = getIdToken(req);

  if (!contractId) {
    res.status(400).json({ error: 'Missing contractId parameter.' });
    return;
  }
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated (missing or invalid Bearer token).' });
    return;
  }

  try {
    const contract = await loadOwnedContract(contractId, uid, idToken, res);
    if (!contract) return;

    const count = await rebuildContractIndex(contract, contractId, uid, idToken);
    if (count === 0) {
      res.status(400).json({ error: 'No indexable content found. Parse the contract and run clause extraction first.' });
      return;
    }

    res.status(200).json({ message: 'Contract indexed successfully.', chunkCount: count });
  } catch (err: any) {
    console.error('Index contract failure:', err);
    res.status(500).json({ error: `Failed to index contract: ${err.message}` });
  }
};

/**
 * POST /api/chat/message
 * Body: { contractId, sessionId?, question, forceReindex? }
 * Retrieves evidence, generates a grounded answer, persists the turn, returns the answer.
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const { contractId, sessionId: incomingSessionId, question, forceReindex } = req.body;
  const uid = getUidFromRequest(req);
  const idToken = getIdToken(req);

  if (!contractId || !question || !String(question).trim()) {
    res.status(400).json({ error: 'Missing contractId or question.' });
    return;
  }
  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated (missing or invalid Bearer token).' });
    return;
  }

  try {
    const contract = await loadOwnedContract(contractId, uid, idToken, res);
    if (!contract) return;

    // Ensure an index exists (auto-build if empty or forced).
    let chunks: ContractChunkDoc[] = await queryFirestoreCollection(
      'contractChunks', 'contractId', contractId, idToken, { field: 'userId', value: uid }
    ) as ContractChunkDoc[];

    if (forceReindex || !chunks || chunks.length === 0) {
      const count = await rebuildContractIndex(contract, contractId, uid, idToken);
      if (count === 0) {
        res.status(400).json({ error: 'No contract content available to answer questions. Run clause extraction first.' });
        return;
      }
      chunks = await queryFirestoreCollection(
        'contractChunks', 'contractId', contractId, idToken, { field: 'userId', value: uid }
      ) as ContractChunkDoc[];
    }

    // Resolve or create the chat session.
    let sessionId: string = incomingSessionId || '';
    let session: any = null;
    if (sessionId) {
      session = await getFirestoreDoc('chatSessions', sessionId, idToken);
      if (session && session.userId !== uid) {
        res.status(403).json({ error: 'Access denied to this chat session.' });
        return;
      }
    }

    const now = new Date().toISOString();
    if (!session) {
      sessionId = sessionId || randomUUID();
      const sessionDoc: ChatSessionDoc = {
        sessionId,
        contractId,
        userId: uid,
        title: String(question).trim().slice(0, 80),
        createdAt: now,
        lastMessageAt: now
      };
      await writeFirestoreDoc('chatSessions', sessionId, sessionDoc, idToken);
    }

    // Load recent history for follow-up context (only for an existing session).
    let history: HistoryTurn[] = [];
    if (session) {
      const priorMessages = await queryFirestoreCollection(
        'chatMessages', 'sessionId', sessionId, idToken, { field: 'userId', value: uid }
      );
      priorMessages.sort((a: any, b: any) => String(a.timestamp).localeCompare(String(b.timestamp)));
      history = priorMessages
        .slice(-HISTORY_TURNS)
        .map((m: any) => ({ role: m.role, content: m.content }));
    }

    // Embed the query and retrieve top-K evidence.
    const queryEmbedding = await generateEmbedding(String(question));
    const retrieved = retrieveTopK(queryEmbedding, chunks, TOP_K);

    // Generate grounded answer.
    const grounded = await answerQuestion(String(question), retrieved, history);

    // Persist user + assistant messages.
    const userMsg: ChatMessageDoc = {
      messageId: randomUUID(),
      sessionId,
      contractId,
      userId: uid,
      role: 'user',
      content: String(question).trim(),
      sources: [],
      confidence: 0,
      timestamp: now
    };
    const assistantMsg: ChatMessageDoc = {
      messageId: randomUUID(),
      sessionId,
      contractId,
      userId: uid,
      role: 'assistant',
      content: grounded.answer,
      sources: grounded.sources,
      confidence: grounded.confidence,
      timestamp: new Date().toISOString()
    };

    await writeFirestoreDoc('chatMessages', userMsg.messageId, userMsg, idToken);
    await writeFirestoreDoc('chatMessages', assistantMsg.messageId, assistantMsg, idToken);
    await updateFirestoreDoc('chatSessions', sessionId, { lastMessageAt: assistantMsg.timestamp }, ['lastMessageAt'], idToken);

    res.status(200).json({
      sessionId,
      answer: grounded.answer,
      sources: grounded.sources,
      confidence: grounded.confidence
    });
  } catch (err: any) {
    console.error('Send message failure:', err);
    res.status(500).json({ error: `Failed to generate answer: ${err.message}` });
  }
};

/**
 * GET /api/chat/sessions/:contractId
 * Lists chat sessions for a contract owned by the user.
 */
export const listSessions = async (req: Request, res: Response): Promise<void> => {
  const { contractId } = req.params;
  const uid = getUidFromRequest(req);
  const idToken = getIdToken(req);

  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const sessions = await queryFirestoreCollection(
      'chatSessions', 'contractId', contractId, idToken, { field: 'userId', value: uid }
    );
    sessions.sort((a: any, b: any) => String(b.lastMessageAt).localeCompare(String(a.lastMessageAt)));
    res.status(200).json({ sessions });
  } catch (err: any) {
    console.error('List sessions failure:', err);
    res.status(500).json({ error: `Failed to list sessions: ${err.message}` });
  }
};

/**
 * GET /api/chat/messages/:sessionId
 * Lists messages for a session owned by the user, ordered oldest-first.
 */
export const listMessages = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const uid = getUidFromRequest(req);
  const idToken = getIdToken(req);

  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const messages = await queryFirestoreCollection(
      'chatMessages', 'sessionId', sessionId, idToken, { field: 'userId', value: uid }
    );
    messages.sort((a: any, b: any) => String(a.timestamp).localeCompare(String(b.timestamp)));
    res.status(200).json({ messages });
  } catch (err: any) {
    console.error('List messages failure:', err);
    res.status(500).json({ error: `Failed to list messages: ${err.message}` });
  }
};

/**
 * DELETE /api/chat/sessions/:sessionId
 * Deletes a session and all of its messages.
 */
export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const uid = getUidFromRequest(req);
  const idToken = getIdToken(req);

  if (!uid || !idToken) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const session = await getFirestoreDoc('chatSessions', sessionId, idToken);
    if (session && session.userId !== uid) {
      res.status(403).json({ error: 'Access denied to this chat session.' });
      return;
    }

    const messages = await queryFirestoreCollection(
      'chatMessages', 'sessionId', sessionId, idToken, { field: 'userId', value: uid }
    );
    if (messages && messages.length > 0) {
      await Promise.all(messages.map((m: any) => deleteFirestoreDoc('chatMessages', m.messageId, idToken)));
    }
    await deleteFirestoreDoc('chatSessions', sessionId, idToken);

    res.status(200).json({ message: 'Chat session deleted.' });
  } catch (err: any) {
    console.error('Delete session failure:', err);
    res.status(500).json({ error: `Failed to delete session: ${err.message}` });
  }
};
