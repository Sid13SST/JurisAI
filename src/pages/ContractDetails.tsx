import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Download,
  Trash2,
  Sparkles,
  RefreshCw,
  Edit3,
  List,
  Layers,
  FileCheck,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Play,
  AlertCircle,
  CheckCircle2,
  Search,
  ArrowUpRight,
  ShieldAlert,
  Copy,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { PageContainer } from '../components/layout/PageContainer';
import { ChatPanel } from '../components/chat/ChatPanel';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Contract } from '../types/contractTypes';
import { SummaryTab } from '../components/contracts/SummaryTab';

interface ClauseDoc {
  clauseId: string;
  contractId: string;
  userId: string;
  clauseType: string;
  sectionNumber: string;
  sectionTitle: string;
  confidence: number;
  summary: string;
  keywords: string[];
  fullText: string;
  createdAt: string;
}

interface AnalysisChunkItem {
  id: string;
  chunkIndex: number;
  text: string;
  info: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  error: string | null;
  clauses: any[];
}

const REQUIRED_CLAUSE_TYPES = [
  'Indemnity',
  'Limitation of Liability',
  'Governing Law',
  'Termination',
  'Confidentiality',
  'Intellectual Property',
  'Payment Terms',
  'Force Majeure',
  'Dispute Resolution',
  'Data Protection',
  'Non-Compete',
  'Assignment',
  'Warranty',
  'Audit Rights',
  'Insurance'
];

