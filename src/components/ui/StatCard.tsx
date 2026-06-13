import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description: string;
  glowColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  icon,
  trend,
  description,
  glowColor = 'group-hover:border-primary/30'
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) return;

    // Simple ticker animation
    const duration = 1200; // ms
    const increment = Math.ceil(end / (duration / 30));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111827]/40 p-6 backdrop-blur-md transition-all duration-300 hover:bg-[#111827]/70 ${glowColor} hover:shadow-[0_0_30px_rgba(79,70,229,0.1)]`}
    >
      {/* Background Radial Glow */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all duration-300" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="rounded-xl bg-white/5 p-2.5 text-slate-300 group-hover:bg-primary/10 group-hover:text-white transition-all duration-300">
          {icon}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          {prefix}
          {displayValue.toLocaleString()}
          {suffix}
        </span>

        {trend && (
          <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-2xs font-bold ${
            trend.isPositive 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-rose-500/10 text-rose-400'
          }`}>
            {trend.isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            <span>{trend.value}%</span>
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400 leading-normal">
        {description}
      </p>
    </motion.div>
  );
};
export default StatCard;
