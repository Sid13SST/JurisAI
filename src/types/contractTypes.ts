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
}
