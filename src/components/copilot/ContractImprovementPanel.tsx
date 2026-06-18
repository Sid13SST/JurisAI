import React from 'react';
import { Target, FileEdit, Download } from 'lucide-react';
import type { ReadinessScore } from '../../services/copilot.service';

interface ContractImprovementPanelProps {
  data: ReadinessScore | null;
  isLoading: boolean;
}

export const ContractImprovementPanel: React.FC<ContractImprovementPanelProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Generating improvement plan...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#12121A] p-6 shadow-xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Target className="text-primary" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-white">Contract Improvement Recommendations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Top actionable steps to improve this contract before signing.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {data.topRecommendations.map((rec, idx) => (
          <div key={idx} className="group flex items-start gap-4 rounded-lg border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
              <span className="text-sm font-bold">{idx + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-200">{rec}</p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20">
                <FileEdit size={12} /> Auto-fix
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
