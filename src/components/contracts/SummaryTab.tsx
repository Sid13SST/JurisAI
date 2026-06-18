import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Gavel,
  PieChart,
  TrendingUp,
  Eye,
  History,
  Building2,
  Users,
  ShieldAlert,
  ShieldCheck,
  Target,
  Lightbulb,
  Clock,
  FileType
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type {
  Contract,
  ExecutiveSummaryData,
  BusinessSummaryData,
  LegalSummaryData,
  StoredSummary,
  SummaryType,
  ReportType,
  ReportFormat,
  StoredReport
} from '../../types/contractTypes';

interface SummaryTabProps {
  contract: Contract;
  onContractUpdate: (patch: Partial<Contract>) => Promise<void> | void;
}

type SummaryView = 'executive' | 'business' | 'legal';
type ReportTypeOption = ReportType;

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'border-red-500/30 bg-red-500/5 text-red-300',
  High: 'border-orange-500/30 bg-orange-500/5 text-orange-300',
  Medium: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
  Low: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300'
};

const SEVERITY_BADGE: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
};

const PRIORITY_COLORS: Record<string, string> = {
  Immediate: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
};

const RISK_SCORE_COLOR = (s: number) =>
  s >= 81 ? 'text-red-400' : s >= 61 ? 'text-orange-400' : s >= 41 ? 'text-yellow-400' : s >= 21 ? 'text-cyan-400' : 'text-emerald-400';
const RISK_SCORE_BG = (s: number) =>
  s >= 81 ? 'bg-red-500/10 border-red-500/20' : s >= 61 ? 'bg-orange-500/10 border-orange-500/20' : s >= 41 ? 'bg-yellow-500/10 border-yellow-500/20' : s >= 21 ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

const RISK_LEVEL_COLOR = (l: string) => {
  switch (l) {
    case 'Critical': return 'text-red-400 border-red-500/30 bg-red-500/10';
    case 'High': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    case 'Moderate': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    case 'Low': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    case 'Very Low': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
  }
};

