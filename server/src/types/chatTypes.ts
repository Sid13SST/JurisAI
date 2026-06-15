/**
 * Shared types for the AI Contract Chat (RAG) module.
 */

export type ChunkSourceType = 'section' | 'clause' | 'risk' | 'metadata';

/**
 * A unit of contract knowledge before embedding. Produced by chatRetrievalService.
 */
export interface KnowledgeChunk {
  sourceType: ChunkSourceType;
  sourceRef: string; // section number, clauseId, or 'overall'
  title: string;
  content: string;
}

/**
 * A KnowledgeChunk persisted to Firestore (collection: contractChunks) with its embedding.
 */
export interface ContractChunkDoc extends KnowledgeChunk {
  chunkId: string;
  contractId: string;
  userId: string;
  embedding: number[];
  createdAt: string;
}

/**
 * Citation attached to an assistant answer.
 */
export interface ChatSource {
  sourceType: ChunkSourceType;
  sourceRef: string;
  title: string;
  snippet: string;
}

export type ChatRole = 'user' | 'assistant';

/**
 * Firestore document: chatMessages
 */
export interface ChatMessageDoc {
  messageId: string;
  sessionId: string;
  contractId: string;
  userId: string;
  role: ChatRole;
  content: string;
  sources: ChatSource[];
  confidence: number; // 0-100
  timestamp: string;
}

/**
 * Firestore document: chatSessions
 */
export interface ChatSessionDoc {
  sessionId: string;
  contractId: string;
  userId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

/**
 * Result returned by chatService.answerQuestion.
 */
export interface GroundedAnswer {
  answer: string;
  sources: ChatSource[];
  confidence: number;
}

/**
 * Minimal history turn passed to the LLM for follow-up context.
 */
export interface HistoryTurn {
  role: ChatRole;
  content: string;
}
