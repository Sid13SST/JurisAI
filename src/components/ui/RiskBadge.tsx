import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from 'lucide-react';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ 
  level, 
  className = '',
  showIcon = true 
}) => {
  const getBadgeStyle = () => {
    switch (level) {
      case 'Low':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          icon: <ShieldCheck size={12} className="shrink-0" />
        };
      case 'Medium':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
          icon: <Shield size={12} className="shrink-0" />
        };
      case 'High':
        return {
          bg: 'bg-orange-500/10',
          text: 'text-orange-400',
          border: 'border-orange-500/20',
          icon: <ShieldAlert size={12} className="shrink-0" />
        };
      case 'Critical':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/20',
          icon: <ShieldX size={12} className="shrink-0" />,
          animate: 'animate-pulse'
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider ${style.bg} ${style.text} ${style.border} ${style.animate || ''} ${className}`}>
      {showIcon && style.icon}
      <span>{level}</span>
    </span>
  );
};
export default RiskBadge;
