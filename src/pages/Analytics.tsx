import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import { 
  Activity, 
  ShieldAlert, 
  FolderKey, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { 
  riskTrendData, 
  clauseFrequencyData, 
  categoryBreakdownData
} from '../data/mockData';

export const Analytics: React.FC = () => {
  
  // Calculate mock category-wise risk breakdown counts
  const categoryRiskCounts = [
    { name: 'Financial Risk', count: 18, fill: '#06B6D4' },
    { name: 'Legal Risk', count: 32, fill: '#4F46E5' },
    { name: 'Operational Risk', count: 14, fill: '#F59E0B' },
    { name: 'Reputational Risk', count: 8, fill: '#EF4444' }
  ];

  // Tooltip customizer
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-[#111827] p-3 shadow-xl backdrop-blur-md">
          <p className="font-heading font-bold text-xs text-white border-b border-white/5 pb-1 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-2xs flex items-center gap-1.5" style={{ color: entry.color || entry.fill }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span>{entry.name}: <strong>{entry.value}</strong></span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <PageContainer
      title="Advanced Analytics Terminal"
      subtitle="Examine contract risk variables, clause anomalies, and longitudinal trends."
      action={
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-semibold text-emerald-400">
          <TrendingUp size={12} />
          <span>System Health: Nominal</span>
        </div>
      }
    >
      
      {/* Analytics KPIs Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Avg Contract Score" 
          value={68} 
          suffix="/100"
          icon={<Activity size={20} />} 
          trend={{ value: 4.2, isPositive: false }}
          description="Average risk score indices across active database."
          glowColor="hover:border-indigo-500/30 hover:shadow-indigo-500/10"
        />
        <StatCard 
          title="Critical Flags Rate" 
          value={14} 
          icon={<ShieldAlert size={20} />} 
          trend={{ value: 1.2, isPositive: true }}
          description="Flagged exceptions requiring legal drafting edits."
          glowColor="hover:border-red-500/30 hover:shadow-red-500/10"
        />
        <StatCard 
          title="Clause Density" 
          value={12} 
          suffix=" clauses/file"
          icon={<FolderKey size={20} />} 
          trend={{ value: 8.5, isPositive: true }}
          description="Average extracted legal nodes per scanned agreement."
          glowColor="hover:border-[#06B6D4]/30 hover:shadow-[#06B6D4]/10"
        />
        <StatCard 
          title="Compliance Score" 
          value={82} 
          suffix="%"
          icon={<FileText size={20} />} 
          trend={{ value: 2.1, isPositive: true }}
          description="Regulatory audit alignment index metrics."
          glowColor="hover:border-emerald-500/30 hover:shadow-emerald-500/10"
        />
      </div>

      {/* Advanced Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Chart 1: Longitudinal Risk Score Trend */}
        <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md text-left">
          <SectionHeader 
            title="Risk Index Longitudinal Trend" 
            description="Tracking average contract risk scores alongside critical flag counts over time."
            badge="Time Trends"
            className="mb-6"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvgScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="Avg Risk Index" dataKey="averageScore" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorAvgScore)" />
                <Area type="monotone" name="Critical Counts" dataKey="criticalCount" stroke="#EF4444" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Clause Frequency vs Average Risk Scatter Plot */}
        <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md text-left">
          <SectionHeader 
            title="Clause Impact Distribution" 
            description="Comparing covenant identification frequencies against their corresponding risk indexes."
            badge="Impact Analysis"
            className="mb-6"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" dataKey="frequency" name="Frequency" unit="%" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis type="number" dataKey="averageRisk" name="Avg Risk Score" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <ZAxis type="category" dataKey="name" name="Clause Type" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-white/10 bg-[#111827] p-3 shadow-xl backdrop-blur-md text-left">
                        <p className="font-heading font-bold text-xs text-white border-b border-white/5 pb-1 mb-1.5">{data.name}</p>
                        <p className="text-3xs text-slate-300">Scanned Frequency: <strong>{data.frequency}%</strong></p>
                        <p className="text-3xs text-orange-400 mt-1">Average Risk Score: <strong>{data.averageRisk}/100</strong></p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Scatter name="Covenants" data={clauseFrequencyData} fill="#06B6D4">
                  {clauseFrequencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.averageRisk > 70 ? '#EF4444' : entry.averageRisk > 50 ? '#F59E0B' : '#06B6D4'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Document Type Classification Bar Chart */}
        <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md text-left">
          <SectionHeader 
            title="Classification Counts" 
            description="Portfolio counts categorized by parsed template classes."
            badge="Structure"
            className="mb-6"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey="count" name="Class Count" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                  {categoryBreakdownData.map((_, index) => {
                    const colors = ['#4F46E5', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Risk Types Distribution Bar Chart */}
        <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md text-left">
          <SectionHeader 
            title="Risk Category Analysis" 
            description="Isolation of compliance anomalies segmented by business risk categories."
            badge="Categories"
            className="mb-6"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRiskCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey="count" name="Identified Exceptions" radius={[4, 4, 0, 0]}>
                  {categoryRiskCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </PageContainer>
  );
};
export default Analytics;
