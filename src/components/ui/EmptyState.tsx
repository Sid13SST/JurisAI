import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#111827]/10 p-12 text-center backdrop-blur-md">
      
      {/* Icon Graphic */}
      <div className="rounded-2xl bg-white/5 p-4 text-slate-400 border border-white/5 shadow-inner">
        {icon || <AlertCircle size={32} className="text-slate-400" />}
      </div>

      <h3 className="mt-4 font-heading font-bold text-lg text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-xs text-slate-400 leading-normal">{description}</p>
      
      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95 transition-all duration-300"
        >
          <RefreshCw size={14} className="animate-spin-hover" />
          <span>{actionLabel}</span>
        </button>
      )}

    </div>
  );
};
export default EmptyState;
