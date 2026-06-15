import React from 'react';
import { ShieldAlert, AlertTriangle, Flame, ListChecks } from 'lucide-react';
import { RiskBadge, type RiskLevel } from '../ui/RiskBadge';

interface InsightsPanelProps {
  contract: any;
  clauseRisks: any[];
  riskAnalysis: any | null;
  onAsk: (question: string) => void;
}

/** Maps Phase-5 risk levels to the 4-level RiskBadge scale. */
function toBadgeLevel(level: string): RiskLevel {
  switch (level) {
    case 'Critical':
      return 'Critical';
    case 'High':
      return 'High';
    case 'Moderate':
    case 'Medium':
      return 'Medium';
    default:
      return 'Low';
  }
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ contract, clauseRisks, riskAnalysis, onAsk }) => {
  const highestRisk = (clauseRisks || [])
    .slice()
    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0];

  const topIssues: any[] = Array.isArray(riskAnalysis?.topIssues) ? riskAnalysis.topIssues : [];
  const missingClauses: string[] = Array.isArray(contract?.missingClauses) ? contract.missingClauses : [];

  return (
    <div className="space-y-4">
      {/* Highest risk clause */}
      <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md glass-panel">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
          <Flame size={14} className="text-orange-400" />
          <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Highest Risk Clause</h4>
        </div>
        {highestRisk ? (
          <button
            onClick={() => onAsk(`Why is the ${highestRisk.clauseType} clause risky?`)}
            className="w-full text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{highestRisk.clauseType}</span>
              <RiskBadge level={toBadgeLevel(highestRisk.riskLevel)} />
            </div>
            {highestRisk.whyFlagged && (
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 line-clamp-3">{highestRisk.whyFlagged}</p>
            )}
            <span className="mt-2 inline-block text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Ask about this →</span>
          </button>
        ) : (
          <p className="text-[10px] text-slate-600">Run risk analysis to surface risk insights.</p>
        )}
      </div>

      {/* Top issues */}
      <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md glass-panel">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
          <ShieldAlert size={14} className="text-red-400" />
          <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Top Issues</h4>
        </div>
        {topIssues.length > 0 ? (
          <div className="space-y-2">
            {topIssues.slice(0, 3).map((iss, i) => (
              <button
                key={i}
                onClick={() => onAsk(`Tell me about: ${iss.title}`)}
                className="w-full text-left rounded-lg bg-black/10 border border-white/3 px-2.5 py-2 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-200 truncate">{iss.title}</span>
                  <RiskBadge level={toBadgeLevel(iss.severity)} showIcon={false} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-slate-600">No issues recorded yet.</p>
        )}
      </div>

      {/* Missing clauses */}
      <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-4 backdrop-blur-md glass-panel">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
          <AlertTriangle size={14} className="text-amber-400" />
          <h4 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-slate-200">Missing Clauses</h4>
        </div>
        {missingClauses.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {missingClauses.map((c) => (
              <button
                key={c}
                onClick={() => onAsk(`Does this contract address ${c}?`)}
                className="rounded-full border border-amber-500/15 bg-amber-500/5 px-2 py-0.5 text-[9px] font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <ListChecks size={12} className="text-green-400" /> No required clauses missing.
          </p>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;
