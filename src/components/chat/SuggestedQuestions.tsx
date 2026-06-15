import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface SuggestedQuestionsProps {
  onPick: (question: string) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  'Who owns the intellectual property?',
  'What are the payment terms?',
  'Can either party terminate the agreement?',
  'What clauses are high risk?',
  'Show me the highest risk clause.',
  'What happens if there is a breach?'
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onPick, disabled }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center h-full gap-5 px-4"
    >
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <Sparkles size={22} className="text-white" />
      </div>
      <div>
        <h3 className="font-heading font-extrabold text-base text-white">Chat with this contract</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          Ask questions in plain language. Answers are grounded in this contract's clauses, sections, and risk findings — with sources.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            disabled={disabled}
            className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300 hover:border-primary/30 hover:bg-primary/10 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default SuggestedQuestions;
