import { auth } from '../firebase/config';

const API_BASE = 'https://jurisai-feks.onrender.com/api';

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to use Copilot.');
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
    // ignore non-JSON bodies
  }

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export interface ComplianceAnalysis {
  complianceScore: number;
  classification: "Excellent" | "Good" | "Needs Review" | "Poor";
  presentProtections: string[];
  missingProtections: string[];
  weakProtections: Array<{ clause: string; reason: string }>;
  recommendedAdditions: string[];
}

export async function analyzeCompliance(contractType: string, contractText: string): Promise<ComplianceAnalysis> {
  return request<ComplianceAnalysis>('/compliance/analyze', {
    method: 'POST',
    body: JSON.stringify({ contractType, contractText })
  });
}

export interface NegotiationSuggestion {
  currentClause: string;
  riskExplanation: string;
  recommendation: string;
  suggestedRevision: string;
  expectedRiskReduction: string;
  priority: "Critical" | "High" | "Medium" | "Low";
}

export async function generateNegotiationSuggestions(clauses: string[]): Promise<{ suggestions: NegotiationSuggestion[] }> {
  return request<{ suggestions: NegotiationSuggestion[] }>('/negotiation/suggestions', {
    method: 'POST',
    body: JSON.stringify({ clauses })
  });
}

export async function generateClauseRewrite(missingClauseName: string, context?: string): Promise<{ suggestedClauseName: string; draftLanguage: string; label: string }> {
  return request<{ suggestedClauseName: string; draftLanguage: string; label: string }>('/negotiation/clause-rewrite', {
    method: 'POST',
    body: JSON.stringify({ missingClauseName, context })
  });
}

export interface LegalInsights {
  mostRiskyClause: { clause: string; reason: string };
  mostUnusualClause: { clause: string; reason: string };
  mostNegotiableClause: { clause: string; reason: string };
  mostFavorableClause: { clause: string; reason: string };
  mostProblematicSection: { section: string; reason: string };
}

export async function getLegalInsights(contractText: string): Promise<LegalInsights> {
  return request<LegalInsights>('/legal-insights', {
    method: 'POST',
    body: JSON.stringify({ contractText })
  });
}

export interface ReadinessScore {
  readinessScore: number;
  classification: "Ready to Sign" | "Needs Minor Review" | "Needs Legal Review" | "High Concern";
  topRecommendations: string[];
}

export async function calculateReadinessScore(complianceScore: number, riskScore: number, missingClausesCount: number, contractText?: string): Promise<ReadinessScore> {
  return request<ReadinessScore>('/readiness/score', {
    method: 'POST',
    body: JSON.stringify({ complianceScore, riskScore, missingClausesCount, contractText })
  });
}
