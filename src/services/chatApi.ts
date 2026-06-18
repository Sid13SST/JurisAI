import { auth } from '../firebase/config';

const API_BASE = 'https://jurisai-feks.onrender.com/api/chat';

export type ChunkSourceType = 'section' | 'clause' | 'risk' | 'metadata';

export interface ChatSource {
  sourceType: ChunkSourceType;
  sourceRef: string;
  title: string;
  snippet: string;
}

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  contractId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSource[];
  confidence: number;
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  contractId: string;
  userId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface SendMessageResponse {
  sessionId: string;
  answer: string;
  sources: ChatSource[];
  confidence: number;
}

/**
 * Returns the current user's Firebase ID token, throwing if unauthenticated.
 */
async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to use the chat.');
  }
  return user.getIdToken();
}

/**
 * Wraps fetch with auth header + JSON parsing + friendly error extraction.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // ignore non-JSON bodies
  }

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function sendMessage(params: {
  contractId: string;
  question: string;
  sessionId?: string;
  forceReindex?: boolean;
}): Promise<SendMessageResponse> {
  return request<SendMessageResponse>('/message', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function reindexContract(contractId: string): Promise<{ chunkCount: number }> {
  return request<{ chunkCount: number }>(`/index/${contractId}`, { method: 'POST' });
}

export async function listSessions(contractId: string): Promise<ChatSession[]> {
  const data = await request<{ sessions: ChatSession[] }>(`/sessions/${contractId}`);
  return data.sessions || [];
}

export async function listMessages(sessionId: string): Promise<ChatMessage[]> {
  const data = await request<{ messages: ChatMessage[] }>(`/messages/${sessionId}`);
  return data.messages || [];
}

export async function deleteSession(sessionId: string): Promise<void> {
  await request(`/sessions/${sessionId}`, { method: 'DELETE' });
}
