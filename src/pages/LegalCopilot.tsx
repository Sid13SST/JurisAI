import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Activity } from 'lucide-react';
import { CompliancePanel } from '../components/copilot/CompliancePanel';
import { NegotiationAssistant } from '../components/copilot/NegotiationAssistant';
import { ContractImprovementPanel } from '../components/copilot/ContractImprovementPanel';
import {
  analyzeCompliance,
  generateNegotiationSuggestions,
  calculateReadinessScore,
  getLegalInsights,
  type ComplianceAnalysis,
  type NegotiationSuggestion,
  type ReadinessScore,
  type LegalInsights
} from '../services/copilot.service';

export const LegalCopilot: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compliance' | 'negotiation' | 'insights'>('compliance');
  const [contractText, setContractText] = useState('Sample contract text...'); // In a real app, this is fetched from the selected contract
  const [contractType, setContractType] = useState('SaaS Agreement');

  const [complianceData, setComplianceData] = useState<ComplianceAnalysis | null>(null);
  const [readinessData, setReadinessData] = useState<ReadinessScore | null>(null);
  const [negotiationData, setNegotiationData] = useState<NegotiationSuggestion[]>([]);
  const [insightsData, setInsightsData] = useState<LegalInsights | null>(null);

  const [loading, setLoading] = useState({
    compliance: false,
    negotiation: false,
    insights: false,
    readiness: false
  });

  const runAnalysis = async () => {
    // This is a simulation of running the copilot on a selected contract
    try {
      setLoading(prev => ({ ...prev, compliance: true, readiness: true }));
      
      // We would normally pass the real contract text
      // MOCK DATA for demonstration purposes to avoid hitting API during testing without proper keys
      setComplianceData({
        complianceScore: 84,
        classification: 'Good',
        presentProtections: ['Liability Clause', 'Termination Clause', 'Confidentiality Clause'],
        missingProtections: ['Force Majeure', 'Data Protection'],
        weakProtections: [
          { clause: 'IP Ownership', reason: 'Ambiguous wording regarding derived works.' }
        ],
        recommendedAdditions: ['Add standard Force Majeure', 'Include GDPR data protection clause']
      });

      setReadinessData({
        readinessScore: 78,
        classification: 'Needs Minor Review',
        topRecommendations: [
          'Add Force Majeure protection',
          'Clarify IP Ownership for derived works',
          'Limit Liability Exposure to 12 months fees'
        ]
      });

      setLoading(prev => ({ ...prev, compliance: false, readiness: false }));
    } catch (e) {
      console.error(e);
      setLoading(prev => ({ ...prev, compliance: false, readiness: false }));
    }
  };

  const loadNegotiation = async () => {
    if (negotiationData.length > 0) return;
    setLoading(prev => ({ ...prev, negotiation: true }));
    // Mocking response
    setTimeout(() => {
      setNegotiationData([
        {
          currentClause: "Vendor liability shall be unlimited.",
          riskExplanation: "Potentially unlimited financial exposure.",
          recommendation: "Introduce a liability cap equal to 12 months of fees paid.",
          suggestedRevision: "Vendor's aggregate liability under this Agreement shall not exceed the total fees paid by Customer during the twelve (12) months immediately preceding the event giving rise to the claim.",
          expectedRiskReduction: "Reduces financial exposure.",
          priority: "Critical"
        },
        {
          currentClause: "Customer may not terminate this agreement early under any circumstances.",
          riskExplanation: "Locks the customer into the contract even if the vendor breaches.",
          recommendation: "Allow termination for material breach with a cure period.",
          suggestedRevision: "Either party may terminate this Agreement if the other party materially breaches any term and fails to cure such breach within thirty (30) days of written notice.",
          expectedRiskReduction: "Provides exit option for non-performance.",
          priority: "High"
        }
      ]);
      setLoading(prev => ({ ...prev, negotiation: false }));
    }, 1500);
  };

  const loadInsights = async () => {
    if (insightsData) return;
    setLoading(prev => ({ ...prev, insights: true }));
    setTimeout(() => {
      setInsightsData({
        mostRiskyClause: { clause: "Unlimited Liability", reason: "Potentially unlimited financial exposure." },
        mostUnusualClause: { clause: "Perpetual License", reason: "SaaS agreements typically grant subscription-based licenses, not perpetual." },
        mostNegotiableClause: { clause: "Payment Terms (Net 15)", reason: "Industry standard is often Net 30 or Net 45." },
        mostFavorableClause: { clause: "Service Level Agreement (99.99%)", reason: "Very high uptime guarantee favoring the customer." },
        mostProblematicSection: { section: "Indemnification", reason: "One-sided indemnity favoring the vendor only." }
      });
      setLoading(prev => ({ ...prev, insights: false }));
    }, 1500);
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  useEffect(() => {
    if (activeTab === 'negotiation') loadNegotiation();
    if (activeTab === 'insights') loadInsights();
  }, [activeTab]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/5 bg-[#0A0A0F] px-8 py-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Sparkles className="text-primary" size={28} />
              <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Legal Copilot</h1>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Your premium AI consultant for understanding, improving, and negotiating contracts.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Contract</p>
              <p className="text-sm font-medium text-white flex items-center gap-2 mt-1">
                <FileText size={14} className="text-slate-400" />
                Acme Corp SaaS Agreement v2.pdf
              </p>
            </div>
            {readinessData && (
              <div className="ml-4 rounded-xl border border-white/10 bg-[#12121A] px-6 py-3 text-center shadow-lg">
                <p className="text-3xs text-slate-400 uppercase tracking-wider font-semibold">Readiness Score</p>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                  <span className="text-2xl font-bold text-white">{readinessData.readinessScore}</span>
                  <span className="text-xs text-slate-500">/100</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-6 border-b border-white/5">
          {[
            { id: 'compliance', label: 'Compliance & Readiness' },
            { id: 'negotiation', label: 'Negotiation Assistant' },
            { id: 'insights', label: 'Legal Insights' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative pb-4 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="copilot-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-5xl space-y-8"
          >
            {activeTab === 'compliance' && (
              <>
                <CompliancePanel data={complianceData} isLoading={loading.compliance} />
                <ContractImprovementPanel data={readinessData} isLoading={loading.readiness} />
              </>
            )}

            {activeTab === 'negotiation' && (
              <NegotiationAssistant suggestions={negotiationData} isLoading={loading.negotiation} />
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-primary" size={24} />
                  <h3 className="text-lg font-semibold text-white">Legal Insights Engine</h3>
                </div>
                {loading.insights ? (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm text-slate-400">Extracting legal insights...</p>
                    </div>
                  </div>
                ) : insightsData ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(insightsData).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-white/5 bg-[#12121A] p-5">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <h4 className="mt-2 text-sm font-medium text-white">{value.clause || value.section}</h4>
                        <p className="mt-2 text-sm text-slate-400">{value.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

// Simple AnimatePresence mock if not imported at top
import { AnimatePresence } from 'framer-motion';
