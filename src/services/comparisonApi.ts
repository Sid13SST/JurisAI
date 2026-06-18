import { auth } from '../firebase/config';
import type { StoredComparison } from '../types/comparisonTypes';

const API_BASE = 'http://localhost:5001/api/comparison';

/**
 * Returns the current user's Firebase ID token, throwing if unauthenticated.
 */
async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to access the Comparison Suite.');
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

export async function compareContracts(params: { contractIds: string[] }): Promise<StoredComparison> {
  return request<StoredComparison>('/contracts', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function compareClauses(params: { contractIds: string[]; clauseType: string }): Promise<StoredComparison> {
  return request<StoredComparison>('/clauses', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function compareVersions(params: { originalContractId: string; revisedContractId: string }): Promise<StoredComparison> {
  return request<StoredComparison>('/versions', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function compareRisk(params: { contractIds: string[] }): Promise<StoredComparison> {
  return request<StoredComparison>('/risk', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function exportComparison(params: { comparisonId: string; format: 'pdf' | 'docx' }): Promise<{
  message: string;
  reportId: string;
  fileName: string;
  format: 'pdf' | 'docx';
  contentBase64: string;
  generatedAt: string;
}> {
  return request<any>('/export', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function getComparisonHistory(limit = 10, offset = 0): Promise<{ history: any[] }> {
  return request<{ history: any[] }>(`/history?limit=${limit}&offset=${offset}`);
}

export async function getComparisonById(comparisonId: string): Promise<StoredComparison> {
  return request<StoredComparison>(`/${comparisonId}`);
}
