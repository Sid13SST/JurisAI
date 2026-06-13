import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  FileText, 
  Calendar, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { RiskBadge } from '../components/ui/RiskBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { mockContracts } from '../data/mockData';


export const Contracts: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Gather unique types for filter dropdown
  const contractTypes = ['All', ...Array.from(new Set(mockContracts.map(c => c.type)))];
  const statuses = ['All', 'Approved', 'Under Review', 'Flagged', 'Draft'];

  const filteredContracts = mockContracts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.uploader.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || c.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedStatus('All');
  };

  return (
    <PageContainer
      title="Contracts Repository"
      subtitle="Search, filter, and audit active client agreements and legal templates."
      action={
        <div className="flex items-center gap-2">
          {/* View Toggles */}
          <div className="flex items-center rounded-xl border border-white/5 bg-white/3 p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      }
    >
      
      {/* Filtering Search Bar */}
      <div className="rounded-2xl border border-white/5 bg-[#111827]/10 p-5 backdrop-blur-md space-y-4 text-left">
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Search Field */}
          <div className="relative md:col-span-6">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search contract name, uploader..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-white/3 py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-primary/50 focus:bg-white/5"
            />
          </div>

          {/* Type Filter */}
          <div className="relative md:col-span-3">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <SlidersHorizontal size={14} />
            </span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 pl-10 pr-4 text-xs text-slate-300 outline-none cursor-pointer appearance-none focus:border-primary/50"
            >
              {contractTypes.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Agreements' : t}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative md:col-span-3">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <Filter size={14} />
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 pl-10 pr-4 text-xs text-slate-300 outline-none cursor-pointer appearance-none focus:border-primary/50"
            >
              {statuses.map(st => (
                <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Grid or List View Render */}
      {filteredContracts.length === 0 ? (
        <EmptyState 
          title="No Contracts Found" 
          description="We couldn't find any documents matching your active query parameters. Try widening your filters."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : viewMode === 'grid' ? (
        
        /* Grid Layout */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {filteredContracts.map((contract) => (
            <div 
              key={contract.id}
              onClick={() => navigate(`/contracts/${contract.id}`)}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111827]/30 p-6 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-[#111827]/60 hover:shadow-[0_0_30px_rgba(79,70,229,0.1)] cursor-pointer flex flex-col justify-between"
            >
              
              {/* Card Top Branding & Badging */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-white/5 p-2.5 text-indigo-400 group-hover:bg-primary/10 group-hover:text-white transition-all duration-300 border border-white/5">
                    <FileText size={20} />
                  </div>
                  <RiskBadge level={contract.riskLevel} />
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-sm text-slate-100 group-hover:text-white transition-colors truncate">
                    {contract.name}
                  </h3>
                  <p className="text-3xs text-slate-400 uppercase tracking-wider font-semibold">
                    {contract.type}
                  </p>
                </div>

                <p className="text-2xs text-slate-400 leading-relaxed line-clamp-3">
                  {contract.executiveSummary}
                </p>
              </div>

              {/* Card Footer Metrics */}
              <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="block text-3xs text-slate-500 uppercase font-bold">Risk Index</span>
                  <span className={`text-xs font-bold font-mono ${
                    contract.riskScore > 80 ? 'text-red-400' : contract.riskScore > 60 ? 'text-orange-400' : 'text-emerald-400'
                  }`}>
                    {contract.riskScore} / 100
                  </span>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="block text-3xs text-slate-500 uppercase font-bold">Last Scanned</span>
                  <span className="block text-3xs font-mono text-slate-400 flex items-center gap-1">
                    <Calendar size={10} /> {contract.lastUpdated}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        
        /* List Layout */
        <div className="space-y-3 text-left">
          {filteredContracts.map((contract) => (
            <div 
              key={contract.id}
              onClick={() => navigate(`/contracts/${contract.id}`)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#111827]/20 p-4 hover:border-primary/20 hover:bg-[#111827]/40 transition-all duration-300 cursor-pointer"
            >
              
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-white/5 p-2.5 text-indigo-400 border border-white/5">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-200 group-hover:text-white transition-colors">
                    {contract.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-3xs text-slate-400 font-semibold">{contract.type}</span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-3xs text-slate-400 font-mono">By {contract.uploader.split(' (')[0]}</span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-3xs text-slate-400 font-mono">{contract.fileSize}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:self-center">
                <div className="text-left sm:text-right">
                  <span className="block text-3xs text-slate-500 uppercase font-bold">Audit Score</span>
                  <span className={`text-xs font-bold font-mono ${
                    contract.riskScore > 80 ? 'text-red-400' : contract.riskScore > 60 ? 'text-orange-400' : 'text-emerald-400'
                  }`}>
                    {contract.riskScore} / 100
                  </span>
                </div>

                <div className="h-8 w-px bg-white/5" />
                <RiskBadge level={contract.riskLevel} />
                <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
              </div>

            </div>
          ))}
        </div>
      )}

    </PageContainer>
  );
};
export default Contracts;
