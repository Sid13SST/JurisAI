import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare,
  Sparkles,
  FileText,
  Layers,
  GitMerge,
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  Download,
  History,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  FileDown,
  Clock,
  X,
  Info,
} from 'lucide-react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Contract } from '../types/contractTypes';
import type {
  StoredComparison,
  MultiContractComparisonResult,
  RiskComparisonResult,
  VersionComparisonResult,
  SectionDiff,
  DiffToken,
} from '../types/comparisonTypes';
import {
  compareContracts,
  compareClauses,
  compareVersions,
  compareRisk,
  exportComparison,
  getComparisonHistory,
} from '../services/comparisonApi';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'contracts' | 'clauses' | 'versions' | 'risk';

interface HistoryEntry {
  comparisonId: string;
  comparisonType: string;
  contractsCompared: { contractId: string; contractName: string }[];
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLAUSE_TYPES = [
  'Liability',
  'Indemnification',
  'Payment',
  'Termination',
  'Confidentiality',
  'Intellectual Property',
  'Force Majeure',
  'Dispute Resolution',
];



const TAB_SCORE_COLORS = ['#4F46E5', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Running AI analysis…' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
    </div>
    <p className="text-xs text-slate-400 font-medium animate-pulse">{label}</p>
  </div>
);

const ErrorBanner: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
    <p className="text-xs text-red-300 flex-1 leading-relaxed">{message}</p>
    <button onClick={onDismiss} className="text-red-400 hover:text-red-300 shrink-0 cursor-pointer">
      <X size={14} />
    </button>
  </div>
);

