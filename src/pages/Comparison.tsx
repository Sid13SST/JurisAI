import React, { useState } from 'react';
import { 
  GitCompare, 
  Sparkles
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeader } from '../components/ui/SectionHeader';
import { RiskBadge } from '../components/ui/RiskBadge';
import { mockContracts } from '../data/mockData';
import type { Contract } from '../data/mockData';

export const Comparison: React.FC = () => {
  // Select active compare slots (defaulting to SaaS, NDA, and Vendor agreements)
  const [slotA, setSlotA] = useState<string>(mockContracts[0].id);
  const [slotB, setSlotB] = useState<string>(mockContracts[1].id);
  const [slotC, setSlotC] = useState<string>(mockContracts[3].id);

  const contractA = mockContracts.find(c => c.id === slotA) || mockContracts[0];
  const contractB = mockContracts.find(c => c.id === slotB) || mockContracts[1];
  const contractC = mockContracts.find(c => c.id === slotC) || mockContracts[3];

  const getClauseContent = (contract: Contract, keyword: string) => {
    const clause = contract.clauses.find(c => 
      c.name.toLowerCase().includes(keyword) || 
      c.category.toLowerCase().includes(keyword) ||
      c.text.toLowerCase().includes(keyword)
    );

    if (!clause) {
      return {
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        text: "Clause not explicitly defined or missing from this agreement type.",
        status: "Critical" as const,
        riskLevel: "High" as const,
        riskDescription: "The absence of this clause creates a structural legal omission risk."
      };
    }
    return clause;
  };

  const comparisonCategories = [
    { label: 'Liability Limitation', keyword: 'liability' },
    { label: 'Indemnification Covenants', keyword: 'indemnity' },
    { label: 'Payment Obligations', keyword: 'payment' },
    { label: 'Termination & Exit', keyword: 'termination' }
  ];

  return (
    <PageContainer
      title="Contract Comparison Suite"
      subtitle="Select up to three agreements to perform a side-by-side compliance audit."
      action={
        <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-indigo-400">
          <Sparkles size={12} className="animate-pulse" />
          <span>Cross-Model Alignment Active</span>
        </div>
      }
    >
      
      {/* Selector Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-left">
        
        {/* Selector A */}
        <div className="rounded-2xl border border-white/5 bg-[#111827]/30 p-5 space-y-3">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/25 font-mono text-3xs font-bold text-indigo-400">A</span>
          <label className="block text-3xs font-extrabold uppercase text-slate-400">Select Contract A</label>
          <select 
            value={slotA}
            onChange={(e) => setSlotA(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 px-3 text-xs text-slate-200 outline-none"
          >
            {mockContracts.map(c => (
              <option key={c.id} value={c.id} disabled={c.id === slotB || c.id === slotC}>{c.name}</option>
            ))}
          </select>
          <div className="flex items-center justify-between pt-1">
            <span className="text-3xs text-slate-400">{contractA.type}</span>
            <RiskBadge level={contractA.riskLevel} />
          </div>
        </div>

        {/* Selector B */}
        <div className="rounded-2xl border border-white/5 bg-[#111827]/30 p-5 space-y-3">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary/25 font-mono text-3xs font-bold text-violet-400">B</span>
          <label className="block text-3xs font-extrabold uppercase text-slate-400">Select Contract B</label>
          <select 
            value={slotB}
            onChange={(e) => setSlotB(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 px-3 text-xs text-slate-200 outline-none"
          >
            {mockContracts.map(c => (
              <option key={c.id} value={c.id} disabled={c.id === slotA || c.id === slotC}>{c.name}</option>
            ))}
          </select>
          <div className="flex items-center justify-between pt-1">
            <span className="text-3xs text-slate-400">{contractB.type}</span>
            <RiskBadge level={contractB.riskLevel} />
          </div>
        </div>

        {/* Selector C */}
        <div className="rounded-2xl border border-white/5 bg-[#111827]/30 p-5 space-y-3">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/25 font-mono text-3xs font-bold text-cyan-400">C</span>
          <label className="block text-3xs font-extrabold uppercase text-slate-400">Select Contract C</label>
          <select 
            value={slotC}
            onChange={(e) => setSlotC(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 px-3 text-xs text-slate-200 outline-none"
          >
            {mockContracts.map(c => (
              <option key={c.id} value={c.id} disabled={c.id === slotA || c.id === slotB}>{c.name}</option>
            ))}
          </select>
          <div className="flex items-center justify-between pt-1">
            <span className="text-3xs text-slate-400">{contractC.type}</span>
            <RiskBadge level={contractC.riskLevel} />
          </div>
        </div>

      </div>

      {/* Comparison Grid Table */}
      <div className="space-y-6 text-left">
        <SectionHeader 
          title="Clause Differential Analysis" 
          description="Side-by-side extracted text mapping. Risk variances are marked using background glows."
          badge="Differential Matrix"
        />

        {/* Column Headers */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/10 pb-4 font-heading text-xs font-bold text-slate-400 uppercase tracking-wider gap-4">
          <div className="md:col-span-3">Covenant Node</div>
          <div className="md:col-span-3 text-slate-200">Contract A (Risk Score: {contractA.riskScore})</div>
          <div className="md:col-span-3 text-slate-200">Contract B (Risk Score: {contractB.riskScore})</div>
          <div className="md:col-span-3 text-slate-200">Contract C (Risk Score: {contractC.riskScore})</div>
        </div>

        {/* Category Rows */}
        <div className="divide-y divide-white/5 space-y-4">
          {comparisonCategories.map((cat, idx) => {
            const clA = getClauseContent(contractA, cat.keyword);
            const clB = getClauseContent(contractB, cat.keyword);
            const clC = getClauseContent(contractC, cat.keyword);

            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 items-start transition-colors hover:bg-white/1">
                
                {/* Category Label */}
                <div className="md:col-span-3 space-y-1 pr-4">
                  <h4 className="font-heading font-extrabold text-xs text-slate-200 flex items-center gap-1.5">
                    <GitCompare size={14} className="text-indigo-400" />
                    {cat.label}
                  </h4>
                  <p className="text-3xs text-slate-500">Cross-reference index: {cat.keyword}</p>
                </div>

                {/* Contract A Cell */}
                <div className={`md:col-span-3 rounded-xl border p-4.5 space-y-2.5 backdrop-blur-sm ${
                  clA.status === 'Critical' ? 'border-red-500/10 bg-red-500/2' :
                  clA.status === 'Warning' ? 'border-amber-500/10 bg-amber-500/2' : 'border-white/5 bg-[#111827]/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-semibold text-slate-400">{clA.name}</span>
                    <RiskBadge level={clA.riskLevel} />
                  </div>
                  <p className="font-mono text-3xs leading-relaxed text-slate-300">
                    "{clA.text}"
                  </p>
                  <p className="text-3xs text-slate-400 border-t border-white/5 pt-2 italic">
                    {clA.riskDescription}
                  </p>
                </div>

                {/* Contract B Cell */}
                <div className={`md:col-span-3 rounded-xl border p-4.5 space-y-2.5 backdrop-blur-sm ${
                  clB.status === 'Critical' ? 'border-red-500/10 bg-red-500/2' :
                  clB.status === 'Warning' ? 'border-amber-500/10 bg-amber-500/2' : 'border-white/5 bg-[#111827]/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-semibold text-slate-400">{clB.name}</span>
                    <RiskBadge level={clB.riskLevel} />
                  </div>
                  <p className="font-mono text-3xs leading-relaxed text-slate-300">
                    "{clB.text}"
                  </p>
                  <p className="text-3xs text-slate-400 border-t border-white/5 pt-2 italic">
                    {clB.riskDescription}
                  </p>
                </div>

                {/* Contract C Cell */}
                <div className={`md:col-span-3 rounded-xl border p-4.5 space-y-2.5 backdrop-blur-sm ${
                  clC.status === 'Critical' ? 'border-red-500/10 bg-red-500/2' :
                  clC.status === 'Warning' ? 'border-amber-500/10 bg-amber-500/2' : 'border-white/5 bg-[#111827]/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-semibold text-slate-400">{clC.name}</span>
                    <RiskBadge level={clC.riskLevel} />
                  </div>
                  <p className="font-mono text-3xs leading-relaxed text-slate-300">
                    "{clC.text}"
                  </p>
                  <p className="text-3xs text-slate-400 border-t border-white/5 pt-2 italic">
                    {clC.riskDescription}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </PageContainer>
  );
};
export default Comparison;