export const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Tab: 'viewer' | 'ai' | 'risk' | 'summary' | 'chat'
  const [activeTab, setActiveTab] = useState<'viewer' | 'ai' | 'risk' | 'summary' | 'chat'>('viewer');

  // Outline/TOC filtering
  const [outlineSearch, setOutlineSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [collapsedReaderSections, setCollapsedReaderSections] = useState<Record<string, boolean>>({});

  // Editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editedCategory, setEditedCategory] = useState('');

  // AI Queue Orchestration States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisChunks, setAnalysisChunks] = useState<AnalysisChunkItem[]>([]);

  // Clauses list synced from Firestore
  const [clauses, setClauses] = useState<ClauseDoc[]>([]);

  // Risk Analysis and Clause Risk synced from Firestore
  const [riskAnalysis, setRiskAnalysis] = useState<any | null>(null);
  const [clauseRisks, setClauseRisks] = useState<any[]>([]);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);
  const [riskAnalysisError, setRiskAnalysisError] = useState<string | null>(null);

  // Filters for Risk and Compliance Tab
  const [riskSearch, setRiskSearch] = useState('');
  const [filterRiskLevel, setFilterRiskLevel] = useState('all');
  const [filterRiskCategory, setFilterRiskCategory] = useState('all');
  const [filterClauseTypeRisk, setFilterClauseTypeRisk] = useState('all');
  const [filterReviewPriority, setFilterReviewPriority] = useState('all');
  const [expandedRiskClauses, setExpandedRiskClauses] = useState<Record<string, boolean>>({});

  // Clause Workspace Search/Filter States
  const [clauseSearch, setClauseSearch] = useState('');
  const [filterClauseType, setFilterClauseType] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showMissingToggle, setShowMissingToggle] = useState(false);
  const [expandedClauses, setExpandedClauses] = useState<Record<string, boolean>>({});

  // Reader ref for scrolling
  const readerContainerRef = useRef<HTMLDivElement>(null);

  const toggleSection = (secId: string) => {
    setCollapsedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const toggleReaderSection = (secId: string) => {
    setCollapsedReaderSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const toggleClauseExpand = (clauseId: string) => {
    setExpandedClauses(prev => ({ ...prev, [clauseId]: !prev[clauseId] }));
  };

  // Sync Contract Record
  useEffect(() => {
    if (!id || !currentUser) return;

    const docRef = doc(db, 'contracts', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Contract;
        setContract(data);
        setEditedName(data.contractName);
        setEditedCategory(data.contractCategory);
      } else {
        showToast('Document not found in database.', 'error');
        navigate('/contracts');
      }
      setLoading(false);
    }, (err) => {
      console.error('Error loading contract details:', err);
      showToast('Error syncing contract workspace.', 'error');
      setLoading(false);
    });

    return unsubscribe;
  }, [id, currentUser, navigate, showToast]);

  // Sync Clauses list
  useEffect(() => {
    if (!id || !currentUser) return;

    const q = query(
      collection(db, 'clauses'),
      where('contractId', '==', id),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clausesList: ClauseDoc[] = [];
      snapshot.forEach((doc) => {
        clausesList.push(doc.data() as ClauseDoc);
      });

      // Sort clauses by section number or type
      clausesList.sort((a, b) => {
        const aSec = a.sectionNumber || '';
        const bSec = b.sectionNumber || '';
        return aSec.localeCompare(bSec, undefined, { numeric: true, sensitivity: 'base' }) || a.clauseType.localeCompare(b.clauseType);
      });

      setClauses(clausesList);
    }, (err) => {
      console.error('Error fetching clauses:', err);
    });

    return unsubscribe;
  }, [id, currentUser]);

  // Sync Risk Analysis
  useEffect(() => {
    if (!id || !currentUser) return;

    const docRef = doc(db, 'riskAnalysis', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setRiskAnalysis(docSnap.data());
      } else {
        setRiskAnalysis(null);
      }
    }, (err) => {
      console.error('Error loading risk analysis:', err);
    });

    return unsubscribe;
  }, [id, currentUser]);

  // Sync Clause Risks
  useEffect(() => {
    if (!id || !currentUser) return;

    const q = query(
      collection(db, 'clauseRisk'),
      where('contractId', '==', id),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const risksList: any[] = [];
      snapshot.forEach((doc) => {
        risksList.push(doc.data());
      });
      setClauseRisks(risksList);
    }, (err) => {
      console.error('Error loading clause risks:', err);
    });

    return unsubscribe;
  }, [id, currentUser]);

  const handleRename = async () => {
    if (!id || !editedName.trim()) return;
    try {
      const docRef = doc(db, 'contracts', id);
      await updateDoc(docRef, { contractName: editedName.trim() });
      showToast('Contract title updated successfully.', 'success');
      setIsEditingName(false);
    } catch (err) {
      showToast('Failed to update contract name.', 'error');
    }
  };

  const handleCategoryChange = async (cat: string) => {
    if (!id) return;
    try {
      const docRef = doc(db, 'contracts', id);
      await updateDoc(docRef, { contractCategory: cat });
      showToast('Category updated.', 'success');
      setIsEditingCategory(false);
    } catch (err) {
      showToast('Failed to update category.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!id || !currentUser) return;
    setIsDeleting(true);
    try {
      // 1. Delete Firestore Document directly from client
      const docRef = doc(db, 'contracts', id);
      await deleteDoc(docRef);

      // 2. Trigger local backend file deletion cleanup
      await fetch(`http://localhost:5001/api/contracts/${currentUser.uid}/${id}`, {
        method: 'DELETE'
      });

      showToast('Document successfully purged.', 'success');
      navigate('/contracts');
    } catch (err: any) {
      showToast(err.message || 'Purge failed.', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleReparse = async () => {
    if (!id || !currentUser) return;
    setLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('http://localhost:5001/api/contracts/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ contractId: id })
      });

      if (!response.ok) {
        throw new Error('Reparsing endpoint failed.');
      }
      showToast('Parsing successfully re-triggered.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Parsing failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Client-Orchestrated AI Queue & Retry Mechanics
  const startOrResumeAnalysis = async (startFresh = false) => {
    if (!contract || !currentUser) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setActiveTab('ai');

    try {
      const idToken = await currentUser.getIdToken();
      let currentChunks = [...analysisChunks];

      // 1. Get or generate chunks
      if (startFresh || currentChunks.length === 0) {
        const chunkRes = await fetch('http://localhost:5001/api/ai/chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ structuredText: contract.structuredText || [] })
        });
        if (!chunkRes.ok) throw new Error('Failed to partition document text.');
        const { chunks } = await chunkRes.json();

        currentChunks = chunks.map((chunk: any) => ({
          id: chunk.id,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          info: chunk.info,
          status: 'pending' as const,
          error: null as string | null,
          clauses: [] as any[]
        }));
        setAnalysisChunks(currentChunks);
      } else {
        // Reset failed chunks to pending for resumes
        currentChunks = currentChunks.map(c => 
          c.status === 'failed' ? { ...c, status: 'pending' as const, error: null } : c
        );
        setAnalysisChunks(currentChunks);
      }

      // Update firestore contract status to analyzing
      const docRef = doc(db, 'contracts', contract.contractId);
      await updateDoc(docRef, { analysisStatus: 'analyzing' });

      // Worker function to analyze a single chunk
      const analyzeSingleChunk = async (chunkId: string) => {
        setAnalysisChunks(prev => prev.map(c => c.id === chunkId ? { ...c, status: 'analyzing' as const, error: null } : c));
        
        const chunkItem = currentChunks.find(c => c.id === chunkId)!;
        try {
          const res = await fetch('http://localhost:5001/api/ai/analyze-chunk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ chunkText: chunkItem.text, chunkInfo: chunkItem.info })
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'OpenRouter chunk extraction failure.');
          }
          const { clauses: extractedClauses } = await res.json();

          setAnalysisChunks(prev => prev.map(c => c.id === chunkId ? { ...c, status: 'completed' as const, clauses: extractedClauses } : c));
          return extractedClauses;
        } catch (err: any) {
          setAnalysisChunks(prev => prev.map(c => c.id === chunkId ? { ...c, status: 'failed' as const, error: err.message } : c));
          throw err;
        }
      };

      // Process queue with concurrency MAX_PARALLEL_CHUNKS=3
      const queue = currentChunks.filter(c => c.status !== 'completed');
      let failedAny = false;

      const worker = async () => {
        while (queue.length > 0 && !failedAny) {
          const nextChunk = queue.shift();
          if (!nextChunk) break;
          try {
            await analyzeSingleChunk(nextChunk.id);
          } catch (err) {
            failedAny = true;
          }
        }
      };

      // Launch parallel workers
      const workers = Array.from({ length: Math.min(3, queue.length) }, () => worker());
      await Promise.all(workers);

      // Inspect final snapshot of states
      setAnalysisChunks(latestChunks => {
        const allCompleted = latestChunks.every(c => c.status === 'completed');
        const anyFailed = latestChunks.some(c => c.status === 'failed');

        if (allCompleted) {
          const aggregated = latestChunks.reduce((acc, c) => [...acc, ...c.clauses], [] as any[]);
          finalizePipeline(aggregated);
        } else if (anyFailed) {
          setIsAnalyzing(false);
          setAnalysisError('One or more document chunks failed. Please review errors and click Retry.');
        }
        return latestChunks;
      });

    } catch (err: any) {
      console.error('Queue execution failed:', err);
      setAnalysisError(err.message || 'Queue execution failed.');
      setIsAnalyzing(false);
      const docRef = doc(db, 'contracts', contract.contractId);
      await updateDoc(docRef, { analysisStatus: 'failed' });
      showToast(err.message || 'Queue execution encountered an error.', 'error');
    }
  };

  const retrySingleChunk = async (chunkId: string) => {
    if (!contract || !currentUser) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const idToken = await currentUser.getIdToken();
      setAnalysisChunks(prev => prev.map(c => c.id === chunkId ? { ...c, status: 'analyzing' as const, error: null } : c));

      const chunkItem = analysisChunks.find(c => c.id === chunkId)!;
      const res = await fetch('http://localhost:5001/api/ai/analyze-chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ chunkText: chunkItem.text, chunkInfo: chunkItem.info })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Retry request failed.');
      }
      const { clauses: extractedClauses } = await res.json();

      setAnalysisChunks(prev => {
        const updated = prev.map(c => c.id === chunkId ? { ...c, status: 'completed' as const, clauses: extractedClauses, error: null } : c);
        const allCompleted = updated.every(c => c.status === 'completed');
        
        if (allCompleted) {
          const aggregated = updated.reduce((acc, c) => [...acc, ...c.clauses], [] as any[]);
          finalizePipeline(aggregated);
        } else {
          setIsAnalyzing(false);
        }
        return updated;
      });

    } catch (err: any) {
      console.error('Chunk retry failure:', err);
      setAnalysisChunks(prev => prev.map(c => c.id === chunkId ? { ...c, status: 'failed' as const, error: err.message } : c));
      setIsAnalyzing(false);
      showToast(`Retry failed: ${err.message}`, 'error');
    }
  };

  const finalizePipeline = async (aggregatedClauses: any[]) => {
    if (!contract || !currentUser) return;
    setIsAnalyzing(true);
    try {
      const idToken = await currentUser.getIdToken();
      const finalizeRes = await fetch('http://localhost:5001/api/ai/finalize-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ contractId: contract.contractId, clauses: aggregatedClauses })
      });

      if (!finalizeRes.ok) {
        const errData = await finalizeRes.json();
        throw new Error(errData.error || 'Deduplication and aggregation failure.');
      }

      showToast('AI analysis finalized and saved.', 'success');
      setIsAnalyzing(false);
      setAnalysisChunks([]);
    } catch (err: any) {
      console.error('Finalization process failed:', err);
      setAnalysisError(err.message || 'Finalization failed.');
      setIsAnalyzing(false);
      const docRef = doc(db, 'contracts', contract.contractId);
      await updateDoc(docRef, { analysisStatus: 'failed' });
      showToast(err.message || 'Finalization process encountered an error.', 'error');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.classList.add('bg-white/5');
      setTimeout(() => {
        element.classList.remove('bg-white/5');
      }, 1500);
    }
  };

  const jumpToClauseSection = (sectionNumber: string, sectionTitle: string) => {
    if (!contract?.structuredText) return;
    
    // Switch to viewer tab first
    setActiveTab('viewer');
    
    // Find closest section
    let targetId = null;

    if (sectionNumber) {
      const match = contract.structuredText.find(
        s => s.sectionNumber?.trim() === sectionNumber.trim()
      );
      if (match) targetId = match.id;
    }

    if (!targetId && sectionTitle) {
      const normTitle = sectionTitle.toLowerCase().trim();
      const match = contract.structuredText.find(
        s => s.title.toLowerCase().trim().includes(normTitle) || normTitle.includes(s.title.toLowerCase().trim())
      );
      if (match) targetId = match.id;
    }

    if (!targetId && sectionNumber) {
      const match = contract.structuredText.find(
        s => s.sectionNumber?.trim().includes(sectionNumber.trim()) || sectionNumber.trim().includes(s.sectionNumber?.trim() || '---')
      );
      if (match) targetId = match.id;
    }

    if (targetId) {
      // Small timeout to allow active tab repaint
      setTimeout(() => {
        scrollToSection(targetId);
      }, 100);
    } else {
      showToast('Could not link to section inside document.', 'info');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const runRiskAnalysis = async () => {
    if (!contract || !currentUser) return;
    setIsAnalyzingRisk(true);
    setRiskAnalysisError(null);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('http://localhost:5001/api/ai/analyze-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ contractId: contract.contractId })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Risk analysis calculation failed.');
      }

      showToast('Risk analysis completed successfully.', 'success');
    } catch (err: any) {
      console.error('Risk analysis failed:', err);
      setRiskAnalysisError(err.message || 'Risk analysis failed.');
      showToast(`Risk analysis failed: ${err.message}`, 'error');
    } finally {
      setIsAnalyzingRisk(false);
    }
  };

  const getSectionPageNumber = (sectionId: string): number => {
    if (!contract || !contract.structuredText || contract.structuredText.length === 0) return 1;
    const sections = contract.structuredText;
    let totalLength = 0;
    let sectionOffset = 0;
    let found = false;

    for (const sec of sections) {
      if (sec.id === sectionId) {
        sectionOffset = totalLength;
        found = true;
      }
      totalLength += (sec.content || '').length;
    }

    if (!found || totalLength === 0) return 1;
    const estimatedPage = Math.floor((sectionOffset / totalLength) * (contract.pageCount || 1)) + 1;
    return Math.min(estimatedPage, contract.pageCount || 1);
  };

  const getClausePageNumber = (clause: any): number => {
    if (!contract || !contract.structuredText) return 1;
    
    let match = null;
    if (clause.sectionNumber) {
      match = contract.structuredText.find(
        s => s.sectionNumber?.trim() === clause.sectionNumber.trim()
      );
    }
    if (!match && clause.sectionTitle) {
      const normTitle = clause.sectionTitle.toLowerCase().trim();
      match = contract.structuredText.find(
        s => s.title.toLowerCase().trim().includes(normTitle) || normTitle.includes(s.title.toLowerCase().trim())
      );
    }

    if (match) {
      return getSectionPageNumber(match.id);
    }
    return 1;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'Strong';
    if (score >= 70) return 'Probable';
    return 'Weak';
  };

  // Render Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-primary h-10 w-10 mb-4" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Workspace Details...</p>
      </div>
    );
  }

  // Fallback if contract is missing
  if (!contract) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col items-center justify-center p-4">
        <FileText size={48} className="text-slate-600 mb-3" />
        <p className="text-xs text-slate-400 font-semibold">Document not found.</p>
        <Link to="/contracts" className="mt-4 text-xs font-bold text-primary hover:underline">Return to Vault</Link>
      </div>
    );
  }

  // Render Ingestion/Processing States
  if (contract.status === 'processing') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="relative h-20 w-20 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border border-primary/20 border-t-primary animate-spin" />
          <div className="absolute h-4/5 w-4/5 rounded-full border border-cyan-500/10 border-b-cyan-500 animate-spin [animation-duration:1.5s]" />
          <Layers size={24} className="text-cyan-400 animate-pulse" />
        </div>
        <h3 className="font-heading font-extrabold text-sm uppercase tracking-widest text-slate-200">Processing Layout Structure</h3>
        <p className="text-3xs text-slate-500 font-semibold uppercase mt-1 animate-pulse">Running PDF/DOCX Parsing Engine...</p>
      </div>
    );
  }

  // Calculations: Guaranteed that contract is not null here
  const totalClausesCount = clauses.length;
  const missingClauses = contract.missingClauses || [];
  const averageConfidence = contract.averageConfidence || 0;

  // Filter clauses list
  const filteredClauses = clauses.filter(c => {
    // Search filter
    const matchesSearch = 
      c.clauseType.toLowerCase().includes(clauseSearch.toLowerCase()) ||
      c.summary.toLowerCase().includes(clauseSearch.toLowerCase()) ||
      c.fullText.toLowerCase().includes(clauseSearch.toLowerCase()) ||
      c.keywords.some(k => k.toLowerCase().includes(clauseSearch.toLowerCase()));

    // Clause Type filter
    const matchesType = filterClauseType === 'all' || c.clauseType === filterClauseType;

    // Confidence filter
    let matchesConfidence = true;
    if (filterConfidence === 'high') matchesConfidence = c.confidence >= 90;
    else if (filterConfidence === 'medium') matchesConfidence = c.confidence >= 70 && c.confidence < 90;
    else if (filterConfidence === 'low') matchesConfidence = c.confidence < 70;

    return matchesSearch && matchesType && matchesConfidence;
  });

  // Category spread calculation
  const clauseCounts = clauses.reduce((acc, c) => {
    acc[c.clauseType] = (acc[c.clauseType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(clauseCounts).sort((a, b) => b[1] - a[1]);

  const sectionsList = contract.structuredText || [];
  const outlineItems = sectionsList.filter(sec => 
    sec.title.toLowerCase().includes(outlineSearch.toLowerCase()) || 
    (sec.sectionNumber && sec.sectionNumber.includes(outlineSearch))
  );

  const visibleOutlineItems = (() => {
    const items: typeof outlineItems = [];
    let currentParentCollapsed = false;

    for (let i = 0; i < outlineItems.length; i++) {
      const sec = outlineItems[i];
      if (sec.level === 1) {
        currentParentCollapsed = !!collapsedSections[sec.id];
        items.push(sec);
      } else {
        if (!currentParentCollapsed) {
          items.push(sec);
        }
      }
    }
    return items;
  })();

  const hasSubsections = (index: number) => {
    if (index === outlineItems.length - 1) return false;
    return outlineItems[index + 1].level > 1;
  };

  return (
    <PageContainer
      title="Contract Workspace"
      subtitle={`vault id: ${contract.contractId}`}
      action={
        <div className="flex gap-2">
          <Link 
            to="/contracts" 
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-2xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>Vault Directory</span>
          </Link>

          <a 
            href={contract.storageUrl}
            download={contract.fileName}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-3.5 py-2 text-2xs font-semibold text-white hover:opacity-95 shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            <Download size={12} />
            <span>Download Original</span>
          </a>
        </div>
      }
    >
      {/* Workspace Navigation Tabs */}
      <div className="mb-6 flex border-b border-white/5 pb-px shrink-0">
        <button
          onClick={() => setActiveTab('viewer')}
          className={`relative py-3 px-6 text-2xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
            activeTab === 'viewer' ? 'text-primary text-glow-primary' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span>Document Viewer</span>
          {activeTab === 'viewer' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`relative py-3 px-6 text-2xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ai' ? 'text-cyan-400 text-glow' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sparkles size={12} className={contract.analysisStatus === 'completed' ? 'text-cyan-400' : 'text-slate-500'} />
          <span>AI Clause Workspace</span>
          {contract.analysisStatus === 'completed' && (
            <span className="ml-1 px-1.5 py-0.5 text-[8px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-extrabold rounded-md uppercase tracking-wide">
              {clauses.length} Clauses
            </span>
          )}
          {activeTab === 'ai' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`relative py-3 px-6 text-2xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'risk' ? 'text-red-400 text-glow' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldAlert size={12} className={contract.riskAnalysisStatus === 'completed' ? 'text-red-400' : 'text-slate-500'} />
          <span>Risk & Compliance</span>
          {contract.riskAnalysisStatus === 'completed' && contract.overallRiskScore !== undefined && (
            <span className={`ml-1 px-1.5 py-0.5 text-[8px] border font-extrabold rounded-md uppercase tracking-wide ${
              contract.overallRiskScore >= 80 ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              contract.overallRiskScore >= 60 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
              contract.overallRiskScore >= 40 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
              'bg-green-500/10 border-green-500/20 text-green-400'
            }`}>
              Score: {contract.overallRiskScore}
            </span>
          )}
          {activeTab === 'risk' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`relative py-3 px-6 text-2xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'summary' ? 'text-purple-400 text-glow' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sparkles size={12} className={contract.summaryStatus === 'completed' ? 'text-purple-400' : 'text-slate-500'} />
          <span>Executive Summary</span>
          {contract.summaryStatus === 'completed' && (
            <span className="ml-1 px-1.5 py-0.5 text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold rounded-md uppercase tracking-wide">
              Ready
            </span>
          )}
          {activeTab === 'summary' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`relative py-3 px-6 text-2xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'chat' ? 'text-indigo-400 text-glow' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MessageSquare size={12} className={activeTab === 'chat' ? 'text-indigo-400' : 'text-slate-500'} />
          <span>AI Copilot Chat</span>
          {activeTab === 'chat' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
          )}
        </button>
      </div>

      {activeTab === 'chat' && (
        <ChatPanel
          contract={contract}
          clauses={clauses}
          clauseRisks={clauseRisks}
          riskAnalysis={riskAnalysis}
          onJumpToSource={jumpToClauseSection}
        />
      )}

      <div className={`${activeTab === 'chat' ? 'hidden' : 'grid'} grid-cols-1 gap-6 lg:grid-cols-12 text-left`}>
        
        {/* Left Pane: Document Outline / Table of Contents (3 cols) */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md flex flex-col h-[calc(100vh-230px)] glass-panel">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <List size={14} className="text-cyan-400" />
              <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Document Outline</h4>
            </div>

            {/* Outline search */}
            <div className="relative mt-3 mb-3 shrink-0">
              <input 
                type="text" 
                placeholder="Search sections..."
                value={outlineSearch}
                onChange={(e) => setOutlineSearch(e.target.value)}
                className="w-full rounded-lg border border-white/5 bg-black/30 py-1.5 px-3 text-[10px] text-slate-300 placeholder-slate-600 outline-none focus:border-primary"
              />
            </div>

            {/* Scrolling Outline List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-medium">
              {visibleOutlineItems.length === 0 ? (
                <p className="text-3xs text-slate-600 text-center py-4">No sections match query.</p>
              ) : (
                visibleOutlineItems.map((sec) => {
                  const isParent = sec.level === 1 && hasSubsections(outlineItems.indexOf(sec));
                  const isCollapsed = !!collapsedSections[sec.id];
                  return (
                    <div 
                      key={sec.id}
                      style={{ paddingLeft: `${(sec.level - 1) * 8}px` }}
                      className="group"
                    >
                      <div 
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-3xs transition-all duration-150 ${
                          sec.level === 1 
                            ? 'text-slate-200 font-bold hover:bg-white/5' 
                            : 'text-slate-400 hover:bg-white/3 hover:text-white'
                        }`}
                      >
                        {isParent ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSection(sec.id);
                            }}
                            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer shrink-0"
                          >
                            {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                          </button>
                        ) : (
                          <FileText size={10} className="shrink-0 text-slate-500 group-hover:text-cyan-400" />
                        )}
                        <span 
                          onClick={() => {
                            setActiveTab('viewer');
                            scrollToSection(sec.id);
                          }}
                          className="truncate flex-1 cursor-pointer hover:underline"
                        >
                          {sec.sectionNumber && `${sec.sectionNumber} `}{sec.title}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Center Pane: Active Tab (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#111827]/15 p-6 backdrop-blur-md flex flex-col h-[calc(100vh-230px)] glass-panel">
            
            <AnimatePresence mode="wait">
              {activeTab === 'viewer' && (
                <motion.div
                  key="viewer-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col h-full overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <FileCheck size={16} className="text-primary animate-pulse" />
                      {isEditingName ? (
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="text" 
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="rounded-lg border border-primary bg-black/40 py-1 px-2 text-xs text-white outline-none w-56 font-bold"
                          />
                          <button onClick={handleRename} className="p-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 cursor-pointer">
                            <Check size={12} />
                          </button>
                          <button onClick={() => setIsEditingName(false)} className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-100 max-w-[280px] truncate">
                            {contract.contractName}
                          </h3>
                          <button 
                            onClick={() => setIsEditingName(true)}
                            className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[10px] text-slate-500 font-mono">
                      {contract.fileType.split('/').pop()?.toUpperCase() || 'DOCUMENT'}
                    </span>
                  </div>

                  {/* Document Reader Container */}
                  <div 
                    ref={readerContainerRef}
                    className="flex-1 overflow-y-auto mt-4 pr-3 space-y-6 scroll-smooth h-full text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-4"
                  >
                    {sectionsList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                        <AlertTriangle className="text-amber-500 h-8 w-8" />
                        <p className="text-2xs text-slate-400">Layout structure is empty.</p>
                        <button onClick={handleReparse} className="rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-3xs font-semibold px-3 py-1.5 transition-colors">
                          Re-Trigger Parse
                        </button>
                      </div>
                    ) : (
                      sectionsList.map((sec) => {
                        const isCollapsed = !!collapsedReaderSections[sec.id];
                        return (
                          <div 
                            id={`section-${sec.id}`} 
                            key={sec.id} 
                            className="group scroll-mt-6 p-2.5 rounded-xl transition-all duration-300 border border-transparent hover:border-white/5 bg-white/[0.01]"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <h4 
                                onClick={() => toggleReaderSection(sec.id)}
                                className={`font-heading font-bold tracking-tight select-none mb-1 cursor-pointer flex-1 flex items-center gap-2 ${
                                  sec.level === 1 ? 'text-xs text-primary font-extrabold border-b border-white/5 pb-1 mt-2' :
                                  sec.level === 2 ? 'text-[11px] text-cyan-400 font-semibold' : 'text-3xs text-slate-400'
                                }`}
                              >
                                {sec.sectionNumber && `${sec.sectionNumber} `}{sec.title}
                                {isCollapsed && (
                                  <span className="text-[9px] text-slate-500 font-mono font-normal tracking-wide bg-white/5 px-1.5 py-0.5 rounded uppercase">Collapsed</span>
                                )}
                              </h4>
                              <button 
                                onClick={() => toggleReaderSection(sec.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-1 text-3xs font-semibold cursor-pointer shrink-0"
                              >
                                {isCollapsed ? 'Expand Content' : 'Collapse Content'}
                              </button>
                            </div>
                            {!isCollapsed && (
                              <p className="pl-3 border-l border-white/5 text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap font-sans mt-2">
                                {sec.content}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div
                  key="ai-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col h-full overflow-hidden"
                >
                  {/* CASE 1: Analysis not started or failed */}
                  {(!contract.analysisStatus || contract.analysisStatus === 'analysis_pending') && !isAnalyzing && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
                        <div className="relative h-16 w-16 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/5">
                          <Sparkles size={32} className="animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-2 max-w-sm">
                        <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-200">Legal Clause Intelligence</h3>
                        <p className="text-2xs text-slate-400 leading-relaxed">
                          Extract critical clauses, classify agreements, detect omissions, and assess compliance using AI-driven legal intelligence. Uses OpenRouter backend completions.
                        </p>
                      </div>
                      <button
                        onClick={() => startOrResumeAnalysis(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-primary px-6 py-3 text-xs font-bold text-white hover:opacity-95 shadow-lg shadow-cyan-500/10 transition-all cursor-pointer"
                      >
                        <Play size={14} className="fill-current" />
                        <span>Initialize AI Clause Analysis</span>
                      </button>
                    </div>
                  )}

                  {/* CASE 2: Analysis is currently running */}
                  {(isAnalyzing || (contract.analysisStatus === 'analyzing' && analysisChunks.length > 0)) && (
                    <div className="flex-1 flex flex-col h-full justify-between p-2 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <RefreshCw size={14} className="animate-spin text-cyan-400" />
                          <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">AI Chunking Queue Manager</h4>
                        </div>

                        {/* Overview progress bar */}
                        {(() => {
                          const completed = analysisChunks.filter(c => c.status === 'completed').length;
                          const total = analysisChunks.length;
                          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                          return (
                            <div className="space-y-2 bg-black/20 border border-white/5 p-4 rounded-xl">
                              <div className="flex justify-between items-center text-3xs font-extrabold uppercase tracking-wider text-slate-400">
                                <span>Running Chunk Extraction</span>
                                <span>{completed} / {total} Chunks ({pct}%)</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-primary transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {analysisError && (
                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2.5 text-3xs text-red-400">
                            <AlertCircle size={14} className="shrink-0" />
                            <div className="space-y-1">
                              <span className="block font-bold">Extraction Interrupted</span>
                              <p className="leading-relaxed">{analysisError}</p>
                            </div>
                          </div>
                        )}

                        {/* List of queue items */}
                        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-420px)] pr-1">
                          {analysisChunks.map((chunk) => (
                            <div key={chunk.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 p-3 text-3xs font-medium">
                              <div className="flex items-center gap-2.5">
                                {chunk.status === 'pending' && <div className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-pulse" />}
                                {chunk.status === 'analyzing' && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
                                {chunk.status === 'completed' && <CheckCircle2 size={12} className="text-green-400" />}
                                {chunk.status === 'failed' && <AlertCircle size={12} className="text-red-400" />}
                                
                                <span className="text-slate-300 font-bold uppercase tracking-wider">{chunk.info}</span>
                              </div>
                              
                              <div className="flex items-center gap-2.5">
                                {chunk.status === 'failed' && (
                                  <button
                                    onClick={() => retrySingleChunk(chunk.id)}
                                    className="rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2 py-0.5 text-[9px] font-extrabold uppercase transition-colors cursor-pointer"
                                  >
                                    Retry
                                  </button>
                                )}
                                
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  chunk.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                  chunk.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  chunk.status === 'analyzing' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse' :
                                  'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                                }`}>
                                  {chunk.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {analysisError && (
                        <div className="flex justify-end gap-2 shrink-0">
                          <button
                            onClick={() => startOrResumeAnalysis(false)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-2xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                          >
                            <RefreshCw size={12} />
                            <span>Resume Analysis</span>
                          </button>
                          <button
                            onClick={() => startOrResumeAnalysis(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-primary px-4 py-2.5 text-2xs font-semibold text-white hover:opacity-95 transition-all cursor-pointer"
                          >
                            <Play size={12} />
                            <span>Restart Fresh</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CASE 3: Interrupted / Empty states when state has lost chunks */}
                  {contract.analysisStatus === 'analyzing' && !isAnalyzing && analysisChunks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                      <AlertTriangle className="text-amber-500 h-10 w-10 animate-bounce" />
                      <div className="space-y-2 max-w-sm">
                        <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-200">Analysis Incomplete</h3>
                        <p className="text-2xs text-slate-400 leading-relaxed">
                          The client-orchestrated analysis loop was interrupted (due to a browser reload or exit). You can restart or resume extraction.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startOrResumeAnalysis(true)}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-primary px-5 py-2.5 text-2xs font-bold text-white hover:opacity-95 transition-all cursor-pointer"
                        >
                          <Play size={12} />
                          <span>Restart Analysis</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CASE 4: Analysis has completed */}
                  {contract.analysisStatus === 'completed' && !isAnalyzing && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                      
                      {/* Filter Toolbelt */}
                      <div className="border-b border-white/5 pb-3.5 mb-4 space-y-3 shrink-0">
                        <div className="flex gap-2">
                          {/* Search bar */}
                          <div className="relative flex-1">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Search extracted clauses, summaries, keywords..."
                              value={clauseSearch}
                              onChange={(e) => setClauseSearch(e.target.value)}
                              className="w-full rounded-xl border border-white/5 bg-black/30 py-2 pl-8 pr-4 text-2xs text-slate-300 placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>
                          
                          {/* Toggle Detected vs Missing */}
                          <button
                            onClick={() => setShowMissingToggle(prev => !prev)}
                            className={`rounded-xl border px-3 py-2 text-2xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              showMissingToggle 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <AlertTriangle size={12} />
                            <span>{showMissingToggle ? 'Show Extracted' : `Show Missing (${missingClauses.length})`}</span>
                          </button>
                        </div>

                        {!showMissingToggle && (
                          <div className="flex gap-2">
                            {/* Type filter */}
                            <select
                              value={filterClauseType}
                              onChange={(e) => setFilterClauseType(e.target.value)}
                              className="rounded-xl border border-white/5 bg-black/30 py-1.5 px-3 text-3xs text-slate-300 outline-none focus:border-cyan-500 flex-1"
                            >
                              <option value="all">All Clause Types</option>
                              {REQUIRED_CLAUSE_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>

                            {/* Confidence filter */}
                            <select
                              value={filterConfidence}
                              onChange={(e) => setFilterConfidence(e.target.value as any)}
                              className="rounded-xl border border-white/5 bg-black/30 py-1.5 px-3 text-3xs text-slate-300 outline-none focus:border-cyan-500 w-36"
                            >
                              <option value="all">All Confidence</option>
                              <option value="high">Strong Match (90%+)</option>
                              <option value="medium">Probable Match (70-89%)</option>
                              <option value="low">Weak Match (under 70%)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Interactive Repository Scrolling list */}
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                        {showMissingToggle ? (
                          // Missing expected clauses rendering
                          missingClauses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center p-8 space-y-2 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                              <CheckCircle2 className="text-green-400 h-8 w-8" />
                              <h5 className="font-heading font-extrabold text-2xs uppercase text-slate-200">All Protections Present</h5>
                              <p className="text-3xs text-slate-500">Every single one of the 15 supported standard legal clauses was successfully detected.</p>
                            </div>
                          ) : (
                            missingClauses.map((missingType: string) => (
                              <div key={missingType} className="rounded-xl border border-red-500/10 bg-red-500/3 p-4 space-y-2 border-l-2 border-l-red-500/60">
                                <div className="flex justify-between items-center">
                                  <span className="font-heading font-bold text-2xs uppercase text-slate-200">{missingType}</span>
                                  <span className="rounded bg-red-500/10 px-2 py-0.5 text-[8px] font-extrabold uppercase text-red-400 tracking-wide border border-red-500/20">
                                    Omitted Clause
                                  </span>
                                </div>
                                <p className="text-3xs text-slate-400 leading-normal">
                                  This standard clause was not found in the parsed contract sections. Its absence may expose you to legal gaps, liabilities, or regulatory vulnerability.
                                </p>
                              </div>
                            ))
                          )
                        ) : (
                          // Detected clauses list
                          filteredClauses.length === 0 ? (
                            <p className="text-3xs text-slate-500 text-center py-8">No clauses matched filters.</p>
                          ) : (
                            filteredClauses.map((clause) => {
                              const isExpanded = !!expandedClauses[clause.clauseId];
                              return (
                                <div 
                                  key={clause.clauseId}
                                  className="rounded-xl border border-white/5 bg-[#111827]/30 hover:border-white/10 transition-all overflow-hidden"
                                >
                                  {/* Header bar click to expand */}
                                  <div 
                                    onClick={() => toggleClauseExpand(clause.clauseId)}
                                    className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none bg-white/[0.01]"
                                  >
                                    <div className="space-y-1 text-left min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-heading font-extrabold text-2xs uppercase text-cyan-400 truncate max-w-[200px]">
                                          {clause.clauseType}
                                        </span>
                                        {clause.sectionNumber && (
                                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                                            Section {clause.sectionNumber}
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-[11px] text-slate-300 font-bold truncate">
                                        {clause.sectionTitle || 'Clause Section'}
                                      </h4>
                                    </div>

                                    <div className="flex items-center gap-2.5 shrink-0">
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border ${getConfidenceColor(clause.confidence)}`}>
                                        {clause.confidence}% {getConfidenceLabel(clause.confidence)}
                                      </span>
                                      {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                                    </div>
                                  </div>

                                  {/* Expanded content body */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t border-white/5 overflow-hidden"
                                      >
                                        <div className="p-4 space-y-4 text-3xs leading-relaxed">
                                          {/* Summary summary */}
                                          <div className="space-y-1">
                                            <span className="block font-bold text-slate-500 uppercase tracking-wide text-[9px]">Summary Analysis</span>
                                            <p className="text-slate-300 leading-normal font-sans bg-white/[0.01] border border-white/3 rounded-lg p-2.5">
                                              {clause.summary}
                                            </p>
                                          </div>

                                          {/* Verbatim text block */}
                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                              <span className="block font-bold text-slate-500 uppercase tracking-wide text-[9px]">Verbatim Document Excerpt</span>
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigator.clipboard.writeText(clause.fullText);
                                                  showToast('Clause text copied to clipboard.', 'success');
                                                }}
                                                className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer"
                                                title="Copy Excerpt"
                                              >
                                                <Copy size={10} />
                                              </button>
                                            </div>
                                            <pre className="font-mono text-slate-400 bg-black/40 border border-white/3 rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
                                              {clause.fullText}
                                            </pre>
                                          </div>

                                          {/* Keywords & section jumps */}
                                          <div className="flex items-center justify-between gap-4 flex-wrap border-t border-white/3 pt-3">
                                            {/* Keyword Pills */}
                                            <div className="flex flex-wrap gap-1">
                                              {clause.keywords.map((kw, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/3 text-[9px] text-slate-500 lowercase font-medium">
                                                  #{kw}
                                                </span>
                                              ))}
                                            </div>

                                            {/* Jump to section */}
                                            <button
                                              onClick={() => jumpToClauseSection(clause.sectionNumber, clause.sectionTitle)}
                                              className="inline-flex items-center gap-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-1 hover:bg-cyan-500/20 font-semibold cursor-pointer transition-colors"
                                            >
                                              <span>Jump to Section</span>
                                              <ArrowUpRight size={10} />
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                </div>
                              );
                            })
                          )
                        )}
                      </div>

                    </div>
                  )}

                </motion.div>
              )}

              {activeTab === 'risk' && (
                <motion.div
                  key="risk-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col h-full overflow-hidden"
                >
                  {/* CASE 1: Risk Analysis not started or failed */}
                  {(!contract.riskAnalysisStatus || contract.riskAnalysisStatus === 'idle') && !isAnalyzingRisk && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl animate-pulse" />
                        <div className="relative h-16 w-16 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/5">
                          <ShieldAlert size={32} className="animate-pulse" />
                        </div>
                      </div>

                      <div className="space-y-2 max-w-sm">
                        <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-100">
                          Initialize Risk Engine
                        </h3>
                        <p className="text-2xs text-slate-400 leading-relaxed">
                          Analyze extracted contract clauses against market standard baselines to identify deviations, calculate risk scores, and highlight key issues.
                        </p>
                      </div>

                      {clauses.length === 0 ? (
                        <div className="rounded-xl border border-amber-500/10 bg-amber-500/3 p-3 max-w-sm text-3xs text-amber-400 flex items-start gap-2">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                          <span>No extracted clauses found. You must run AI Clause Extraction first in the Clause Workspace tab before performing risk analysis.</span>
                        </div>
                      ) : (
                        <button
                          onClick={runRiskAnalysis}
                          className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 px-6 py-2.5 text-2xs font-bold text-white shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider animate-glow"
                        >
                          <Play size={10} />
                          <span>Analyze Contract Risk</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* CASE 2: Risk analysis is loading */}
                  {isAnalyzingRisk && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl animate-pulse" />
                        <div className="relative h-16 w-16 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center text-red-400 animate-spin">
                          <RefreshCw size={24} />
                        </div>
                      </div>

                      <div className="space-y-2 max-w-sm">
                        <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-100 animate-pulse">
                          Analyzing Clauses...
                        </h3>
                        <p className="text-2xs text-slate-400 leading-relaxed">
                          Evaluating legal, financial, operational, and reputational risk parameters. Comparing draft text against market standards.
                        </p>
                      </div>

                      {/* Animated glass loading progress bar */}
                      <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                        <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-[loading_1.5s_infinite_linear]" style={{ width: '50%' }} />
                      </div>
                    </div>
                  )}

                  {/* CASE 3: Risk analysis failed */}
                  {contract.riskAnalysisStatus === 'failed' && !isAnalyzingRisk && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl animate-pulse" />
                        <div className="relative h-16 w-16 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/5">
                          <AlertCircle size={32} />
                        </div>
                      </div>

                      <div className="space-y-2 max-w-sm">
                        <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-red-400">
                          Risk Engine Interrupted
                        </h3>
                        <p className="text-2xs text-slate-400 leading-relaxed">
                          {riskAnalysisError || 'The AI service encountered an error while analyzing clause risks.'}
                        </p>
                      </div>

                      <button
                        onClick={runRiskAnalysis}
                        className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 px-6 py-2.5 text-2xs font-bold text-white shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                      >
                        <RefreshCw size={10} />
                        <span>Retry Risk Analysis</span>
                      </button>
                    </div>
                  )}

                  {/* CASE 4: Completed risk analysis dashboard */}
                  {contract.riskAnalysisStatus === 'completed' && riskAnalysis && !isAnalyzingRisk && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                      
                      {/* Dashboard overview: overall score + categories bar chart + top issues */}
                      <div className="shrink-0 overflow-y-auto max-h-[300px] border-b border-white/5 pb-4 mb-4 space-y-4 pr-1 scrollbar-thin">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                          
                          {/* Radial / Ring gauge overall score */}
                          <div className="rounded-2xl border border-white/5 bg-black/20 p-4 flex flex-col items-center justify-center relative overflow-hidden glass-panel">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Overall Contract Risk</span>
                            
                            <div className="relative flex items-center justify-center h-24 w-24">
                              {/* Simple SVG progress circle */}
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke="rgba(255,255,255,0.03)"
                                  strokeWidth="7"
                                  fill="transparent"
                                />
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke={
                                    riskAnalysis.overallRiskScore >= 81 ? '#ef4444' :
                                    riskAnalysis.overallRiskScore >= 61 ? '#f97316' :
                                    riskAnalysis.overallRiskScore >= 41 ? '#eab308' :
                                    riskAnalysis.overallRiskScore >= 21 ? '#06b6d4' : '#10b981'
                                  }
                                  strokeWidth="7"
                                  fill="transparent"
                                  strokeDasharray={`${2 * Math.PI * 40}`}
                                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - riskAnalysis.overallRiskScore / 100)}`}
                                  className="transition-all duration-1000 ease-out"
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-xl font-extrabold font-mono text-slate-100">{riskAnalysis.overallRiskScore}</span>
                                <span className="text-[8px] text-slate-500 font-mono font-bold uppercase">/ 100</span>
                              </div>
                            </div>

                            <span className={`mt-2 text-2xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              riskAnalysis.overallRiskScore >= 81 ? 'text-red-400 border-red-500/20 bg-red-500/5' :
                              riskAnalysis.overallRiskScore >= 61 ? 'text-orange-400 border-orange-500/20 bg-orange-500/5' :
                              riskAnalysis.overallRiskScore >= 41 ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' :
                              riskAnalysis.overallRiskScore >= 21 ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' :
                              'text-green-400 border-green-500/20 bg-green-500/5'
                            }`}>
                              {riskAnalysis.riskLevel} Risk
                            </span>
                          </div>

                          {/* Categories risk chart */}
                          <div className="rounded-2xl border border-white/5 bg-black/20 p-4 flex flex-col glass-panel col-span-1 md:col-span-2">
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Risk Breakdown by Category</span>
                            <div className="h-28 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    { name: 'Financial', score: riskAnalysis.riskBreakdown?.Financial || 0 },
                                    { name: 'Legal', score: riskAnalysis.riskBreakdown?.Legal || 0 },
                                    { name: 'Operational', score: riskAnalysis.riskBreakdown?.Operational || 0 },
                                    { name: 'Reputational', score: riskAnalysis.riskBreakdown?.Reputational || 0 }
                                  ]}
                                  margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                                >
                                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                  <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} tickLine={false} axisLine={false} />
                                  <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '9px', textAlign: 'left' }}
                                  />
                                  <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={28}>
                                    {
                                      [
                                        riskAnalysis.riskBreakdown?.Financial || 0,
                                        riskAnalysis.riskBreakdown?.Legal || 0,
                                        riskAnalysis.riskBreakdown?.Operational || 0,
                                        riskAnalysis.riskBreakdown?.Reputational || 0
                                      ].map((val, idx) => (
                                        <Cell
                                          key={`cell-${idx}`}
                                          fill={
                                            val >= 81 ? '#ef4444' :
                                            val >= 61 ? '#f97316' :
                                            val >= 41 ? '#eab308' :
                                            val >= 21 ? '#06b6d4' : '#10b981'
                                          }
                                        />
                                      ))
                                    }
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Top 3 Issues warnings box */}
                          <div className="rounded-2xl border border-white/5 bg-black/20 p-4 col-span-1 md:col-span-3 glass-panel">
                            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-2.5">
                              <ShieldAlert size={12} className="text-red-400" />
                              <span className="text-[9px] font-extrabold text-slate-200 uppercase tracking-wider">Top Negotiation Issues</span>
                            </div>

                            <div className="space-y-2 text-left">
                              {riskAnalysis.topIssues?.map((issue: any, index: number) => (
                                <div key={index} className="flex gap-2.5 p-2 rounded-xl bg-white/[0.01] border border-white/3 items-start">
                                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    issue.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    issue.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                    issue.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <div className="space-y-0.5 text-2xs">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                      <span>{issue.title}</span>
                                      <span className={`px-1 rounded-[4px] text-[8px] font-extrabold uppercase ${
                                        issue.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                                        issue.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/10' :
                                        issue.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10' :
                                        'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10'
                                      }`}>
                                        {issue.severity}
                                      </span>
                                    </div>
                                    <p className="text-slate-400 leading-normal">{issue.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Filters Toolbar */}
                      <div className="shrink-0 bg-black/10 border border-white/5 rounded-2xl p-3 mb-4 flex flex-col md:flex-row gap-2.5 items-center justify-between text-2xs">
                        <div className="relative w-full md:w-56">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search risk explanations..."
                            value={riskSearch}
                            onChange={(e) => setRiskSearch(e.target.value)}
                            className="w-full rounded-xl border border-white/5 bg-black/20 py-1.5 pl-8 pr-2.5 text-3xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                          <select
                            value={filterRiskLevel}
                            onChange={(e) => setFilterRiskLevel(e.target.value)}
                            className="rounded-xl border border-white/5 bg-black/20 py-1.5 px-2.5 text-[10px] text-slate-300 outline-none"
                          >
                            <option value="all">All Risk Levels</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Low">Low</option>
                            <option value="Very Low">Very Low</option>
                          </select>

                          <select
                            value={filterRiskCategory}
                            onChange={(e) => setFilterRiskCategory(e.target.value)}
                            className="rounded-xl border border-white/5 bg-black/20 py-1.5 px-2.5 text-[10px] text-slate-300 outline-none"
                          >
                            <option value="all">All Categories</option>
                            <option value="Financial">Financial</option>
                            <option value="Legal">Legal</option>
                            <option value="Operational">Operational</option>
                            <option value="Reputational">Reputational</option>
                          </select>

                          <select
                            value={filterClauseTypeRisk}
                            onChange={(e) => setFilterClauseTypeRisk(e.target.value)}
                            className="rounded-xl border border-white/5 bg-black/20 py-1.5 px-2.5 text-[10px] text-slate-300 outline-none"
                          >
                            <option value="all">All Clause Types</option>
                            {REQUIRED_CLAUSE_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>

                          <select
                            value={filterReviewPriority}
                            onChange={(e) => setFilterReviewPriority(e.target.value)}
                            className="rounded-xl border border-white/5 bg-black/20 py-1.5 px-2.5 text-[10px] text-slate-300 outline-none"
                          >
                            <option value="all">All Priorities</option>
                            <option value="Immediate Review">Immediate Review</option>
                            <option value="High Priority">High Priority</option>
                            <option value="Medium Priority">Medium Priority</option>
                            <option value="Low Priority">Low Priority</option>
                          </select>
                        </div>
                      </div>

                      {/* Accordion review list */}
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2.5 scrollbar-thin">
                        {(() => {
                          const filteredRisks = clauseRisks.filter(r => {
                            const cl = clauses.find(c => c.clauseId === r.clauseId);
                            const textToSearch = `${r.clauseType} ${r.reasoning} ${r.whyFlagged} ${r.potentialImpact} ${r.recommendedAction} ${cl?.summary || ''} ${cl?.fullText || ''}`.toLowerCase();
                            
                            const matchesSearch = riskSearch ? textToSearch.includes(riskSearch.toLowerCase()) : true;
                            const matchesLevel = filterRiskLevel === 'all' ? true : r.riskLevel === filterRiskLevel;
                            const matchesCategory = filterRiskCategory === 'all' ? true : r.riskCategory === filterRiskCategory;
                            const matchesPriority = filterReviewPriority === 'all' ? true : r.priority === filterReviewPriority;
                            const matchesClauseType = filterClauseTypeRisk === 'all' ? true : r.clauseType === filterClauseTypeRisk;

                            return matchesSearch && matchesLevel && matchesCategory && matchesPriority && matchesClauseType;
                          });

                          if (filteredRisks.length === 0) {
                            return (
                              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                <AlertTriangle size={18} className="text-slate-500" />
                                <span className="text-2xs text-slate-400">No risk results match your active filters.</span>
                              </div>
                            );
                          }

                          return filteredRisks.map(r => {
                            const isExpanded = !!expandedRiskClauses[r.clauseId];
                            const cl = clauses.find(c => c.clauseId === r.clauseId);

                            return (
                              <div
                                key={r.clauseId}
                                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                                  isExpanded ? 'border-red-500/20 bg-red-500/[0.01]' : 'border-white/5 bg-[#111827]/10 hover:border-white/10 hover:bg-[#111827]/20'
                                }`}
                              >
                                {/* Accordion Header */}
                                <div
                                  onClick={() => setExpandedRiskClauses(prev => ({ ...prev, [r.clauseId]: !prev[r.clauseId] }))}
                                  className="p-3.5 flex items-center justify-between gap-4 cursor-pointer select-none"
                                >
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <span className="font-heading font-extrabold text-xs text-slate-200 truncate">{r.clauseType}</span>
                                    
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-[8px] px-1.5 py-0.5 rounded-[4px] font-extrabold font-mono ${
                                        r.riskScore >= 81 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        r.riskScore >= 61 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                        r.riskScore >= 41 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                        r.riskScore >= 21 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                        'bg-green-500/10 text-green-400 border border-green-500/20'
                                      }`}>
                                        Score: {r.riskScore}
                                      </span>

                                      <span className={`text-[8px] px-1.5 py-0.5 rounded-[4px] font-bold uppercase ${
                                        r.riskCategory === 'Financial' ? 'bg-red-500/5 text-red-300 border border-red-500/10' :
                                        r.riskCategory === 'Legal' ? 'bg-cyan-500/5 text-cyan-300 border border-cyan-500/10' :
                                        r.riskCategory === 'Operational' ? 'bg-orange-500/5 text-orange-300 border border-orange-500/10' :
                                        'bg-purple-500/5 text-purple-300 border border-purple-500/10'
                                      }`}>
                                        {r.riskCategory} Risk
                                      </span>

                                      <span className={`text-[8px] px-1.5 py-0.5 rounded-[4px] font-bold uppercase border ${
                                        r.marketComparison?.classification === 'Unfavourable' ? 'border-red-500/20 bg-red-500/5 text-red-400' :
                                        r.marketComparison?.classification === 'Unusual' ? 'border-purple-500/20 bg-purple-500/5 text-purple-400' :
                                        r.marketComparison?.classification === 'Favourable' ? 'border-green-500/20 bg-green-500/5 text-green-400' :
                                        'border-slate-500/20 bg-slate-500/5 text-slate-400'
                                      }`}>
                                        {r.marketComparison?.classification}
                                      </span>

                                      <span className={`text-[8px] px-1.5 py-0.5 rounded-[4px] font-bold uppercase border ${
                                        r.priority === 'Immediate Review' ? 'border-red-500/30 bg-red-500/10 text-red-400 animate-pulse' :
                                        r.priority === 'High Priority' ? 'border-orange-500/20 bg-orange-500/5 text-orange-400' :
                                        r.priority === 'Medium Priority' ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' :
                                        'border-slate-500/20 bg-slate-500/5 text-slate-400'
                                      }`}>
                                        {r.priority}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-slate-500">
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </div>
                                </div>

                                {/* Accordion Body */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="border-t border-white/5 overflow-hidden"
                                    >
                                      <div className="p-4 space-y-4 text-3xs leading-relaxed text-left">
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          
                                          {/* Left Column: Text excerpts and baseline */}
                                          <div className="space-y-4">
                                            {/* Original text verbatim */}
                                            {cl && (
                                              <div className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                  <span className="block font-bold text-slate-500 uppercase tracking-wide text-[9px]">Original Clause Excerpt</span>
                                                  <button 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      navigator.clipboard.writeText(cl.fullText);
                                                      showToast('Clause text copied to clipboard.', 'success');
                                                    }}
                                                    className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer"
                                                  >
                                                    <Copy size={10} />
                                                  </button>
                                                </div>
                                                <pre className="font-mono text-slate-400 bg-black/40 border border-white/3 rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto select-text">
                                                  {cl.fullText}
                                                </pre>
                                              </div>
                                            )}

                                            {/* Summary summary */}
                                            {cl && (
                                              <div className="space-y-1">
                                                <span className="block font-bold text-slate-500 uppercase tracking-wide text-[9px]">Summary Description</span>
                                                <p className="text-slate-300 leading-normal font-sans bg-white/[0.01] border border-white/3 rounded-lg p-2.5">
                                                  {cl.summary}
                                                </p>
                                              </div>
                                            )}

                                            {/* Market standard comparison values */}
                                            <div className="space-y-2 rounded-xl bg-black/20 border border-white/3 p-3 text-2xs space-y-2">
                                              <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px] border-b border-white/5 pb-1">Market Standard Comparison</span>
                                              
                                              <div className="grid grid-cols-2 gap-2 mt-1.5">
                                                <div className="space-y-0.5">
                                                  <span className="text-slate-500 text-[9px] block">Draft Contract Value</span>
                                                  <span className="font-bold text-slate-300">{r.marketComparison?.contractValue}</span>
                                                </div>
                                                <div className="space-y-0.5">
                                                  <span className="text-slate-500 text-[9px] block">Market Benchmark Expectation</span>
                                                  <span className="font-bold text-slate-300">{r.marketComparison?.marketValue}</span>
                                                </div>
                                              </div>
                                            </div>

                                          </div>

                                          {/* Right Column: AI Reasoning Panel */}
                                          <div className="space-y-4">
                                            
                                            <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-4 space-y-3 relative overflow-hidden">
                                              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/[0.01] rounded-full blur-xl pointer-events-none" />
                                              <div className="flex items-center gap-1.5 text-red-400">
                                                <ShieldAlert size={12} className="animate-pulse" />
                                                <span className="font-heading font-extrabold text-[9px] uppercase tracking-wider">AI Reasoning Panel</span>
                                              </div>

                                              <div className="space-y-2.5">
                                                <div className="space-y-0.5">
                                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Why Flagged</span>
                                                  <p className="text-slate-300 font-sans leading-normal">{r.whyFlagged}</p>
                                                </div>

                                                <div className="space-y-0.5">
                                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Potential Risk Impact</span>
                                                  <p className="text-slate-300 font-sans leading-normal">{r.potentialImpact}</p>
                                                </div>

                                                <div className="space-y-0.5">
                                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Recommended Action</span>
                                                  <p className="text-slate-300 font-sans leading-normal">{r.recommendedAction}</p>
                                                </div>
                                              </div>

                                              <div className="border-t border-white/5 pt-3 mt-1 flex justify-between items-center">
                                                <span className="text-[8px] text-slate-500 font-mono">ID: {r.clauseId}</span>
                                                {cl && (
                                                  <button
                                                    onClick={() => jumpToClauseSection(cl.sectionNumber, cl.sectionTitle)}
                                                    className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 hover:bg-red-500/20 font-semibold cursor-pointer transition-colors text-[9px]"
                                                  >
                                                    <span>Scroll to Source</span>
                                                    <ArrowUpRight size={9} />
                                                  </button>
                                                )}
                                              </div>

                                            </div>

                                          </div>

                                        </div>

                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                              </div>
                            );
                          });
                        })()}
                      </div>

                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Right Pane: Adapt depending on Tab (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          <AnimatePresence mode="wait">
            {activeTab === 'viewer' ? (
              // Standard Details sidebar for Viewer mode
              <motion.div
                key="viewer-sidebar"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="space-y-4"
              >
                {/* Properties Metadata */}
                <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-4 glass-panel">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Sparkles size={14} className="text-primary animate-pulse" />
                    <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Extracted Metadata</h4>
                  </div>

                  <div className="space-y-3.5 text-2xs">
                    
                    {/* Category */}
                    <div className="space-y-1">
                      <span className="block text-3xs font-extrabold uppercase text-slate-500 tracking-wider">Category</span>
                      {isEditingCategory ? (
                        <select 
                          value={editedCategory} 
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full rounded-lg border border-primary bg-[#111827] py-1.5 px-2.5 text-3xs text-slate-200 outline-none"
                          autoFocus
                          onBlur={() => setIsEditingCategory(false)}
                        >
                          {['NDA', 'Employment', 'Vendor', 'Partnership', 'SaaS', 'DPA', 'Other'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-3xs font-bold uppercase text-cyan-400">
                            {contract.contractCategory}
                          </span>
                          <button 
                            onClick={() => setIsEditingCategory(true)}
                            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 size={10} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Parties */}
                    <div className="space-y-1">
                      <span className="block text-3xs font-extrabold uppercase text-slate-500 tracking-wider">Identified Parties</span>
                      {contract.parties.length === 0 ? (
                        <span className="text-slate-500 italic">None detected</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {contract.parties.map((party, index) => (
                            <span key={index} className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] text-slate-300 font-semibold truncate max-w-full">
                              {party}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Effective Date */}
                    <div className="space-y-1">
                      <span className="block text-3xs font-extrabold uppercase text-slate-500 tracking-wider">Effective Date</span>
                      <span className="font-mono text-slate-300 font-bold block bg-black/10 border border-white/3 rounded-lg p-2">
                        {contract.effectiveDate || 'Not Detected'}
                      </span>
                    </div>

                    {/* Expiration Date */}
                    <div className="space-y-1">
                      <span className="block text-3xs font-extrabold uppercase text-slate-500 tracking-wider">Expiration Date</span>
                      <span className="font-mono text-slate-300 font-bold block bg-black/10 border border-white/3 rounded-lg p-2">
                        {contract.expirationDate || 'Not Detected'}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Document Statistics */}
                <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-4 glass-panel">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Layers size={14} className="text-slate-400" />
                    <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Document Metrics</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-2xs text-left">
                    <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                      <span className="block text-3xs text-slate-500 uppercase font-bold">Page Count</span>
                      <span className="mt-1 block text-sm font-extrabold text-slate-200 font-mono">
                        {contract.pageCount}
                      </span>
                    </div>
                    <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                      <span className="block text-3xs text-slate-500 uppercase font-bold">Word Count</span>
                      <span className="mt-1 block text-sm font-extrabold text-slate-200 font-mono">
                        {contract.wordCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                      <span className="block text-3xs text-slate-500 uppercase font-bold">Section Nodes</span>
                      <span className="mt-1 block text-sm font-extrabold text-slate-200 font-mono">
                        {sectionsList.length}
                      </span>
                    </div>
                    <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                      <span className="block text-3xs text-slate-500 uppercase font-bold">File Size</span>
                      <span className="mt-1 block text-sm font-extrabold text-slate-200 font-mono">
                        {formatBytes(contract.fileSize)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-2 text-3xs text-slate-500 font-mono">
                    <div className="flex items-center justify-between">
                      <span>Upload date:</span>
                      <span>{new Date(contract.uploadDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>File extension:</span>
                      <span>{contract.fileName.split('.').pop()?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Operational purging controls */}
                <div className="rounded-2xl border border-red-500/10 bg-red-500/3 p-4 space-y-3 glass-panel">
                  <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-red-400">Destructive Actions</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Permanently delete this contract, its layout partitions, and its parsed text representations.
                  </p>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 text-2xs font-semibold border border-red-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Purge Agreement</span>
                  </button>
                </div>
              </motion.div>
            ) : activeTab === 'ai' ? (
              // AI Intelligence Workspace Details Sidebar
              <motion.div
                key="ai-sidebar"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="space-y-4"
              >
                {/* AI Statistics Workspace card */}
                {contract.analysisStatus === 'completed' && (
                  <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-4 glass-panel">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Sparkles size={14} className="text-cyan-400 animate-glow" />
                      <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Clause Extract Overview</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-2xs text-left">
                      <div className="rounded-xl bg-black/10 border border-white/3 p-3 col-span-2 flex justify-between items-center">
                        <div>
                          <span className="block text-3xs text-slate-500 uppercase font-bold">Total Extracted</span>
                          <span className="mt-1 block text-lg font-extrabold text-cyan-400 font-mono text-glow">
                            {totalClausesCount}
                          </span>
                        </div>
                        <CheckCircle2 size={24} className="text-cyan-500/40" />
                      </div>
                      
                      <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                        <span className="block text-3xs text-slate-500 uppercase font-bold">Omitted Clauses</span>
                        <span className="mt-1 block text-sm font-extrabold text-amber-400 font-mono">
                          {missingClauses.length}
                        </span>
                      </div>
                      
                      <div className="rounded-xl bg-black/10 border border-white/3 p-3">
                        <span className="block text-3xs text-slate-500 uppercase font-bold">Avg AI Confidence</span>
                        <span className={`mt-1 block text-sm font-extrabold font-mono ${
                          averageConfidence >= 90 ? 'text-green-400' : averageConfidence >= 70 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {averageConfidence}%
                        </span>
                      </div>
                    </div>

                    {/* Trigger re-run */}
                    {!isAnalyzing && (
                      <button
                        onClick={() => startOrResumeAnalysis(true)}
                        className="w-full rounded-xl border border-cyan-500/10 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 py-2 text-2xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        <span>Re-Analyze Contract</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Categories Count Progress Chart */}
                {contract.analysisStatus === 'completed' && sortedCategories.length > 0 && (
                  <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-3 glass-panel">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Layers size={14} className="text-slate-400" />
                      <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Category Spread</h4>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[190px] pr-1">
                      {sortedCategories.map(([category, count]) => {
                        const pct = Math.max((count / totalClausesCount) * 100, 5);
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex justify-between text-3xs font-semibold uppercase tracking-wider text-slate-400">
                              <span className="truncate max-w-[140px]">{category}</span>
                              <span className="font-mono text-slate-200">{count}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-primary"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Risk Checklist Advisor */}
                {contract.analysisStatus === 'completed' && (
                  <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-3.5 glass-panel">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <ShieldAlert size={14} className="text-amber-500 animate-pulse" />
                      <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Risk Assessment Advisor</h4>
                    </div>

                    {(() => {
                      const criticalMissing = ['Indemnity', 'Limitation of Liability', 'Termination', 'Governing Law'].filter(
                        c => missingClauses.includes(c)
                      );

                      if (criticalMissing.length > 0) {
                        return (
                          <div className="space-y-3.5 text-3xs">
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5 leading-relaxed">
                              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                                <AlertTriangle size={12} />
                                <span>Critical Omissions Detected</span>
                              </div>
                              <p className="text-slate-400">
                                This agreement is missing key protection mechanisms. Add these to avoid exposure:
                              </p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {criticalMissing.map(c => (
                                  <span key={c} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-wider">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-500 leading-normal">
                              JurisAI suggests negotiating clauses for Indemnity and Limitation of Liability immediately to hedge downside risks.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 flex items-start gap-2 text-3xs leading-relaxed text-slate-400">
                          <CheckCircle2 size={12} className="text-green-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="block font-bold text-green-400">Safe Baseline Verified</span>
                            <p>All core protection safeguards (Liability caps, Indemnities, Governing Law, Termination) are structured into this contract document.</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </motion.div>
            ) : (
              // Risk & Compliance Sidebar
              <motion.div
                key="risk-sidebar"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="space-y-4 text-left"
              >
                {/* Heatmap Panel */}
                <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-3 glass-panel">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Layers size={14} className="text-red-400" />
                    <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Risk Heatmap</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Interactive page-level risk intensity grid. Click a page to scroll to its starting section in the viewer.
                  </p>
                  
                  {/* Heatmap Grid */}
                  <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {Array.from({ length: contract.pageCount || 1 }).map((_, i) => {
                      const pageNum = i + 1;
                      const pageRisks = clauseRisks.filter(r => {
                        const cl = clauses.find(c => c.clauseId === r.clauseId);
                        if (!cl) return false;
                        return getClausePageNumber(cl) === pageNum;
                      });

                      const maxScore = pageRisks.length > 0 ? Math.max(...pageRisks.map(r => r.riskScore)) : 0;
                      
                      let colorClass = 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10';
                      let statusDot = '⚪';
                      if (maxScore >= 81) {
                        colorClass = 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20';
                        statusDot = '🔴';
                      } else if (maxScore >= 61) {
                        colorClass = 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20';
                        statusDot = '🟠';
                      } else if (maxScore >= 41) {
                        colorClass = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20';
                        statusDot = '🟡';
                      } else if (maxScore >= 21) {
                        colorClass = 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20';
                        statusDot = '🔵';
                      } else if (maxScore >= 1) {
                        colorClass = 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20';
                        statusDot = '🟢';
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            const sec = contract.structuredText?.find(s => getSectionPageNumber(s.id) === pageNum);
                            if (sec) {
                              setActiveTab('viewer');
                              setTimeout(() => scrollToSection(sec.id), 100);
                            } else {
                              setActiveTab('viewer');
                            }
                          }}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold font-mono transition-all cursor-pointer ${colorClass}`}
                          title={`Page ${pageNum} - Max Risk: ${maxScore || 'None'}`}
                        >
                          <span>P. {pageNum}</span>
                          <span className="text-[8px] mt-0.5">{statusDot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Missing expected clauses Advisor */}
                {contract.missingClauses && contract.missingClauses.length > 0 && (
                  <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-3 glass-panel">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <ShieldAlert size={14} className="text-amber-500 animate-pulse" />
                      <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Missing Core Safeguards</h4>
                    </div>
                    
                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 text-2xs">
                      {contract.missingClauses.map((c: string) => (
                        <div key={c} className="rounded-xl border border-amber-500/10 bg-amber-500/3 p-2 text-3xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wide">
                            <AlertTriangle size={10} />
                            <span>{c} Clause Missing</span>
                          </div>
                          <p className="text-slate-400 font-sans leading-normal">
                            This agreement omits standard {c} protections. Consider negotiating it to shield liability.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operations & Refresh panel */}
                <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md space-y-3.5 glass-panel">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Sparkles size={14} className="text-red-400" />
                    <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Risk Actions</h4>
                  </div>
                  
                  <button
                    onClick={runRiskAnalysis}
                    disabled={isAnalyzingRisk}
                    className="w-full rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-400 py-2.5 text-2xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isAnalyzingRisk ? 'animate-spin' : ''} />
                    <span>{isAnalyzingRisk ? 'Refreshing Scores...' : 'Refresh Risk Scores'}</span>
                  </button>
                </div>
              </motion.div>
            )}

              {activeTab === 'summary' && (
                <motion.div
                  key="summary-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col h-full overflow-hidden"
                >
                  <SummaryTab
                    contract={contract}
                    onContractUpdate={async (patch) => {
                      try {
                        const docRef = doc(db, 'contracts', contract.contractId);
                        await updateDoc(docRef, patch as any);
                      } catch (err) {
                        console.error('Failed to update contract:', err);
                      }
                    }}
                  />
                </motion.div>
              )}
          </AnimatePresence>

        </div>

      </div>

      {/* CONFIRM DELETE MODAL DIALOG */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/10 bg-[#111827] p-5 shadow-2xl space-y-4 text-center glass-panel">
            <div className="flex justify-center text-red-400">
              <Trash2 size={36} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-200">Purge Agreement?</h3>
              <p className="text-2xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                Are you sure you want to permanently delete this contract? This deletes the Firestore record, physical file, and outline metadata. This action is irreversible.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2 text-xs">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 font-semibold text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <span>Delete Contract</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </PageContainer>
  );
};

export default ContractDetails;
