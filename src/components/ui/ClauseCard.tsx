import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import type { RiskLevel } from './RiskBadge';

interface ClauseCardProps {
  name: string;
  category: string;
  text: string;
  status: 'Approved' | 'Warning' | 'Critical';
  confidence: number;
  riskLevel: RiskLevel;
  riskDescription: string;
}

export const ClauseCard: React.FC<ClauseCardProps> = ({
  name,
  category,
  text,
  status,
  confidence,
  riskLevel,
  riskDescription
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'Warning':
        return <AlertTriangle size={16} className="text-amber-400" />;
      case 'Critical':
        return <AlertCircle size={16} className="text-red-400" />;
    }
  };

  return (
    <div className={`overflow-hidden rounded-xl border transition-all duration-300 ${
      isExpanded 
        ? 'border-white/10 bg-[#111827]/40 shadow-lg shadow-black/20' 
        : 'border-white/5 bg-[#111827]/20 hover:border-white/10 hover:bg-[#111827]/30'
    }`}>
      
      {/* Clause Header Info */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex cursor-pointer items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h4 className="font-heading font-bold text-sm text-slate-200">{name}</h4>
            <span className="text-3xs text-slate-400 font-medium tracking-wide uppercase">{category}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Confidence Metric */}
          <div className="hidden items-center gap-1 text-2xs text-slate-400 sm:flex">
            <Sparkles size={11} className="text-cyan-400" />
            <span>Confidence: <strong className="text-slate-200">{confidence}%</strong></span>
          </div>

          <RiskBadge level={riskLevel} />

          <button className="text-slate-400 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="border-t border-white/5 bg-white/2 pb-4 pt-3 px-4 space-y-3">
              
              {/* Extract Text Panel */}
              <div className="space-y-1">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Identified Contract Prose</span>
                <div className="rounded-lg bg-black/40 p-3 font-mono text-2xs leading-relaxed text-slate-300 border border-white/5">
                  "{text}"
                </div>
              </div>

              {/* Analysis Explanation Panel */}
              <div className="space-y-1">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">AI Intelligence Audit Notes</span>
                <p className="text-2xs text-slate-400 leading-relaxed">
                  {riskDescription}
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default ClauseCard;
