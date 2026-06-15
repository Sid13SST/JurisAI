/* Server-side mirror of frontend types.
 * These types are also defined in src/types/contractTypes.ts on the frontend.
 * Kept in sync manually — both files export the same shape. */

export type ContractStatus = 'uploaded' | 'processing' | 'parsed' | 'analysis_pending';
export type ContractCategory = 'NDA' | 'Employment' | 'Vendor' | 'Partnership' | 'SaaS' | 'DPA' | 'Other';

export interface StructuredSection {
  id: string;
  sectionNumber: string;
  title: string;
  content: string;
  level: number;
}

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
  summaryStatus?: 'idle' | 'generating' | 'completed' | 'failed';
  summaryGeneratedAt?: string;
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

export type SummaryType = 'executive' | 'business' | 'legal';

export interface ContractParties {
  vendor: string;
  customer: string;
  otherParties: string[];
}

export interface KeyCommercialTerm {
  label: string;
  value: string;
}

export interface NegotiationPoint {
  title: string;
  whyImportant: string;
  potentialImpact: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface MissingProtection {
  clauseType: string;
  businessImpact: string;
}

export interface RecommendedAction {
  priority: 'Immediate' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
}

export interface ExecutiveSummaryData {
  contractName: string;
  contractType: string;
  contractPurpose: string;
  duration: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  parties: ContractParties;
  keyCommercialTerms: KeyCommercialTerm[];
  riskAllocation: string;
  importantObligations: {
    vendor: string[];
    customer: string[];
    mutual: string[];
  };
  missingProtections: MissingProtection[];
  topNegotiationPoints: NegotiationPoint[];
  overallRiskScore: number;
  riskLevel: RiskAnalysis['riskLevel'];
  riskDistribution: {
    Financial: number;
    Legal: number;
    Operational: number;
    Reputational: number;
  };
  recommendedNextSteps: RecommendedAction[];
  generatedAt: string;
}

export interface BusinessSummaryData {
  contractName: string;
  businessPurpose: string;
  commercialFocus: string;
  paymentTerms: string;
  renewalTerms: string;
  terminationNotice: string;
  serviceCommitments: string;
  ipOwnership: string;
  financialRisk: string;
  operationalImpact: string;
  keyBenefits: string[];
  keyConcerns: string[];
  generatedAt: string;
}

export interface LegalSummaryData {
  contractName: string;
  clauseLevelFindings: {
    clauseType: string;
    sectionNumber: string;
    finding: string;
    riskLevel: RiskAnalysis['riskLevel'];
  }[];
  indemnificationSummary: string;
  liabilitySummary: string;
  confidentialitySummary: string;
  ipSummary: string;
  disputeResolutionSummary: string;
  forceMajeureStatus: string;
  dataProtectionStatus: string;
  governingLaw: string;
  criticalLegalRisks: string[];
  generatedAt: string;
}

export interface StoredSummary {
  summaryId: string;
  contractId: string;
  userId: string;
  summaryType: SummaryType;
  data: ExecutiveSummaryData | BusinessSummaryData | LegalSummaryData;
  generatedAt: string;
  modelUsed: string;
}

export type ReportFormat = 'pdf' | 'docx';
export type ReportType = 'executive' | 'business' | 'legal' | 'full';

export interface StoredReport {
  reportId: string;
  contractId: string;
  userId: string;
  reportType: ReportType;
  format: ReportFormat;
  generatedAt: string;
  fileName: string;
  contentBase64: string;
  contractName: string;
  summaryId?: string;
}
