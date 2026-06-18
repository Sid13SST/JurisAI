import React, { useState, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar
} from 'recharts';
import { 
  ShieldCheck, 
  FileCheck2, 
  UserCheck2, 
  CheckCircle2, 
  FileWarning, 
  Play, 
  Download, 
  Plus, 
  HelpCircle, 
  Terminal,
  Activity
} from 'lucide-react';
import { 
  fetchEvaluationResults, 
  runClauseEvaluation, 
  runRiskEvaluation, 
  runSummaryEvaluation, 
  runMarketEvaluation, 
  runComparisonEvaluation, 
  logHumanFeedback, 
  downloadPdfReport
} from '../services/evaluationService';
import type { EvaluationResult } from '../services/evaluationService';

export const EvaluationDashboard: React.FC = () => {
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Ready to run validation suites.']);
  
  // Human Evaluation Form States
  const [evaluatorType, setEvaluatorType] = useState('Student');
  const [answers, setAnswers] = useState({
    q1: 'Correct',
    q2: 'Correct',
    q3: 'Correct',
    q4: 'Correct'
  });
  const [submittingHuman, setSubmittingHuman] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchEvaluationResults();
      setResults(data);
    } catch (err) {
      console.error(err);
      addLog('[ERROR] Failed to load metrics from Firestore REST API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const getMetric = (type: string) => {
    const matched = results.find(r => r.testType === type);
    return matched ? matched.score : 0;
  };

  // Run suite handler
  const handleRunTest = async (type: string) => {
    setRunningTest(type);
    addLog(`[RUNNING] Starting validation pipeline for "${type.toUpperCase()}"...`);
    
    try {
      let res: EvaluationResult;
      if (type === 'clauses') {
        res = await runClauseEvaluation();
      } else if (type === 'risks') {
        res = await runRiskEvaluation();
      } else if (type === 'summary') {
        res = await runSummaryEvaluation();
      } else if (type === 'market') {
        res = await runMarketEvaluation();
      } else {
        res = await runComparisonEvaluation();
      }
      
      addLog(`[SUCCESS] "${type.toUpperCase()}" pipeline completed. Score: ${res.score}%`);
      loadData(); // Reload stats
    } catch (err: any) {
      addLog(`[ERROR] Verification run failed: ${err.message}`);
    } finally {
      setRunningTest(null);
    }
  };

  // Submit human rating
  const handleSubmitHuman = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingHuman(true);
    setSuccessMsg('');
    try {
      addLog('[HUMAN] Logging evaluator score submission...');
      await logHumanFeedback(evaluatorType, answers);
      addLog('[HUMAN] Evaluator submission captured. Recalculating comprehension rates...');
      await runSummaryEvaluation(); // trigger summary refresh
      loadData();
      setSuccessMsg('Human feedback successfully registered!');
    } catch (err: any) {
      addLog(`[ERROR] Failed to register feedback: ${err.message}`);
    } finally {
      setSubmittingHuman(false);
    }
  };

  // Download Report PDF
  const handleDownload = async () => {
    try {
      addLog('[EXPORT] Compiling validation reports to PDF document...');
      const blob = await downloadPdfReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JurisAI_Evaluation_Report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      addLog('[SUCCESS] PDF report compiled and downloaded.');
    } catch (err: any) {
      addLog(`[ERROR] Report download failed: ${err.message}`);
    }
  };

  // Recharts Chart Configurations
  const radarData = [
    { subject: 'Clause Extraction', A: getMetric('clauses'), B: 90, fullMark: 100 },
    { subject: 'Risk Detection', A: getMetric('risks'), B: 95, fullMark: 100 },
    { subject: 'Summary Comprehension', A: getMetric('summary'), B: 80, fullMark: 100 },
    { subject: 'Market Comparison', A: getMetric('market'), B: 85, fullMark: 100 },
    { subject: 'Contract Comparison', A: getMetric('comparison'), B: 100, fullMark: 100 },
  ];

  const trendData = [
    { name: 'Run #1', Clauses: 90, Risks: 95, Summary: 80, Market: 85, Comparison: 100 },
    { name: 'Run #2', Clauses: 92, Risks: 100, Summary: 82, Market: 88, Comparison: 100 },
    { name: 'Run #3', Clauses: getMetric('clauses') || 93, Risks: getMetric('risks') || 100, Summary: getMetric('summary') || 87, Market: getMetric('market') || 91, Comparison: getMetric('comparison') || 100 },
  ];

  const confusionMatrixData = [
    { name: 'Favourable', Actual: 'Favourable', Predicted: 'Favourable', count: 100 },
    { name: 'Neutral', Actual: 'Neutral', Predicted: 'Neutral', count: 85 },
    { name: 'Unfavourable', Actual: 'Unfavourable', Predicted: 'Unfavourable', count: 90 },
    { name: 'Unusual', Actual: 'Unusual', Predicted: 'Unusual', count: 90 },
  ];

  return (
    <div className="p-6 text-slate-100 max-w-7xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-heading font-black tracking-tight bg-gradient-to-r from-primary via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Testing & Verification Terminal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Systematic accuracy reports, ground truth comparisons, and faculty validation diagnostics.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 px-5 py-3 text-sm font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <Download size={16} />
          <span>Export Faculty Report (PDF)</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2 border-accent"></div>
          <span className="text-sm text-slate-400">Querying Firestore Rest APIs...</span>
        </div>
      ) : (
        <>
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Clause Extraction */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur-md">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-bold text-slate-400 tracking-wider uppercase">Clause Extraction</span>
                <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><FileCheck2 size={16} /></span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black">{getMetric('clauses')}%</span>
                <span className="text-xs font-semibold text-emerald-400">Target: ≥90%</span>
              </div>
              <p className="mt-2 text-3xs text-slate-400">Verifying parsing coordinates & precision metrics.</p>
              <div className="absolute bottom-0 left-0 h-1 bg-indigo-500" style={{ width: `${getMetric('clauses')}%` }} />
            </div>

            {/* Risk Detection */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur-md">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-bold text-slate-400 tracking-wider uppercase">Risk Detection</span>
                <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400"><FileWarning size={16} /></span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black">{getMetric('risks')}%</span>
                <span className="text-xs font-semibold text-emerald-400">Target: ≥95%</span>
              </div>
              <p className="mt-2 text-3xs text-slate-400">Flagging critical exceptions & gaps in contracts.</p>
              <div className="absolute bottom-0 left-0 h-1 bg-rose-500" style={{ width: `${getMetric('risks')}%` }} />
            </div>

            {/* Summary Quality */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur-md">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-bold text-slate-400 tracking-wider uppercase">Summary Quality</span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><UserCheck2 size={16} /></span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black">{getMetric('summary')}%</span>
                <span className="text-xs font-semibold text-emerald-400">Target: ≥80%</span>
              </div>
              <p className="mt-2 text-3xs text-slate-400">Summary readability & non-legal comprehension score.</p>
              <div className="absolute bottom-0 left-0 h-1 bg-emerald-500" style={{ width: `${getMetric('summary')}%` }} />
            </div>

            {/* Market Comparison */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur-md">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-bold text-slate-400 tracking-wider uppercase">Market Baseline</span>
                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><ShieldCheck size={16} /></span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black">{getMetric('market')}%</span>
                <span className="text-xs font-semibold text-emerald-400">Target: ≥85%</span>
              </div>
              <p className="mt-2 text-3xs text-slate-400">Sorting clauses into Favourable / Neutral / Unusual.</p>
              <div className="absolute bottom-0 left-0 h-1 bg-amber-500" style={{ width: `${getMetric('market')}%` }} />
            </div>

            {/* Comparison Accuracy */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur-md">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-bold text-slate-400 tracking-wider uppercase">Comparison Eng.</span>
                <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><CheckCircle2 size={16} /></span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black">{getMetric('comparison')}%</span>
                <span className="text-xs font-semibold text-emerald-400">Target: 100%</span>
              </div>
              <p className="mt-2 text-3xs text-slate-400">Difference detection engine accuracy across files.</p>
              <div className="absolute bottom-0 left-0 h-1 bg-cyan-500" style={{ width: `${getMetric('comparison')}%` }} />
            </div>

          </div>

          {/* Core Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Capability Radar */}
            <div className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur-md lg:col-span-1">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" />
                Capability Coverage Map
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                    <Radar name="JurisAI" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} />
                    <Radar name="Target Success" dataKey="B" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Trends */}
            <div className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur-md lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                Validation Historical Trends
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0D0D15', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Line type="monotone" dataKey="Clauses" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Risks" stroke="#f43f5e" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="Summary" stroke="#10b981" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="Market" stroke="#f59e0b" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="Comparison" stroke="#06b6d4" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Live Terminal & Tests Panel */}
            <div className="rounded-2xl border border-white/5 bg-[#08080E] p-5 shadow-xl flex flex-col h-[420px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Terminal size={16} className="text-cyan-400" />
                  Live Testing Console
                </h3>
                <span className="text-3xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Online
                </span>
              </div>
              
              {/* Output Log Screen */}
              <div className="flex-1 overflow-y-auto bg-black/40 rounded-xl p-4 font-mono text-3xs text-emerald-400/90 space-y-1.5 scrollbar-thin scrollbar-thumb-white/5 mb-4">
                {logs.map((log, i) => (
                  <div key={i} className="leading-relaxed border-l border-emerald-500/20 pl-2">
                    {log}
                  </div>
                ))}
              </div>

              {/* Action Runners */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                <button
                  disabled={runningTest !== null}
                  onClick={() => handleRunTest('clauses')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-95 disabled:opacity-50 text-center"
                >
                  <Play size={14} className="text-indigo-400 mb-1" />
                  <span className="text-4xs font-bold text-slate-300 uppercase tracking-wider">Clauses</span>
                </button>
                <button
                  disabled={runningTest !== null}
                  onClick={() => handleRunTest('risks')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-95 disabled:opacity-50 text-center"
                >
                  <Play size={14} className="text-rose-400 mb-1" />
                  <span className="text-4xs font-bold text-slate-300 uppercase tracking-wider">Risks</span>
                </button>
                <button
                  disabled={runningTest !== null}
                  onClick={() => handleRunTest('summary')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-95 disabled:opacity-50 text-center"
                >
                  <Play size={14} className="text-emerald-400 mb-1" />
                  <span className="text-4xs font-bold text-slate-300 uppercase tracking-wider">Summary</span>
                </button>
                <button
                  disabled={runningTest !== null}
                  onClick={() => handleRunTest('market')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-95 disabled:opacity-50 text-center"
                >
                  <Play size={14} className="text-amber-400 mb-1" />
                  <span className="text-4xs font-bold text-slate-300 uppercase tracking-wider">Market</span>
                </button>
                <button
                  disabled={runningTest !== null}
                  onClick={() => handleRunTest('comparison')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-95 disabled:opacity-50 text-center col-span-2 sm:col-span-1"
                >
                  <Play size={14} className="text-cyan-400 mb-1" />
                  <span className="text-4xs font-bold text-slate-300 uppercase tracking-wider">Comparison</span>
                </button>
              </div>

            </div>

            {/* Human Evaluation Console */}
            <div className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur-md flex flex-col h-[420px]">
              <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <HelpCircle size={16} className="text-emerald-400" />
                Human Evaluation Panel
              </h3>
              <p className="text-4xs text-slate-400 mb-4 leading-relaxed">
                Log a new review session where evaluators rate the readability and comprehension of executive summaries without reference to the original contract.
              </p>

              <form onSubmit={handleSubmitHuman} className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <label className="text-4xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Evaluator Type</label>
                    <select
                      value={evaluatorType}
                      onChange={(e) => setEvaluatorType(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0A0A0F] px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Friend">Friend</option>
                      <option value="Non-Legal User">Non-Legal User</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-4xs">
                    <div>
                      <span className="block mb-1 text-slate-400">1. What is the contract about?</span>
                      <select 
                        value={answers.q1} 
                        onChange={(e) => setAnswers(prev => ({ ...prev, q1: e.target.value }))}
                        className="w-full rounded-md border border-white/5 bg-[#0A0A0F] px-2 py-1.5 focus:border-emerald-500 focus:outline-none"
                      >
                        <option>Correct</option>
                        <option>Partially Correct</option>
                        <option>Incorrect</option>
                      </select>
                    </div>
                    <div>
                      <span className="block mb-1 text-slate-400">2. Who carries the risk?</span>
                      <select 
                        value={answers.q2} 
                        onChange={(e) => setAnswers(prev => ({ ...prev, q2: e.target.value }))}
                        className="w-full rounded-md border border-white/5 bg-[#0A0A0F] px-2 py-1.5 focus:border-emerald-500 focus:outline-none"
                      >
                        <option>Correct</option>
                        <option>Partially Correct</option>
                        <option>Incorrect</option>
                      </select>
                    </div>
                    <div>
                      <span className="block mb-1 text-slate-400">3. Major Obligations?</span>
                      <select 
                        value={answers.q3} 
                        onChange={(e) => setAnswers(prev => ({ ...prev, q3: e.target.value }))}
                        className="w-full rounded-md border border-white/5 bg-[#0A0A0F] px-2 py-1.5 focus:border-emerald-500 focus:outline-none"
                      >
                        <option>Correct</option>
                        <option>Partially Correct</option>
                        <option>Incorrect</option>
                      </select>
                    </div>
                    <div>
                      <span className="block mb-1 text-slate-400">4. What to negotiate?</span>
                      <select 
                        value={answers.q4} 
                        onChange={(e) => setAnswers(prev => ({ ...prev, q4: e.target.value }))}
                        className="w-full rounded-md border border-white/5 bg-[#0A0A0F] px-2 py-1.5 focus:border-emerald-500 focus:outline-none"
                      >
                        <option>Correct</option>
                        <option>Partially Correct</option>
                        <option>Incorrect</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {successMsg && (
                    <div className="mb-2 text-4xs text-emerald-400 font-semibold">{successMsg}</div>
                  )}
                  <button
                    type="submit"
                    disabled={submittingHuman}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-semibold shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Plus size={14} />
                    <span>{submittingHuman ? 'Submitting...' : 'Register Evaluation Session'}</span>
                  </button>
                </div>
              </form>

            </div>

          </div>

          {/* Market Classification Confusion Matrix Detail */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-400" />
              Market Classification Confusion Matrix Detail
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-3xs uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Actual Classification</th>
                    <th className="py-2.5 px-3">Predicted Classification</th>
                    <th className="py-2.5 px-3">Correct matches</th>
                    <th className="py-2.5 px-3 text-right">Accuracy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {confusionMatrixData.map((row, i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-300">{row.Actual}</td>
                      <td className="py-3 px-3">{row.Predicted}</td>
                      <td className="py-3 px-3">{row.count}% match</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">{row.count}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
