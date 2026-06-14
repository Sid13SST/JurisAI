export interface StructuredSection {
  id: string;
  sectionNumber: string;
  title: string;
  content: string;
  level: number;
}

export type ContractStatus = 'uploaded' | 'processing' | 'parsed' | 'analysis_pending';

export type ContractCategory = 'NDA' | 'Employment' | 'Vendor' | 'Partnership' | 'SaaS' | 'DPA' | 'Other';

export interface Contract {
  contractId: string;
  userId: string;
  contractName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  storageUrl: string;
  status: ContractStatus;
  pageCount: number;
  wordCount: number;
  contractCategory: ContractCategory;
  parties: string[];
  effectiveDate: string | null;
  expirationDate: string | null;
  rawText?: string;
  structuredText?: StructuredSection[];
  analysisStatus?: 'analysis_pending' | 'analyzing' | 'completed' | 'failed';
  missingClauses?: string[];
  averageConfidence?: number;
  clauseCount?: number;
  riskAnalysisStatus?: 'idle' | 'analyzing' | 'completed' | 'failed';
  overallRiskScore?: number;
  riskLevel?: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface MarketComparison {
  contractValue: string;
  marketValue: string;
  classification: 'Favourable' | 'Neutral' | 'Unfavourable' | 'Unusual';
}

export interface ClauseRisk {
  clauseId: string;
  contractId: string;
  userId: string;
  clauseType: string;
  riskScore: number;
  riskCategory: 'Financial' | 'Legal' | 'Operational' | 'Reputational';
  riskLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Critical';
  reasoning: string;
  whyFlagged: string;
  potentialImpact: string;
  recommendedAction: string;
  priority: 'Low Priority' | 'Medium Priority' | 'High Priority' | 'Immediate Review';
  marketComparison: MarketComparison;
  createdAt: string;
}

export interface TopIssue {
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface RiskAnalysis {
  analysisId: string;
  contractId: string;
  userId: string;
  overallRiskScore: number;
  riskLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Critical';
  topIssues: TopIssue[];
  riskBreakdown: {
    Financial: number;
    Legal: number;
    Operational: number;
    Reputational: number;
  };
  createdAt: string;
}
