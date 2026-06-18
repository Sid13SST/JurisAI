import { auth } from '../firebase/config';

const API_BASE = 'https://jurisai-feks.onrender.com/api/evaluation';

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be authenticated to access the evaluation terminal.');
  }
  return user.getIdToken();
}

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
    // Ignore non-JSON bodies
  }

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export interface EvaluationResult {
  evaluationId: string;
  testType: 'clauses' | 'risks' | 'summary' | 'market' | 'comparison';
  score: number;
  metrics: any;
  timestamp: string;
}

export async function fetchEvaluationResults(): Promise<EvaluationResult[]> {
  return request<EvaluationResult[]>('/results');
}

export async function runClauseEvaluation(): Promise<EvaluationResult> {
  return request<EvaluationResult>('/clauses', { method: 'POST' });
}

export async function runRiskEvaluation(): Promise<EvaluationResult> {
  return request<EvaluationResult>('/risks', { method: 'POST' });
}

export async function runSummaryEvaluation(): Promise<EvaluationResult> {
  return request<EvaluationResult>('/summary', { method: 'POST' });
}

export async function runMarketEvaluation(): Promise<EvaluationResult> {
  return request<EvaluationResult>('/market', { method: 'POST' });
}

export async function runComparisonEvaluation(): Promise<EvaluationResult> {
  return request<EvaluationResult>('/comparison', { method: 'POST' });
}

export async function logHumanFeedback(evaluatorType: string, answers: { q1: string; q2: string; q3: string; q4: string }): Promise<any> {
  return request<any>('/human', {
    method: 'POST',
    body: JSON.stringify({ evaluatorType, answers })
  });
}

export async function downloadPdfReport(): Promise<Blob> {
  const token = await getToken();
  const response = await fetch(`${API_BASE}/generate-report`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download evaluation report');
  }

  return response.blob();
}