const base64ToBlob = (b64: string, mime: string): Blob => {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

const triggerDownload = (b64: string, fileName: string, mime: string) => {
  const blob = base64ToBlob(b64, mime);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

interface LoadingState {
  isGenerating: boolean;
  isDownloadingPdf: boolean;
  isDownloadingDocx: boolean;
  error: string | null;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ contract, onContractUpdate }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [view, setView] = useState<SummaryView>('executive');
  const [summaries, setSummaries] = useState<StoredSummary[]>([]);
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [showReportHistory, setShowReportHistory] = useState(false);

  const [state, setState] = useState<LoadingState>({
    isGenerating: false,
    isDownloadingPdf: false,
    isDownloadingDocx: false,
    error: null
  });

  const fetchSummaries = async () => {
    if (!currentUser) return;
    setLoadingSummaries(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`https://jurisai-feks.onrender.com/api/ai/summary/${contract.contractId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummaries(data.summaries || []);
      }
    } catch (err: any) {
      console.error('Failed to load summaries:', err);
    } finally {
      setLoadingSummaries(false);
    }
  };

  const fetchReports = async () => {
    if (!currentUser) return;
    setLoadingReports(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`https://jurisai-feks.onrender.com/api/ai/report/list/${contract.contractId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
    fetchReports();
  }, [contract.contractId]);

  const executive = useMemo(() => summaries.find(s => s.summaryType === 'executive')?.data as ExecutiveSummaryData | undefined, [summaries]);
  const business = useMemo(() => summaries.find(s => s.summaryType === 'business')?.data as BusinessSummaryData | undefined, [summaries]);
  const legal = useMemo(() => summaries.find(s => s.summaryType === 'legal')?.data as LegalSummaryData | undefined, [summaries]);

  const handleGenerate = async (summaryType: SummaryType | 'all') => {
    if (!currentUser) return;
    setState(s => ({ ...s, isGenerating: true, error: null }));
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('https://jurisai-feks.onrender.com/api/ai/summary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ contractId: contract.contractId, summaryType })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Summary generation failed.');
      }
      showToast('Summary generated successfully.', 'success');
      await fetchSummaries();
      if (onContractUpdate) await onContractUpdate({ summaryStatus: 'completed' });
    } catch (err: any) {
      console.error(err);
      setState(s => ({ ...s, error: err.message }));
      showToast(err.message || 'Summary generation failed.', 'error');
    } finally {
      setState(s => ({ ...s, isGenerating: false }));
    }
  };

  const handleDownload = async (format: ReportFormat, reportType: ReportTypeOption = 'full') => {
    if (!currentUser) return;
    const isPdf = format === 'pdf';
    setState(s => ({ ...s, isDownloadingPdf: isPdf, isDownloadingDocx: !isPdf, error: null }));
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('https://jurisai-feks.onrender.com/api/ai/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ contractId: contract.contractId, reportType, format })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Report generation failed.');
      }
      const data = await res.json();
      const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      triggerDownload(data.contentBase64, data.fileName, mime);
      showToast(`${format.toUpperCase()} report downloaded.`, 'success');
      await fetchReports();
    } catch (err: any) {
      console.error(err);
      setState(s => ({ ...s, error: err.message }));
      showToast(err.message || 'Report download failed.', 'error');
    } finally {
      setState(s => ({ ...s, isDownloadingPdf: false, isDownloadingDocx: false }));
    }
  };

  const handleReDownload = async (reportId: string) => {
    if (!currentUser) return;
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`https://jurisai-feks.onrender.com/api/ai/report/download/${reportId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Re-download failed.');
      }
      const data = await res.json();
      const mime = data.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      triggerDownload(data.contentBase64, data.fileName, mime);
      showToast('Report downloaded.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Re-download failed.', 'error');
    }
  };

  // === Empty / Not Started State ===
  if (!loadingSummaries && summaries.length === 0 && !state.isGenerating) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-y-auto pr-2 space-y-4">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
            <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/5">
              <Sparkles size={36} className="animate-pulse" />
            </div>
          </motion.div>
          <div className="space-y-2 max-w-md">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-100">
              Executive Intelligence Engine
            </h3>
            <p className="text-2xs text-slate-400 leading-relaxed">
              Transform this contract into a plain-English briefing for non-lawyers. Generate executive, business, and legal summaries, identify negotiation points, and produce polished PDF / DOCX reports.
            </p>
          </div>
          {state.error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 max-w-md text-3xs text-red-400 flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}
          <button
            onClick={() => handleGenerate('all')}
            disabled={state.isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-95 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={14} />
            <span>Generate Executive Briefing</span>
          </button>
        </div>
      </div>
    );
  }

  // === Loading state (initial generation) ===
  if (state.isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl animate-pulse" />
          <div className="relative h-20 w-20 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-center text-purple-400 animate-spin">
            <RefreshCw size={36} />
          </div>
        </div>
        <div className="space-y-2 max-w-md">
          <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-100 animate-pulse">
            Generating Plain-English Briefing...
          </h3>
          <p className="text-2xs text-slate-400 leading-relaxed">
            Composing executive, business, and legal narratives from extracted clauses and risk analysis. This typically takes 15-30 seconds.
          </p>
        </div>
        <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-[loading_1.5s_infinite_linear]" style={{ width: '50%' }} />
        </div>
      </div>
    );
  }

  // === Main dashboard ===
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto pr-2 space-y-4">
      {/* === Top Action Bar === */}
      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 bg-[#0A0A0F]/95 backdrop-blur-md py-3 -mt-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400" />
          <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Executive Intelligence</h4>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[8px] font-extrabold uppercase text-purple-400 tracking-wide">
            {summaries.length} / 3 Summaries
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowReportHistory(s => !s)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-3xs font-bold uppercase text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <History size={11} />
            <span>Report History ({reports.length})</span>
          </button>
          <button
            onClick={() => handleDownload('pdf', 'full')}
            disabled={state.isDownloadingPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-95 px-3 py-1.5 text-3xs font-bold uppercase text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {state.isDownloadingPdf ? <RefreshCw size={11} className="animate-spin" /> : <FileText size={11} />}
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleDownload('docx', 'full')}
            disabled={state.isDownloadingDocx}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-95 px-3 py-1.5 text-3xs font-bold uppercase text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {state.isDownloadingDocx ? <RefreshCw size={11} className="animate-spin" /> : <FileType size={11} />}
            <span>DOCX</span>
          </button>
        </div>
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2.5 text-3xs text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          <div className="space-y-1">
            <span className="block font-bold">Error</span>
            <p className="leading-relaxed">{state.error}</p>
          </div>
        </div>
      )}

      {/* === Visual Insights / Executive Cards === */}
      {executive && <ExecutiveCards summary={executive} />}

      {/* === View Switcher === */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-px">
        {[
          { key: 'executive' as SummaryView, label: 'Executive Summary', icon: <Target size={11} /> },
          { key: 'business' as SummaryView, label: 'Business Summary', icon: <Briefcase size={11} /> },
          { key: 'legal' as SummaryView, label: 'Legal Summary', icon: <Gavel size={11} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            disabled={!summaries.find(s => s.summaryType === tab.key)}
            className={`relative py-2.5 px-4 text-2xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed ${
              view === tab.key ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {view === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {summaries.find(s => s.summaryType === view) && (
            <button
              onClick={() => handleGenerate(view)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-2xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={10} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* === View Content === */}
      <AnimatePresence mode="wait">
        {view === 'executive' && executive && (
          <motion.div
            key="executive"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <ExecutiveView summary={executive} />
          </motion.div>
        )}

        {view === 'business' && business && (
          <motion.div
            key="business"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <BusinessView summary={business} />
          </motion.div>
        )}

        {view === 'legal' && legal && (
          <motion.div
            key="legal"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <LegalView summary={legal} />
          </motion.div>
        )}

        {view === 'executive' && !executive && (
          <div className="rounded-xl border border-dashed border-white/5 p-6 text-center text-3xs text-slate-500">
            Executive summary not yet generated.
            <button onClick={() => handleGenerate('executive')} className="ml-2 text-purple-400 hover:underline">Generate now</button>
          </div>
        )}
        {view === 'business' && !business && (
          <div className="rounded-xl border border-dashed border-white/5 p-6 text-center text-3xs text-slate-500">
            Business summary not yet generated.
            <button onClick={() => handleGenerate('business')} className="ml-2 text-purple-400 hover:underline">Generate now</button>
          </div>
        )}
        {view === 'legal' && !legal && (
          <div className="rounded-xl border border-dashed border-white/5 p-6 text-center text-3xs text-slate-500">
            Legal summary not yet generated.
            <button onClick={() => handleGenerate('legal')} className="ml-2 text-purple-400 hover:underline">Generate now</button>
          </div>
        )}
      </AnimatePresence>

      {/* === Report History === */}
      <AnimatePresence>
        {showReportHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-white/5 bg-[#111827]/30 p-4 space-y-3"
          >
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <History size={12} className="text-purple-400" />
              <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Report History</h4>
            </div>
            {loadingReports ? (
              <p className="text-3xs text-slate-500 text-center py-4">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-3xs text-slate-500 text-center py-4">No reports generated yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {reports.map(r => (
                  <div key={r.reportId} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-3 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {r.format === 'pdf' ? <FileText size={14} className="text-red-400 shrink-0" /> : <FileType size={14} className="text-blue-400 shrink-0" />}
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-3xs font-bold text-slate-200 uppercase truncate">{r.reportType} {r.format.toUpperCase()}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{new Date(r.generatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReDownload(r.reportId)}
                      className="inline-flex items-center gap-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 px-2 py-1 text-[9px] font-bold uppercase text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      <Download size={9} />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============================== Sub Components ============================== */

const ExecutiveCards: React.FC<{ summary: ExecutiveSummaryData }> = ({ summary }) => {
  const score = summary.overallRiskScore;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {/* Overall Risk */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
        className="rounded-2xl border border-white/5 bg-[#111827]/40 p-4 flex flex-col items-center justify-center relative overflow-hidden glass-panel"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Overall Risk</span>
        <div className="relative flex items-center justify-center h-16 w-16">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="transparent" />
            <circle
              cx="32" cy="32" r="26"
              stroke={score >= 81 ? '#ef4444' : score >= 61 ? '#f97316' : score >= 41 ? '#eab308' : score >= 21 ? '#06b6d4' : '#10b981'}
              strokeWidth="6" fill="transparent"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-base font-extrabold font-mono ${RISK_SCORE_COLOR(score)}`}>{score}</span>
          </div>
        </div>
        <span className={`mt-1.5 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${RISK_LEVEL_COLOR(summary.riskLevel)}`}>
          {summary.riskLevel}
        </span>
      </motion.div>

      {/* Top Issue */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/5 bg-[#111827]/40 p-4 glass-panel"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <ShieldAlert size={11} className="text-red-400" />
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Top Issue</span>
        </div>
        {summary.topNegotiationPoints.length > 0 ? (
          <>
            <p className="text-2xs font-bold text-slate-200 leading-tight line-clamp-2">{summary.topNegotiationPoints[0].title}</p>
            <span className={`mt-2 inline-block px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${SEVERITY_BADGE[summary.topNegotiationPoints[0].severity]}`}>
              {summary.topNegotiationPoints[0].severity}
            </span>
          </>
        ) : (
          <p className="text-2xs text-slate-500">No critical issues flagged.</p>
        )}
      </motion.div>

      {/* Missing Clauses */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/5 bg-[#111827]/40 p-4 glass-panel"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle size={11} className="text-yellow-400" />
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Missing Protections</span>
        </div>
        <p className="text-2xl font-extrabold text-slate-100 font-mono">{summary.missingProtections.length}</p>
        <p className="text-[9px] text-slate-500 mt-0.5">standard clauses absent</p>
      </motion.div>

      {/* Risk Distribution Mini Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-white/5 bg-[#111827]/40 p-4 glass-panel"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <PieChart size={11} className="text-cyan-400" />
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Risk Categories</span>
        </div>
        <div className="space-y-1">
          {(['Financial', 'Legal', 'Operational', 'Reputational'] as const).map(cat => {
            const s = summary.riskDistribution[cat];
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-[8px] text-slate-500 w-16 uppercase font-bold">{cat.slice(0, 6)}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${RISK_SCORE_BG(s).split(' ')[0]} transition-all duration-700`} style={{ width: `${s}%`, background: RISK_SCORE_COLOR(s).includes('red') ? '#ef4444' : RISK_SCORE_COLOR(s).includes('orange') ? '#f97316' : RISK_SCORE_COLOR(s).includes('yellow') ? '#eab308' : RISK_SCORE_COLOR(s).includes('cyan') ? '#06b6d4' : '#10b981' }} />
                </div>
                <span className={`text-[8px] font-mono font-bold w-6 text-right ${RISK_SCORE_COLOR(s)}`}>{s}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

/* ============================== Executive View ============================== */

const SectionBlock: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111827]/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h5 className="font-heading font-extrabold text-2xs uppercase tracking-wider text-slate-200">{title}</h5>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 text-2xs text-slate-300 leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ExecutiveView: React.FC<{ summary: ExecutiveSummaryData }> = ({ summary }) => (
  <>
    <SectionBlock title="Contract Overview" icon={<FileText size={12} className="text-primary" />}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-2xs">
        <div><span className="text-slate-500 uppercase font-bold text-[9px] block">Type</span><span className="text-slate-200 font-bold">{summary.contractType}</span></div>
        <div><span className="text-slate-500 uppercase font-bold text-[9px] block">Duration</span><span className="text-slate-200 font-bold">{summary.duration}</span></div>
        {summary.effectiveDate && <div><span className="text-slate-500 uppercase font-bold text-[9px] block">Effective</span><span className="text-slate-200 font-bold">{summary.effectiveDate}</span></div>}
        {summary.expirationDate && <div><span className="text-slate-500 uppercase font-bold text-[9px] block">Expiration</span><span className="text-slate-200 font-bold">{summary.expirationDate}</span></div>}
      </div>
      <div className="pt-2">
        <span className="text-slate-500 uppercase font-bold text-[9px] block mb-1">Purpose</span>
        <p className="text-slate-300">{summary.contractPurpose}</p>
      </div>
    </SectionBlock>

    <SectionBlock title="Parties Involved" icon={<Users size={12} className="text-cyan-400" />}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
          <Building2 size={14} className="text-cyan-400" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Vendor</span>
            <span className="text-slate-200 font-bold text-2xs">{summary.parties.vendor}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
          <Building2 size={14} className="text-purple-400" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Customer</span>
            <span className="text-slate-200 font-bold text-2xs">{summary.parties.customer}</span>
          </div>
        </div>
        {summary.parties.otherParties.map((p, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
            <Users size={14} className="text-slate-400" />
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Other Party</span>
              <span className="text-slate-200 font-bold text-2xs">{p}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>

    <SectionBlock title="Key Commercial Terms" icon={<Briefcase size={12} className="text-yellow-400" />}>
      {summary.keyCommercialTerms.length === 0 ? (
        <p className="text-slate-500">No commercial terms extracted.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {summary.keyCommercialTerms.map((t, i) => (
            <div key={i} className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">{t.label}</span>
              <span className="text-slate-200 text-2xs">{t.value}</span>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>

    <SectionBlock title="Risk Allocation" icon={<ShieldAlert size={12} className="text-red-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.riskAllocation}</p>
    </SectionBlock>

    <SectionBlock title="Important Obligations" icon={<CheckCircle2 size={12} className="text-emerald-400" />}>
      {summary.importantObligations.vendor.length > 0 && (
        <div>
          <span className="text-[9px] text-cyan-400 uppercase font-bold block mb-1.5">Vendor</span>
          <ul className="space-y-1.5">{summary.importantObligations.vendor.map((o, i) => <li key={i} className="flex gap-2"><span className="text-cyan-400">•</span><span>{o}</span></li>)}</ul>
        </div>
      )}
      {summary.importantObligations.customer.length > 0 && (
        <div className="pt-2">
          <span className="text-[9px] text-purple-400 uppercase font-bold block mb-1.5">Customer</span>
          <ul className="space-y-1.5">{summary.importantObligations.customer.map((o, i) => <li key={i} className="flex gap-2"><span className="text-purple-400">•</span><span>{o}</span></li>)}</ul>
        </div>
      )}
      {summary.importantObligations.mutual.length > 0 && (
        <div className="pt-2">
          <span className="text-[9px] text-yellow-400 uppercase font-bold block mb-1.5">Mutual</span>
          <ul className="space-y-1.5">{summary.importantObligations.mutual.map((o, i) => <li key={i} className="flex gap-2"><span className="text-yellow-400">•</span><span>{o}</span></li>)}</ul>
        </div>
      )}
    </SectionBlock>

    <SectionBlock title="Missing Protections" icon={<AlertTriangle size={12} className="text-yellow-400" />} defaultOpen={summary.missingProtections.length > 0}>
      {summary.missingProtections.length === 0 ? (
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 size={14} />
          <span>All standard protections present.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {summary.missingProtections.map((m, i) => (
            <div key={i} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <span className="text-2xs font-bold text-red-300 uppercase block">{m.clauseType}</span>
              <p className="text-2xs text-slate-300 mt-1">{m.businessImpact}</p>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>

    <SectionBlock title="Top Negotiation Points" icon={<Target size={12} className="text-orange-400" />} defaultOpen={summary.topNegotiationPoints.length > 0}>
      {summary.topNegotiationPoints.length === 0 ? (
        <p className="text-slate-500">No high-priority negotiation points.</p>
      ) : (
        <div className="space-y-3">
          {summary.topNegotiationPoints.map((np, i) => (
            <div key={i} className={`rounded-lg border p-3 ${SEVERITY_COLORS[np.severity]}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xs font-bold text-slate-100">{i + 1}. {np.title}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border shrink-0 ${SEVERITY_BADGE[np.severity]}`}>
                  {np.severity}
                </span>
              </div>
              <div className="mt-2 space-y-1.5 text-2xs">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Why it matters</span>
                  <span className="text-slate-300">{np.whyImportant}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Potential impact</span>
                  <span className="text-slate-300">{np.potentialImpact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>

    <SectionBlock title="Recommended Next Steps" icon={<Lightbulb size={12} className="text-yellow-400" />} defaultOpen={true}>
      {summary.recommendedNextSteps.length === 0 ? (
        <p className="text-slate-500">No specific recommendations.</p>
      ) : (
        <div className="space-y-2">
          {summary.recommendedNextSteps.map((r, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] border border-white/5 p-3">
              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border shrink-0 ${PRIORITY_COLORS[r.priority]}`}>
                {r.priority}
              </span>
              <div>
                <p className="text-2xs font-bold text-slate-100">{r.title}</p>
                <p className="text-2xs text-slate-400 mt-0.5">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>
  </>
);

/* ============================== Business View ============================== */

const BusinessView: React.FC<{ summary: BusinessSummaryData }> = ({ summary }) => (
  <>
    <SectionBlock title="Business Purpose" icon={<Target size={12} className="text-purple-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.businessPurpose}</p>
    </SectionBlock>

    <SectionBlock title="Commercial Focus" icon={<Briefcase size={12} className="text-yellow-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.commercialFocus}</p>
    </SectionBlock>

    <SectionBlock title="Commercial Terms" icon={<FileText size={12} className="text-cyan-400" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {([
          { label: 'Payment Terms', value: summary.paymentTerms, icon: <Briefcase size={11} className="text-emerald-400" /> },
          { label: 'Renewal Terms', value: summary.renewalTerms, icon: <RefreshCw size={11} className="text-cyan-400" /> },
          { label: 'Termination Notice', value: summary.terminationNotice, icon: <Clock size={11} className="text-orange-400" /> },
          { label: 'Service Commitments', value: summary.serviceCommitments, icon: <ShieldCheck size={11} className="text-emerald-400" /> },
          { label: 'IP Ownership', value: summary.ipOwnership, icon: <Eye size={11} className="text-purple-400" /> }
        ] as const).map((r, i) => (
          <div key={i} className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
            <div className="flex items-center gap-1.5">
              {r.icon}
              <span className="text-[9px] text-slate-500 uppercase font-bold">{r.label}</span>
            </div>
            <p className="text-2xs text-slate-200 mt-1">{r.value}</p>
          </div>
        ))}
      </div>
    </SectionBlock>

    <SectionBlock title="Financial Risk" icon={<TrendingUp size={12} className="text-red-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.financialRisk}</p>
    </SectionBlock>

    <SectionBlock title="Operational Impact" icon={<Building2 size={12} className="text-cyan-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.operationalImpact}</p>
    </SectionBlock>

    {summary.keyBenefits.length > 0 && (
      <SectionBlock title="Key Benefits" icon={<CheckCircle2 size={12} className="text-emerald-400" />}>
        <ul className="space-y-1.5">
          {summary.keyBenefits.map((b, i) => (
            <li key={i} className="flex gap-2"><span className="text-emerald-400">•</span><span className="text-slate-300">{b}</span></li>
          ))}
        </ul>
      </SectionBlock>
    )}

    {summary.keyConcerns.length > 0 && (
      <SectionBlock title="Key Concerns" icon={<AlertTriangle size={12} className="text-orange-400" />}>
        <ul className="space-y-1.5">
          {summary.keyConcerns.map((c, i) => (
            <li key={i} className="flex gap-2"><span className="text-orange-400">•</span><span className="text-slate-300">{c}</span></li>
          ))}
        </ul>
      </SectionBlock>
    )}
  </>
);

/* ============================== Legal View ============================== */

const LegalView: React.FC<{ summary: LegalSummaryData }> = ({ summary }) => (
  <>
    <SectionBlock title="Governing Law" icon={<Gavel size={12} className="text-cyan-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.governingLaw}</p>
    </SectionBlock>

    <SectionBlock title="Indemnification" icon={<ShieldAlert size={12} className="text-red-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.indemnificationSummary}</p>
    </SectionBlock>

    <SectionBlock title="Limitation of Liability" icon={<ShieldCheck size={12} className="text-orange-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.liabilitySummary}</p>
    </SectionBlock>

    <SectionBlock title="Confidentiality" icon={<Eye size={12} className="text-purple-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.confidentialitySummary}</p>
    </SectionBlock>

    <SectionBlock title="Intellectual Property" icon={<Lightbulb size={12} className="text-yellow-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.ipSummary}</p>
    </SectionBlock>

    <SectionBlock title="Dispute Resolution" icon={<Gavel size={12} className="text-cyan-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.disputeResolutionSummary}</p>
    </SectionBlock>

    <SectionBlock title="Force Majeure" icon={<AlertTriangle size={12} className="text-yellow-400" />} defaultOpen={summary.forceMajeureStatus.toLowerCase().includes('missing')}>
      <p className="text-slate-300 leading-relaxed">{summary.forceMajeureStatus}</p>
    </SectionBlock>

    <SectionBlock title="Data Protection" icon={<ShieldCheck size={12} className="text-emerald-400" />}>
      <p className="text-slate-300 leading-relaxed">{summary.dataProtectionStatus}</p>
    </SectionBlock>

    {summary.clauseLevelFindings.length > 0 && (
      <SectionBlock title="Clause-Level Findings" icon={<FileText size={12} className="text-primary" />}>
        <div className="space-y-2">
          {summary.clauseLevelFindings.map((f, i) => (
            <div key={i} className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-2xs font-bold text-cyan-400 uppercase">{f.clauseType}</span>
                {f.sectionNumber && <span className="text-[9px] font-mono text-slate-400 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">§ {f.sectionNumber}</span>}
                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${RISK_LEVEL_COLOR(f.riskLevel)}`}>
                  {f.riskLevel}
                </span>
              </div>
              <p className="text-2xs text-slate-300">{f.finding}</p>
            </div>
          ))}
        </div>
      </SectionBlock>
    )}

    {summary.criticalLegalRisks.length > 0 && (
      <SectionBlock title="Critical Legal Risks" icon={<ShieldAlert size={12} className="text-red-400" />}>
        <ul className="space-y-1.5">
          {summary.criticalLegalRisks.map((r, i) => (
            <li key={i} className="flex gap-2"><span className="text-red-400">•</span><span className="text-slate-300">{r}</span></li>
          ))}
        </ul>
      </SectionBlock>
    )}
  </>
);

export default SummaryTab;
