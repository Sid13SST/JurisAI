import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  badge,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {badge && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-primary">
              {badge}
            </span>
          )}
          <h3 className="font-heading font-extrabold text-lg text-white tracking-tight">
            {title}
          </h3>
        </div>
        {description && (
          <p className="text-xs text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
};
export default SectionHeader;
