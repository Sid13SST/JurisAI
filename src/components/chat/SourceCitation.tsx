import React, { useState } from 'react';
import { FileText, Scale, ShieldAlert, Info, ChevronDown, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatSource } from '../../services/chatApi';

interface SourceCitationProps {
  source: ChatSource;
  onJump?: (source: ChatSource) => void;
}

const typeMeta: Record<ChatSource['sourceType'], { icon: React.ReactNode; label: string; accent: string }> = {
  section: { icon: <FileText size={11} />, label: 'Section', accent: 'text-primary' },
  clause: { icon: <Scale size={11} />, label: 'Clause', accent: 'text-cyan-400' },
  risk: { icon: <ShieldAlert size={11} />, label: 'Risk', accent: 'text-orange-400' },
  metadata: { icon: <Info size={11} />, label: 'Metadata', accent: 'text-slate-400' }
};

export const SourceCitation: React.FC<SourceCitationProps> = ({ source, onJump }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = typeMeta[source.sourceType] || typeMeta.section;
  const jumpable = source.sourceType !== 'metadata' && source.sourceRef !== 'overall';

  return (
    <div className="rounded-lg border border-white/5 bg-black/20 overflow-hidden">
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <span className={`shrink-0 ${meta.accent}`}>{meta.icon}</span>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer"
        >
          <span className={`text-[9px] font-extrabold uppercase tracking-wider ${meta.accent}`}>{meta.label}</span>
          <span className="truncate text-[10px] text-slate-300 font-medium">{source.title || source.sourceRef}</span>
          <ChevronDown size={10} className={`shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {jumpable && onJump && (
          <button
            onClick={() => onJump(source)}
            title="Jump to source in document"
            className="shrink-0 flex items-center gap-0.5 rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[9px] font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <ArrowUpRight size={10} />
            View
          </button>
        )}
      </div>
      <AnimatePresence>
        {expanded && source.snippet && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-2.5 pb-2 text-[10px] leading-relaxed text-slate-400 italic border-t border-white/5 pt-2">
              "{source.snippet}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SourceCitation;
