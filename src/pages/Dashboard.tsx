import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ShieldAlert, 
  AlertOctagon,
  FolderLock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { PageContainer } from '../components/layout/PageContainer';
import { StatCard } from '../components/ui/StatCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { RiskBadge } from '../components/ui/RiskBadge';
import { 
  dashboardStats, 
  recentContractsList, 
  riskDistributionData, 
  categoryBreakdownData, 
  monthlyActivityData
} from '../data/mockData';


export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Columns for the Recent Contracts Table
  const columns: Column<any>[] = [
    {
      header: 'Contract Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/5 p-2 text-indigo-400 border border-white/5">
            <FileText size={16} />
          </div>
          <div>
            <p className="font-semibold text-xs text-slate-200 hover:text-indigo-400 transition-colors">{row.name}</p>
            <p className="text-3xs text-slate-400">Ver: {row.id.includes('saas') ? 'v3.2' : row.id.includes('nda') ? 'v1.0' : 'v2.0'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Agreement Type',
      accessor: 'type',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
          {row.type}
        </span>
      )
    },
    {
      header: 'Risk Score',
      accessor: 'riskScore',
      sortable: true,
      render: (row) => {
        const score = row.riskScore;
        const color = score > 80 ? 'text-red-400' : score > 60 ? 'text-orange-400' : score > 40 ? 'text-amber-400' : 'text-emerald-400';
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full bg-white/5 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  score > 80 ? 'bg-red-500' : score > 60 ? 'bg-orange-500' : score > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`text-xs font-bold font-mono ${color}`}>{score}/100</span>
          </div>
        );
      }
    },
    {
      header: 'Level',
      accessor: 'riskLevel',
      sortable: true,
      render: (row) => <RiskBadge level={row.riskLevel} />
    },
    {
      header: 'Analyzed Date',
      accessor: 'lastUpdated',
      sortable: true,
      render: (row) => <span className="text-xs font-mono text-slate-400">{row.lastUpdated}</span>
    }
  ];

  // Tooltip customizer for charts
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
      title="Legal Operations Dashboard"
      subtitle="Verify risk distributions, monitor extraction volume, and review compliance trends."
      action={
        <button 
          onClick={() => navigate('/contracts')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-95 transition-all duration-300"
        >
          <Sparkles size={14} className="animate-pulse" />
          <span>Analyze New Draft</span>
        </button>
      }
    >
      
      {/* Top Welcome Notification banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/10 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 p-6 backdrop-blur-md">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10 text-left">
          <div className="space-y-1">
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-white tracking-tight flex items-center gap-2">
              Welcome Back, Legal Operations Team <Sparkles size={18} className="text-cyan-400" />
            </h2>
            <p className="text-xs text-slate-400 max-w-xl leading-normal">
              Tenant database synchronized. <strong>14 critical risk exemptions</strong> were flagged in the last 48 hours across vendor logistics and executive employment renewals.
            </p>
          </div>
          <button 
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#111827]/40 px-3 py-1.5 text-2xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-all w-fit"
          >
            <span>Resolve Flagged Items</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Contracts Analyzed" 
          value={dashboardStats.contractsAnalyzed} 
          icon={<FileText size={20} />} 
          trend={{ value: 12.4, isPositive: true }}
          description="Total commercial drafts processed since inception."
          glowColor="hover:border-[#06B6D4]/30 hover:shadow-[#06B6D4]/10"
        />
        <StatCard 
          title="Average Risk Score" 
          value={dashboardStats.avgRiskScore} 
          suffix="/100"
          icon={<AlertOctagon size={20} />} 
          trend={{ value: 3.8, isPositive: false }}
          description="Global risk rating across active repository."
          glowColor="hover:border-amber-500/30 hover:shadow-amber-500/10"
        />
        <StatCard 
          title="High-Risk Contracts" 
          value={dashboardStats.highRiskContracts} 
          icon={<ShieldAlert size={20} />} 
          trend={{ value: 8.5, isPositive: true }}
          description="Contracts requiring immediate legal redress."
          glowColor="hover:border-red-500/30 hover:shadow-red-500/10"
        />
        <StatCard 
          title="Total Clauses Scanned" 
          value={dashboardStats.clausesReviewed} 
          icon={<FolderLock size={20} />} 
          trend={{ value: 24.1, isPositive: true }}
          description="Individual legal covenants extracted by AI."
          glowColor="hover:border-emerald-500/30 hover:shadow-emerald-500/10"
        />
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Chart 1: Monthly Activity Area Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md text-left">
          <SectionHeader 
            title="Analysis Pipeline Activity" 
            description="Monthly comparison between parsed agreements and identified risk exemptions."
            badge="Activity Tracker"
            className="mb-6"
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAnalyzed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                <Area type="monotone" name="Total Parsed" dataKey="analyzed" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorAnalyzed)" />
                <Area type="monotone" name="Flagged Risks" dataKey="flagged" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFlagged)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Risk Level Pie Chart */}
        <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md text-left flex flex-col justify-between">
          <SectionHeader 
            title="Exposure Distribution" 
            description="Breakdown of agreements categorized by compliance risk levels."
            badge="Risk Ratios"
            className="mb-4"
          />
          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
              <span className="text-2xl font-extrabold text-white">68</span>
              <span className="text-4xs font-bold uppercase tracking-wider text-slate-500">Avg Score</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-3xs font-semibold text-slate-400 mt-2">
            {riskDistributionData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 px-1 py-1 rounded bg-white/2 border border-white/5">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                <span className="truncate">{entry.name.split(' (')[0]} ({entry.count})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Contract Category Horizontal Bar Chart */}
      <div className="rounded-2xl border border-white/5 bg-[#111827]/20 p-5 backdrop-blur-md text-left">
        <SectionHeader 
          title="Document Portfolio Breakdown" 
          description="Distribution of contract types currently tracked within JurisAI."
          badge="Classification"
          className="mb-6"
        />
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={categoryBreakdownData} 
              layout="vertical"
              margin={{ top: 5, right: 10, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
              <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="count" name="Total Contracts" radius={[0, 4, 4, 0]}>
                {categoryBreakdownData.map((_, index) => {
                  const colors = ['#4F46E5', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Contracts Table Section */}
      <div className="space-y-4 text-left">
        <SectionHeader 
          title="Recently Parsed Agreements" 
          description="Review recent legal imports and deep-dive into identified vulnerabilities."
          badge="Audit Stream"
          action={
            <button 
              onClick={() => navigate('/contracts')}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-2xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span>View Directory</span>
              <ChevronRight size={12} />
            </button>
          }
        />
        <DataTable 
          columns={columns} 
          data={recentContractsList} 
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/contracts/${row.id}`)}
        />
      </div>

    </PageContainer>
  );
};
export default Dashboard;
