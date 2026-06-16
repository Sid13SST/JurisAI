import React from 'react';
import { ShieldCheck, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { ComplianceAnalysis } from '../../services/copilot.service';

interface CompliancePanelProps {
  data: ComplianceAnalysis | null;
  isLoading: boolean;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Analyzing compliance standards...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const scoreData = [
    { name: 'Score', value: data.complianceScore },
    { name: 'Remaining', value: 100 - data.complianceScore },
  ];

  const getColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#12121A] p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-primary" size={24} />
          <h3 className="text-lg font-semibold text-white">Compliance Checker</h3>
        </div>
        <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
          Standard: General Agreement
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score Gauge */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/5 p-4">
          <div className="relative h-32 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  startAngle={180}
                  endAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={getColor(data.complianceScore)} />
                  <Cell fill="rgba(255,255,255,0.05)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-3xl font-bold text-white">{data.complianceScore}</span>
              <span className="text-3xs text-slate-400 uppercase tracking-wider mt-1">{data.classification}</span>
            </div>
          </div>
        </div>

        {/* Protections Lists */}
        <div className="col-span-2 grid gap-4 sm:grid-cols-2">
          
          <div className="rounded-lg bg-white/5 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <CheckCircle2 size={16} /> Present Protections
            </h4>
            <ul className="space-y-2">
              {data.presentProtections.map((p, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                  {p}
                </li>
              ))}
              {data.presentProtections.length === 0 && <li className="text-xs text-slate-500">None detected</li>}
            </ul>
          </div>

          <div className="rounded-lg bg-white/5 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-rose-400">
              <ShieldAlert size={16} /> Missing Protections
            </h4>
            <ul className="space-y-2">
              {data.missingProtections.map((p, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-rose-500" />
                  {p}
                </li>
              ))}
              {data.missingProtections.length === 0 && <li className="text-xs text-slate-500">None missing</li>}
            </ul>
          </div>
          
        </div>
      </div>

      {data.weakProtections.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-400">
            <AlertCircle size={16} /> Weak Protections Detected
          </h4>
          <div className="space-y-3">
            {data.weakProtections.map((wp, i) => (
              <div key={i} className="flex flex-col gap-1 rounded bg-black/20 p-3">
                <span className="text-xs font-semibold text-white">{wp.clause}</span>
                <span className="text-xs text-slate-400">{wp.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