const ContractSelector: React.FC<{
  label: string;
  slotLetter: string;
  color: string;
  value: string;
  contracts: Contract[];
  disabledIds: string[];
  onChange: (id: string) => void;
}> = ({ label, slotLetter, color, value, contracts, disabledIds, onChange }) => {
  const selected = contracts.find((c) => c.contractId === value);
  const riskColor =
    selected?.riskLevel === 'Critical'
      ? 'text-red-400'
      : selected?.riskLevel === 'High'
      ? 'text-orange-400'
      : selected?.riskLevel === 'Moderate'
      ? 'text-amber-400'
      : 'text-emerald-400';

  return (
    <div className="rounded-2xl border border-white/5 bg-[#111827]/30 p-4 space-y-3 backdrop-blur-md hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-3xs font-bold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {slotLetter}
        </span>
        <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">{label}</label>
      </div>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/5 bg-[#0d1117] py-2 pl-3 pr-8 text-xs text-slate-200 outline-none appearance-none cursor-pointer focus:border-primary/40 transition-colors"
        >
          <option value="">— Select contract —</option>
          {contracts.map((c) => (
            <option key={c.contractId} value={c.contractId} disabled={disabledIds.includes(c.contractId)}>
              {c.contractName}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>

      {selected && (
        <div className="flex items-center justify-between text-3xs">
          <span className="text-slate-500 uppercase font-semibold tracking-wider">{selected.contractCategory}</span>
          <span className={`font-bold ${riskColor}`}>
            {selected.overallRiskScore !== undefined ? `${selected.overallRiskScore}/100 risk` : selected.riskLevel ?? 'Not analyzed'}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const Comparison: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // ── Contract loading ──────────────────────────────────────────────────────
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'contracts'), where('userId', '==', currentUser.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Contract[] = [];
        snap.forEach((d) => list.push(d.data() as Contract));
        setContracts(list.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
        setContractsLoading(false);
      },
      () => {
        showToast('Failed to load contract repository.', 'error');
        setContractsLoading(false);
      }
    );
    return unsub;
  }, [currentUser, showToast]);

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('contracts');

  // ── Shared slot selection ─────────────────────────────────────────────────
  const [slotA, setSlotA] = useState('');
  const [slotB, setSlotB] = useState('');
  const [slotC, setSlotC] = useState(''); // contracts tab only (3-way)

  // ── Clause-specific ───────────────────────────────────────────────────────
  const [clauseType, setClauseType] = useState(CLAUSE_TYPES[0]);

  // ── Results & loading ─────────────────────────────────────────────────────
  const [result, setResult] = useState<StoredComparison | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── Export ────────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  // ── History sidebar ───────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const HISTORY_PAGE_SIZE = 5;

  // ── Diff expand ───────────────────────────────────────────────────────────
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const resetResult = () => {
    setResult(null);
    setAnalysisError(null);
  };

  const getContract = (id: string) => contracts.find((c) => c.contractId === id);

  // ── History loading ───────────────────────────────────────────────────────
  const loadHistory = useCallback(
    async (page: number) => {
      setHistoryLoading(true);
      try {
        const offset = page * HISTORY_PAGE_SIZE;
        const data = await getComparisonHistory(HISTORY_PAGE_SIZE, offset);
        if (page === 0) {
          setHistory(data.history as HistoryEntry[]);
        } else {
          setHistory((prev) => [...prev, ...(data.history as HistoryEntry[])]);
        }
        setHistoryHasMore(data.history.length === HISTORY_PAGE_SIZE);
      } catch {
        showToast('Failed to load comparison history.', 'error');
      } finally {
        setHistoryLoading(false);
      }
    },
    [showToast]
  );

  const openHistory = () => {
    setShowHistory(true);
    setHistoryPage(0);
    loadHistory(0);
  };

  const loadMoreHistory = () => {
    const next = historyPage + 1;
    setHistoryPage(next);
    loadHistory(next);
  };

  // ── Run analysis ──────────────────────────────────────────────────────────
  const runAnalysis = async () => {
    setAnalysisError(null);
    setResult(null);

    try {
      setIsAnalyzing(true);

      let res: StoredComparison;

      if (activeTab === 'contracts') {
        const ids = [slotA, slotB, slotC].filter(Boolean);
        if (ids.length < 2) {
          showToast('Please select at least two contracts to compare.', 'warning');
          return;
        }
        res = await compareContracts({ contractIds: ids });
      } else if (activeTab === 'clauses') {
        if (!slotA || !slotB) {
          showToast('Please select two contracts for clause comparison.', 'warning');
          return;
        }
        const ids = slotC ? [slotA, slotB, slotC] : [slotA, slotB];
        res = await compareClauses({ contractIds: ids, clauseType });
      } else if (activeTab === 'versions') {
        if (!slotA || !slotB) {
          showToast('Please select Original and Revised contracts.', 'warning');
          return;
        }
        res = await compareVersions({ originalContractId: slotA, revisedContractId: slotB });
      } else {
        const ids = [slotA, slotB, slotC].filter(Boolean);
        if (ids.length < 2) {
          showToast('Please select at least two contracts for risk comparison.', 'warning');
          return;
        }
        res = await compareRisk({ contractIds: ids });
      }

      setResult(res);
      showToast('AI analysis complete.', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Analysis failed. Please try again.';
      setAnalysisError(msg);
      showToast(msg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!result) return;
    setIsExporting(true);
    try {
      const data = await exportComparison({ comparisonId: result.comparisonId, format });
      // Decode base64 and trigger download
      const byteCharacters = atob(data.contentBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`${format.toUpperCase()} report downloaded.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Export failed.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB DEFINITIONS
  // ─────────────────────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'contracts',
      label: 'Contract Overview',
      icon: <GitCompare size={15} />,
      description: 'Full cross-contract AI comparison across all clauses and risk categories.',
    },
    {
      id: 'clauses',
      label: 'Clause Deep-Dive',
      icon: <Layers size={15} />,
      description: 'Isolate a specific clause type and compare it across selected contracts.',
    },
    {
      id: 'versions',
      label: 'Version Diff',
      icon: <GitMerge size={15} />,
      description: 'Compare an original and revised draft, with word-level diff highlighting.',
    },
    {
      id: 'risk',
      label: 'Risk Analysis',
      icon: <ShieldAlert size={15} />,
      description: 'Side-by-side risk score breakdown with AI-generated delta explanations.',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RESULT RENDERERS
  // ─────────────────────────────────────────────────────────────────────────

  const renderContractResult = () => {
    if (!result) return null;
    const data = result.results as MultiContractComparisonResult;
    if (!data?.summary) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResultCard title="Key Differences" icon={<Info size={14} />} color="indigo">
            <ul className="space-y-2">
              {data.summary.keyDifferences.map((d, i) => (
                <li key={i} className="flex gap-2 text-2xs text-slate-300 leading-relaxed">
                  <span className="text-indigo-400 shrink-0 mt-0.5">▸</span>
                  {d}
                </li>
              ))}
            </ul>
          </ResultCard>
          <ResultCard title="Top Risks" icon={<ShieldAlert size={14} />} color="red">
            <ul className="space-y-2">
              {data.summary.topRisks.map((r, i) => (
                <li key={i} className="flex gap-2 text-2xs text-slate-300 leading-relaxed">
                  <span className="text-red-400 shrink-0 mt-0.5">▸</span>
                  {r}
                </li>
              ))}
            </ul>
          </ResultCard>
          <ResultCard title="Business Impact" icon={<TrendingUp size={14} />} color="amber">
            <ul className="space-y-2">
              {data.summary.businessImpact.map((b, i) => (
                <li key={i} className="flex gap-2 text-2xs text-slate-300 leading-relaxed">
                  <span className="text-amber-400 shrink-0 mt-0.5">▸</span>
                  {b}
                </li>
              ))}
            </ul>
          </ResultCard>
          <ResultCard title="Negotiation Considerations" icon={<FileText size={14} />} color="cyan">
            <ul className="space-y-2">
              {data.summary.negotiationConsiderations.map((n, i) => (
                <li key={i} className="flex gap-2 text-2xs text-slate-300 leading-relaxed">
                  <span className="text-cyan-400 shrink-0 mt-0.5">▸</span>
                  {n}
                </li>
              ))}
            </ul>
          </ResultCard>
        </div>

        {/* Similarity Scores */}
        {data.overallSimilarityScores && Object.keys(data.overallSimilarityScores).length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md">
            <SectionHeader title="Similarity Scores" badge="Cross-Contract" className="mb-5" />
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(data.overallSimilarityScores).map(([pair, score]) => ({
                    pair: pair.replace('_vs_', ' vs ').substring(0, 24),
                    score: Math.round(score),
                  }))}
                  margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="pair" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    labelStyle={{ color: '#e2e8f0', fontSize: 11 }}
                    itemStyle={{ color: '#94a3b8', fontSize: 11 }}
                  />
                  <Bar dataKey="score" name="Similarity %" radius={[4, 4, 0, 0]}>
                    {Object.keys(data.overallSimilarityScores).map((_, i) => (
                      <Cell key={i} fill={TAB_SCORE_COLORS[i % TAB_SCORE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Unusual Clauses */}
        {data.unusualClauses?.length > 0 && (
          <div className="rounded-2xl border border-amber-500/10 bg-amber-500/3 p-5 space-y-3">
            <SectionHeader title="Unusual Clauses Detected" badge="Flagged" className="mb-3" />
            <div className="space-y-3">
              {data.unusualClauses.map((u, i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-[#111827]/40 p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">{u.clauseType}</span>
                    <span className="text-3xs text-slate-500">{u.contractName}</span>
                  </div>
                  <p className="text-2xs text-slate-300 leading-relaxed">{u.explanation}</p>
                  <p className="text-2xs text-slate-500 italic">{u.whyUnusual}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClauseResult = () => {
    if (!result) return null;
    const data = result.results as MultiContractComparisonResult;
    if (!data?.categories) return null;

    return (
      <div className="space-y-4">
        {Object.entries(data.categories).map(([key, cat]) => (
          <div key={key} className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-sm text-slate-200 capitalize">{key.replace(/_/g, ' ')}</h4>
              <span className="text-3xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2.5 py-0.5">
                {Math.round(cat.similarityScore)}% similar
              </span>
            </div>
            <p className="text-2xs text-slate-300 leading-relaxed">{cat.explanation}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/3 border border-white/5 p-3 space-y-1">
                <p className="text-3xs font-bold uppercase text-slate-500 tracking-wider">Business Impact</p>
                <p className="text-2xs text-slate-300 leading-relaxed">{cat.businessImpact}</p>
              </div>
              <div className="rounded-lg bg-white/3 border border-white/5 p-3 space-y-1">
                <p className="text-3xs font-bold uppercase text-slate-500 tracking-wider">Risk Impact</p>
                <p className="text-2xs text-slate-300 leading-relaxed">{cat.riskImpact}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDiffTokens = (tokens: DiffToken[]) => (
    <p className="font-mono text-2xs leading-relaxed break-words whitespace-pre-wrap">
      {tokens.map((tok, i) => (
        <span
          key={i}
          className={
            tok.type === 'added'
              ? 'bg-emerald-500/20 text-emerald-300'
              : tok.type === 'removed'
              ? 'bg-red-500/20 text-red-300 line-through'
              : 'text-slate-400'
          }
        >
          {tok.value}
        </span>
      ))}
    </p>
  );

  const renderVersionResult = () => {
    if (!result) return null;
    const data = result.results as VersionComparisonResult;
    if (!data?.diffSummary) return null;
    const originalName = getContract(data.originalContractId)?.contractName ?? 'Original';
    const revisedName = getContract(data.revisedContractId)?.contractName ?? 'Revised';

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 lg:col-span-2 space-y-3 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5">
                AI Diff Summary
              </span>
            </div>
            <p className="text-2xs text-slate-300 leading-relaxed">{data.diffSummary.explanation}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg bg-white/3 border border-white/5 p-3">
                <p className="text-3xs font-bold uppercase text-slate-500 mb-1">Business Impact</p>
                <p className="text-2xs text-slate-300 leading-relaxed">{data.diffSummary.businessImpact}</p>
              </div>
              <div className="rounded-lg bg-white/3 border border-white/5 p-3">
                <p className="text-3xs font-bold uppercase text-slate-500 mb-1">Risk Impact</p>
                <p className="text-2xs text-slate-300 leading-relaxed">{data.diffSummary.riskImpact}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 flex flex-col items-center justify-center gap-3 backdrop-blur-md">
            <p className="text-3xs font-bold uppercase text-slate-500 tracking-wider">Similarity Score</p>
            <div className="relative h-32 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  startAngle={90}
                  endAngle={-270}
                  data={[{ value: Math.round(data.diffSummary.similarityScore), fill: '#4F46E5' }]}
                >
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.03)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-white">{Math.round(data.diffSummary.similarityScore)}</span>
                <span className="text-3xs text-slate-500 font-semibold">/ 100</span>
              </div>
            </div>
            <p className="text-2xs text-slate-400 text-center">Overall textual overlap between versions</p>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 py-2 text-xs font-bold text-indigo-400">
            ← {originalName} (Original)
          </div>
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 py-2 text-xs font-bold text-violet-400">
            {revisedName} (Revised) →
          </div>
        </div>

        {/* Section Diffs */}
        <div className="space-y-3">
          {data.sectionDiffs.map((sec: SectionDiff) => (
            <div key={sec.sectionNumber} className="rounded-2xl border border-white/5 bg-[#111827]/20 overflow-hidden">
              <button
                onClick={() => setExpandedDiff(expandedDiff === sec.sectionNumber ? null : sec.sectionNumber)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="font-mono text-3xs text-slate-500 shrink-0">§{sec.sectionNumber}</span>
                  <span className="font-heading font-bold text-xs text-slate-200">{sec.title}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-500 transition-transform shrink-0 ${expandedDiff === sec.sectionNumber ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {expandedDiff === sec.sectionNumber && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/5 p-4 space-y-4">
                      {sec.explanation && (
                        <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/15 p-3">
                          <p className="text-2xs text-cyan-300 leading-relaxed">{sec.explanation}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl bg-red-500/3 border border-red-500/10 p-4">
                          <p className="text-3xs font-bold uppercase text-red-400 mb-2 tracking-wider">Original</p>
                          <p className="font-mono text-2xs text-slate-400 leading-relaxed break-words">{sec.originalContent}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-500/3 border border-emerald-500/10 p-4">
                          <p className="text-3xs font-bold uppercase text-emerald-400 mb-2 tracking-wider">Revised</p>
                          <p className="font-mono text-2xs text-slate-400 leading-relaxed break-words">{sec.revisedContent}</p>
                        </div>
                      </div>
                      {sec.diffs?.length > 0 && (
                        <div className="rounded-xl bg-white/2 border border-white/5 p-4">
                          <p className="text-3xs font-bold uppercase text-slate-500 mb-2 tracking-wider">Word-Level Diff</p>
                          {renderDiffTokens(sec.diffs)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRiskResult = () => {
    if (!result) return null;
    const data = result.results as RiskComparisonResult;
    if (!data?.overallScores) return null;

    const scoreEntries = Object.entries(data.overallScores);


    return (
      <div className="space-y-6">
        {/* Score Overview */}
        <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md">
          <SectionHeader title="Overall Risk Scores" badge="Score Radial" className="mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scoreEntries.map(([contractId, info], i) => {
              const riskColor =
                info.riskLevel === 'Critical'
                  ? '#ef4444'
                  : info.riskLevel === 'High'
                  ? '#f97316'
                  : info.riskLevel === 'Moderate'
                  ? '#f59e0b'
                  : '#22c55e';

              return (
                <div key={contractId} className="flex flex-col items-center gap-2">
                  <div className="relative h-36 w-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="90%"
                        startAngle={90}
                        endAngle={-270}
                        data={[{ value: info.score, fill: TAB_SCORE_COLORS[i % TAB_SCORE_COLORS.length] }]}
                      >
                        <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.03)' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-extrabold" style={{ color: riskColor }}>
                        {info.score}
                      </span>
                      <span className="text-3xs text-slate-500 font-semibold">/ 100</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-300 text-center truncate max-w-[140px]">{info.contractName}</p>
                  <span
                    className="text-3xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                    style={{
                      color: riskColor,
                      borderColor: `${riskColor}30`,
                      backgroundColor: `${riskColor}10`,
                    }}
                  >
                    {info.riskLevel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Breakdown Bars */}
        {data.riskBreakdowns && Object.keys(data.riskBreakdowns).length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md">
            <SectionHeader title="Risk Category Breakdown" badge="Per Contract" className="mb-5" />
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={['Financial', 'Legal', 'Operational', 'Reputational'].map((cat) => {
                    const row: Record<string, any> = { category: cat };
                    Object.entries(data.riskBreakdowns).forEach(([cid, breakdown]) => {
                      const name = data.overallScores[cid]?.contractName?.substring(0, 12) ?? cid.substring(0, 8);
                      row[name] = (breakdown as Record<string, number>)[cat] ?? 0;
                    });
                    return row;
                  })}
                  margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="category" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    labelStyle={{ color: '#e2e8f0', fontSize: 11 }}
                    itemStyle={{ fontSize: 11 }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, color: '#94A3B8' }} />
                  {Object.entries(data.riskBreakdowns).map(([cid], i) => {
                    const name = data.overallScores[cid]?.contractName?.substring(0, 12) ?? cid.substring(0, 8);
                    return (
                      <Bar
                        key={cid}
                        dataKey={name}
                        fill={TAB_SCORE_COLORS[i % TAB_SCORE_COLORS.length]}
                        radius={[3, 3, 0, 0]}
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI Explanation */}
        {data.aiExplanation && (
          <div className="rounded-2xl border border-primary/10 bg-primary/3 p-5 space-y-4 backdrop-blur-md">
            <SectionHeader title="AI Risk Delta Analysis" badge="Gemini Insight" className="mb-2" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/3 border border-white/5 p-4">
                <p className="text-3xs font-bold uppercase text-indigo-400 mb-2">Risk Delta</p>
                <p className="text-2xs text-slate-300 leading-relaxed">{data.aiExplanation.deltaExplanation}</p>
              </div>
              <div className="rounded-xl bg-white/3 border border-white/5 p-4">
                <p className="text-3xs font-bold uppercase text-amber-400 mb-2">Business Impact</p>
                <p className="text-2xs text-slate-300 leading-relaxed">{data.aiExplanation.businessImpact}</p>
              </div>
              <div className="rounded-xl bg-white/3 border border-white/5 p-4">
                <p className="text-3xs font-bold uppercase text-cyan-400 mb-2">Practical Significance</p>
                <p className="text-2xs text-slate-300 leading-relaxed">{data.aiExplanation.practicalSignificance}</p>
              </div>
            </div>
          </div>
        )}

        {/* Critical Risks */}
        {data.criticalRisks && Object.values(data.criticalRisks).some((arr) => arr.length > 0) && (
          <div className="rounded-2xl border border-red-500/10 bg-red-500/3 p-5 space-y-3 backdrop-blur-md">
            <SectionHeader title="Critical Risk Flags" badge="Immediate Review" className="mb-2" />
            {Object.entries(data.criticalRisks).map(([cid, issues]) =>
              issues.length > 0 ? (
                <div key={cid} className="space-y-2">
                  <p className="text-3xs font-bold uppercase text-slate-500 tracking-wider">
                    {data.overallScores[cid]?.contractName ?? cid}
                  </p>
                  {issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-white/5 bg-[#111827]/30 p-3">
                      <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-2xs font-semibold text-slate-200">{issue.title}</p>
                        <p className="text-2xs text-slate-400 leading-relaxed">{issue.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const canRun = () => {
    if (contractsLoading) return false;
    if (activeTab === 'versions') return Boolean(slotA && slotB && slotA !== slotB);
    const ids = [slotA, slotB, slotC].filter(Boolean);
    return ids.length >= 2;
  };

  const getRiskDelta = () => {
    const a = getContract(slotA)?.overallRiskScore;
    const b = getContract(slotB)?.overallRiskScore;
    if (a === undefined || b === undefined) return null;
    return b - a;
  };

  const delta = getRiskDelta();

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <PageContainer
      title="Comparison Suite"
      subtitle="AI-powered side-by-side legal contract analysis — clauses, versions, and risk deltas."
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={openHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <History size={13} />
            <span>History</span>
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-indigo-400">
            <Sparkles size={12} className="animate-pulse" />
            <span>AI Comparison Engine</span>
          </div>
        </div>
      }
    >
      <div className="flex gap-6 relative">
        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Tab Bar */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/5 bg-[#111827]/30 p-1.5 backdrop-blur-md overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  resetResult();
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Description */}
          <p className="text-xs text-slate-500 -mt-2">
            {tabs.find((t) => t.id === activeTab)?.description}
          </p>

          {/* Contract Selectors */}
          {contractsLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw size={13} className="animate-spin" />
              Loading contract repository…
            </div>
          ) : contracts.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-8 text-center space-y-2">
              <FileText size={32} className="mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No contracts found</p>
              <p className="text-xs text-slate-500">Upload contracts in the Vault before running comparisons.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'versions' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ContractSelector
                    label="Original Contract"
                    slotLetter="O"
                    color="#4F46E5"
                    value={slotA}
                    contracts={contracts}
                    disabledIds={[slotB]}
                    onChange={(id) => { setSlotA(id); resetResult(); }}
                  />
                  <ContractSelector
                    label="Revised Contract"
                    slotLetter="R"
                    color="#7C3AED"
                    value={slotB}
                    contracts={contracts}
                    disabledIds={[slotA]}
                    onChange={(id) => { setSlotB(id); resetResult(); }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ContractSelector
                    label="Contract A"
                    slotLetter="A"
                    color="#4F46E5"
                    value={slotA}
                    contracts={contracts}
                    disabledIds={[slotB, slotC]}
                    onChange={(id) => { setSlotA(id); resetResult(); }}
                  />
                  <ContractSelector
                    label="Contract B"
                    slotLetter="B"
                    color="#7C3AED"
                    value={slotB}
                    contracts={contracts}
                    disabledIds={[slotA, slotC]}
                    onChange={(id) => { setSlotB(id); resetResult(); }}
                  />
                  <ContractSelector
                    label="Contract C (Optional)"
                    slotLetter="C"
                    color="#06B6D4"
                    value={slotC}
                    contracts={contracts}
                    disabledIds={[slotA, slotB]}
                    onChange={(id) => { setSlotC(id); resetResult(); }}
                  />
                </div>
              )}

              {/* Clause Type Selector */}
              {activeTab === 'clauses' && (
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#111827]/30 p-4">
                  <Layers size={14} className="text-indigo-400 shrink-0" />
                  <label className="text-xs font-semibold text-slate-400 shrink-0">Clause Type:</label>
                  <div className="relative flex-1">
                    <select
                      value={clauseType}
                      onChange={(e) => { setClauseType(e.target.value); resetResult(); }}
                      className="w-full rounded-xl border border-white/5 bg-[#0d1117] py-1.5 pl-3 pr-8 text-xs text-slate-200 outline-none appearance-none cursor-pointer focus:border-primary/40 transition-colors"
                    >
                      {CLAUSE_TYPES.map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Risk Delta Preview */}
              {(activeTab === 'contracts' || activeTab === 'risk') && slotA && slotB && delta !== null && (
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold ${
                  delta > 10 ? 'border-red-500/20 bg-red-500/5 text-red-400' :
                  delta < -10 ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' :
                  'border-white/5 bg-white/3 text-slate-400'
                }`}>
                  {delta > 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                  <span>
                    Risk delta between A and B:{' '}
                    <strong>{delta > 0 ? '+' : ''}{delta} pts</strong>
                  </span>
                </div>
              )}

              {/* Run Button */}
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing || !canRun()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Running AI Analysis…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Run {tabs.find((t) => t.id === activeTab)?.label} Analysis
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Banner */}
          {analysisError && (
            <ErrorBanner message={analysisError} onDismiss={() => setAnalysisError(null)} />
          )}

          {/* Loading State */}
          {isAnalyzing && <LoadingSpinner />}

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && !isAnalyzing && (
              <motion.div
                key={result.comparisonId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* Result Header + Export */}
                <div className="flex items-center justify-between border-t border-white/5 pt-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Analysis Complete</span>
                    <span className="text-3xs text-slate-600 font-mono">
                      {new Date(result.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-2xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <FileDown size={12} />
                      PDF
                    </button>
                    <button
                      onClick={() => handleExport('docx')}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-2xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Download size={12} />
                      DOCX
                    </button>
                  </div>
                </div>

                {/* Render tab-specific result */}
                {activeTab === 'contracts' && renderContractResult()}
                {activeTab === 'clauses' && renderClauseResult()}
                {activeTab === 'versions' && renderVersionResult()}
                {activeTab === 'risk' && renderRiskResult()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── History Sidebar ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {showHistory && (
            <motion.aside
              initial={{ opacity: 0, x: 40, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 300 }}
              exit={{ opacity: 0, x: 40, width: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="shrink-0 overflow-hidden"
              style={{ width: 300 }}
            >
              <div className="w-[300px] rounded-2xl border border-white/5 bg-[#111827]/40 backdrop-blur-md overflow-hidden">
                {/* Sidebar header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">Comparison History</span>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* History list */}
                <div className="divide-y divide-white/5 max-h-[calc(100vh-260px)] overflow-y-auto">
                  {historyLoading && history.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <RefreshCw size={14} className="animate-spin text-primary" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-xs text-slate-500">No comparisons yet.</p>
                    </div>
                  ) : (
                    history.map((entry) => (
                      <div key={entry.comparisonId} className="p-4 hover:bg-white/2 transition-colors space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                            style={{
                              color:
                                entry.comparisonType === 'risk'
                                  ? '#f97316'
                                  : entry.comparisonType === 'versions'
                                  ? '#7C3AED'
                                  : entry.comparisonType === 'clauses'
                                  ? '#06B6D4'
                                  : '#4F46E5',
                              borderColor:
                                entry.comparisonType === 'risk'
                                  ? '#f9731630'
                                  : entry.comparisonType === 'versions'
                                  ? '#7C3AED30'
                                  : entry.comparisonType === 'clauses'
                                  ? '#06B6D430'
                                  : '#4F46E530',
                              backgroundColor:
                                entry.comparisonType === 'risk'
                                  ? '#f9731610'
                                  : entry.comparisonType === 'versions'
                                  ? '#7C3AED10'
                                  : entry.comparisonType === 'clauses'
                                  ? '#06B6D410'
                                  : '#4F46E510',
                            }}
                          >
                            {entry.comparisonType}
                          </span>
                          <span className="text-3xs text-slate-600 font-mono flex items-center gap-1">
                            <Clock size={9} />
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {entry.contractsCompared.map((c) => (
                            <p key={c.contractId} className="text-2xs text-slate-400 truncate">
                              • {c.contractName}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Load more */}
                {historyHasMore && !historyLoading && (
                  <div className="p-3 border-t border-white/5">
                    <button
                      onClick={loadMoreHistory}
                      className="w-full rounded-lg border border-white/5 bg-white/3 py-2 text-2xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ChevronRight size={12} />
                      Load More
                    </button>
                  </div>
                )}
                {historyLoading && history.length > 0 && (
                  <div className="p-3 flex justify-center">
                    <RefreshCw size={12} className="animate-spin text-slate-500" />
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
};

// ─── Result Card Helper ────────────────────────────────────────────────────────

const colorMap: Record<string, { border: string; bg: string; icon: string }> = {
  indigo: { border: 'border-indigo-500/10', bg: 'bg-indigo-500/3', icon: 'text-indigo-400' },
  red: { border: 'border-red-500/10', bg: 'bg-red-500/3', icon: 'text-red-400' },
  amber: { border: 'border-amber-500/10', bg: 'bg-amber-500/3', icon: 'text-amber-400' },
  cyan: { border: 'border-cyan-500/10', bg: 'bg-cyan-500/3', icon: 'text-cyan-400' },
};

const ResultCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}> = ({ title, icon, color, children }) => {
  const style = colorMap[color] ?? colorMap.indigo;
  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-5 space-y-3 backdrop-blur-md`}>
      <div className={`flex items-center gap-2 ${style.icon}`}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
};

export default Comparison;
