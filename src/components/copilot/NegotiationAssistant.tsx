import React from 'react';
import { Scale, ArrowRight, AlertTriangle, Shield, Copy, Check } from 'lucide-react';
import type { NegotiationSuggestion } from '../../services/copilot.service';

interface NegotiationAssistantProps {
  suggestions: NegotiationSuggestion[];
  isLoading: boolean;
}

export const NegotiationAssistant: React.FC<NegotiationAssistantProps> = ({ suggestions, isLoading }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-400">Analyzing negotiation opportunities...</p>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const priorityColors = {
    Critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="text-primary" size={24} />
        <h3 className="text-lg font-semibold text-white">Negotiation Assistant</h3>
      </div>

      <div className="space-y-6">
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="rounded-xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-3">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityColors[suggestion.priority]}`}>
                {suggestion.priority} Priority
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield size={14} /> Expected: {suggestion.expectedRiskReduction}
              </div>
            </div>

            <div className="grid gap-px bg-white/5 lg:grid-cols-2">
              {/* Current Clause */}
              <div className="bg-[#12121A] p-6">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-rose-400">
                  <AlertTriangle size={16} /> Current Risky Clause
                </h4>
                <div className="rounded bg-rose-500/5 p-4 text-sm text-slate-300 italic border border-rose-500/10 mb-4">
                  "{suggestion.currentClause}"
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Explanation</span>
                  <p className="mt-1 text-sm text-slate-300">{suggestion.riskExplanation}</p>
                </div>
              </div>

              {/* Suggested Revision */}
              <div className="bg-[#12121A] p-6 relative">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <ArrowRight size={16} /> Suggested Revision
                </h4>
                <div className="relative rounded bg-emerald-500/5 p-4 text-sm text-slate-300 italic border border-emerald-500/10 mb-4 pr-12">
                  "{suggestion.suggestedRevision}"
                  <button 
                    onClick={() => handleCopy(suggestion.suggestedRevision, idx)}
                    className="absolute top-3 right-3 p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                    title="Copy suggested revision"
                  >
                    {copiedIndex === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recommendation</span>
                  <p className="mt-1 text-sm text-slate-300">{suggestion.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
