import type { TopIssue } from './contractTypes';

export interface DiffToken {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export interface ClauseComparisonDetail {
  contractId: string;
  contractName: string;
  clauseText: string;
  summary: string;
  riskScore: number;
  riskLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Critical';
  marketClassification: 'Favourable' | 'Neutral' | 'Unfavourable' | 'Unusual';
}

export interface ComparisonCategoryResult {
  explanation: string;
  businessImpact: string;
  riskImpact: string;
  similarityScore: number;
}

export interface UnusualClauseFinding {
  contractId: string;
  contractName: string;
  clauseType: string;
  explanation: string;
  whyUnusual: string;
}

export interface MultiContractComparisonResult {
  summary: {
    keyDifferences: string[];
    topRisks: string[];
    businessImpact: string[];
    negotiationConsiderations: string[];
  };
  categories: {
    [categoryKey: string]: ComparisonCategoryResult;
  };
  unusualClauses: UnusualClauseFinding[];
  overallSimilarityScores: {
    [contractIdPair: string]: number;
  };
}

export interface SectionDiff {
  title: string;
  sectionNumber: string;
  originalContent: string;
  revisedContent: string;
  diffs: DiffToken[];
  explanation: string;
}

export interface VersionComparisonResult {
  originalContractId: string;
  revisedContractId: string;
  diffSummary: {
    explanation: string;
    businessImpact: string;
    riskImpact: string;
    similarityScore: number;
  };
  sectionDiffs: SectionDiff[];
}

export interface RiskComparisonResult {
  overallScores: {
    [contractId: string]: {
      contractName: string;
      score: number;
      riskLevel: string;
    };
  };
  riskBreakdowns: {
    [contractId: string]: {
      Financial: number;
      Legal: number;
      Operational: number;
      Reputational: number;
    };
  };
  missingClauses: {
    [contractId: string]: string[];
  };
  criticalRisks: {
    [contractId: string]: TopIssue[];
  };
  aiExplanation: {
    deltaExplanation: string;
    businessImpact: string;
    practicalSignificance: string;
  };
}

export interface StoredComparison {
  comparisonId: string;
  userId: string;
  contractsCompared: {
    contractId: string;
    contractName: string;
  }[];
  comparisonType: 'contracts' | 'clauses' | 'versions' | 'risk';
  createdAt: string;
  results: any;
}
