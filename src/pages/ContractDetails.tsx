import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Sparkles, 
  Send,
  MessageSquare,
  ShieldCheck,
  Zap,
  Download
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeader } from '../components/ui/SectionHeader';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ClauseCard } from '../components/ui/ClauseCard';
import { mockContracts } from '../data/mockData';

export const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const contract = mockContracts.find(c => c.id === id) || mockContracts[0];

  // AI Chat Assistant state
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: `Hello! I have completed analyzing "${contract.name}". I detected ${contract.riskFlags.length} primary risk exposures. You can ask me questions about this agreement, such as "What is the liability cap?" or "What are the payment terms?"` }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    // Generate responsive simulated AI answer based on keywords
    setTimeout(() => {
      let aiText = "I parsed the contract text for that question, but could not find a highly confident match. Please clarify, or ask me about liability caps, indemnification, or termination terms.";
      
      const query = userMsg.toLowerCase();
      if (query.includes('liability') || query.includes('cap') || query.includes('limit')) {
        const liabClause = contract.clauses.find(c => c.name.toLowerCase().includes('liability') || c.riskDescription.toLowerCase().includes('liability'));
        aiText = liabClause 
          ? `The Limitation of Liability clause states: "${liabClause.text}". Analysis: ${liabClause.riskDescription}`
          : "I did not find a dedicated Limitation of Liability clause, which is a major legal omission risk.";
      } else if (query.includes('indemnity') || query.includes('indemnify')) {
        const indClause = contract.clauses.find(c => c.name.toLowerCase().includes('indem') || c.riskDescription.toLowerCase().includes('indem'));
        aiText = indClause 
          ? `Regarding Indemnification, the clause states: "${indClause.text}". Analysis: ${indClause.riskDescription}`
          : "No specific indemnification clauses were isolated in this scan.";
      } else if (query.includes('terminate') || query.includes('termination')) {
        const termClause = contract.clauses.find(c => c.name.toLowerCase().includes('terminat') || c.riskDescription.toLowerCase().includes('terminat'));
        aiText = termClause 
          ? `Regarding Termination, the contract specifies: "${termClause.text}". Analysis: ${termClause.riskDescription}`
          : "Termination parameters were not explicitly isolated in this document section.";
      } else if (query.includes('payment') || query.includes('fee')) {
        const payClause = contract.clauses.find(c => c.name.toLowerCase().includes('pay') || c.riskDescription.toLowerCase().includes('pay'));
        aiText = payClause 
          ? `Regarding Payment terms, the agreement details: "${payClause.text}". Analysis: ${payClause.riskDescription}`
          : "Payment schedules were not found in this segment.";
      } else if (query.includes('ip') || query.includes('intellectual') || query.includes('patent')) {
        const ipClause = contract.clauses.find(c => c.name.toLowerCase().includes('ip') || c.name.toLowerCase().includes('intellect') || c.text.toLowerCase().includes('owner'));
        aiText = ipClause
          ? `Regarding Intellectual Property, the clause details: "${ipClause.text}". Analysis: ${ipClause.riskDescription}`
          : "No specific intellectual property ownership allocations were isolated.";
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
    }, 800);
  };

  // Determine circular dial coordinates
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (contract.riskScore / 100) * circumference;

  const scoreColor = 
    contract.riskScore > 80 ? 'stroke-red-500 text-red-500' : 
    contract.riskScore > 60 ? 'stroke-orange-500 text-orange-500' : 
    contract.riskScore > 40 ? 'stroke-amber-500 text-amber-500' : 'stroke-emerald-500 text-emerald-500';

  return (
    <PageContainer
      title="Contract Intelligence Room"
      subtitle={`Reviewing: ${contract.name}`}
      action={
        <div className="flex gap-2">
          <Link 
            to="/contracts" 
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-2xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} />
            <span>Vault Directory</span>
          </Link>
          <button 
            onClick={() => alert("Report Exported! Standard PDF generated containing clause logs.")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-2xs font-semibold text-white hover:opacity-95 transition-all"
          >
            <Download size={12} />
            <span>Export Brief</span>
          </button>
        </div>
      }
    >
      
      {/* Top Contract Meta Info Panel */}
      <div className="rounded-2xl border border-white/5 bg-[#111827]/10 p-5 backdrop-blur-md grid grid-cols-2 gap-4 md:grid-cols-5 text-left">
        <div>
          <span className="block text-3xs font-semibold text-slate-500 uppercase">Document Class</span>
          <span className="mt-1 block text-xs font-bold text-white flex items-center gap-1">
            <FileText size={12} className="text-indigo-400" /> {contract.type}
          </span>
        </div>
        <div>
          <span className="block text-3xs font-semibold text-slate-500 uppercase">Analysis Engine</span>
          <span className="mt-1 block text-xs font-bold text-slate-300 flex items-center gap-1">
            <Sparkles size={11} className="text-cyan-400" /> JurisModels v4.2
          </span>
        </div>
        <div>
          <span className="block text-3xs font-semibold text-slate-500 uppercase">File Info</span>
          <span className="mt-1 block text-xs font-mono font-bold text-slate-300">{contract.fileSize} ({contract.version})</span>
        </div>
        <div>
          <span className="block text-3xs font-semibold text-slate-500 uppercase">Imported By</span>
          <span className="mt-1 block text-xs font-bold text-slate-300 truncate">{contract.uploader.split(' (')[0]}</span>
        </div>
        <div className="col-span-2 md:col-span-1">
          <span className="block text-3xs font-semibold text-slate-500 uppercase">Scanned Time</span>
          <span className="mt-1 block text-xs font-mono font-bold text-slate-300">{contract.lastUpdated}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Hand: Core Analysis Reports */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Circular Score Overview & Executive Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 rounded-2xl border border-white/5 bg-[#111827]/20 p-6 backdrop-blur-md">
            
            {/* Speedometer Gauge Dial */}
            <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6 text-left">
              <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider mb-3">Overall Compliance Index</span>
              
              <div className="relative h-36 w-36 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {/* Gauge background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-white/5 fill-none"
                    strokeWidth={strokeWidth}
                  />
                  {/* Gauge indicator path */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className={`fill-none transition-all duration-1000 ${scoreColor}`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                
                {/* Center score readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white tracking-tight font-mono">{contract.riskScore}</span>
                  <span className="text-4xs text-slate-500 font-bold uppercase tracking-wider">Score Index</span>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="text-2xs font-semibold text-slate-400">Risk Severity: </span>
                <RiskBadge level={contract.riskLevel} />
              </div>
            </div>

            {/* Executive Summary */}
            <div className="md:col-span-8 text-left space-y-3">
              <SectionHeader 
                title="AI Executive Summary" 
                badge="Summary Digest"
              />
              <p className="text-xs text-slate-300 leading-relaxed">
                {contract.executiveSummary}
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-[#06B6D4]/5 border border-[#06B6D4]/10 p-3 text-2xs text-[#06B6D4]">
                <Zap size={14} className="shrink-0" />
                <span><strong>Automation Action:</strong> This draft triggers <strong>{contract.riskFlags.length} corporate risk exceptions</strong>. We advise reviewing terms in liability limits and indemnities before signature.</span>
              </div>
            </div>

          </div>

          {/* Clause Extraction List */}
          <div className="space-y-4 text-left">
            <SectionHeader 
              title="Extracted Legal Covenants" 
              description="Parsed clause boundaries with model extraction confidence."
              badge="Covenant Extraction"
            />
            
            <div className="space-y-2.5">
              {contract.clauses.map((clause) => (
                <ClauseCard 
                  key={clause.id}
                  name={clause.name}
                  category={clause.category}
                  text={clause.text}
                  status={clause.status}
                  confidence={clause.confidence}
                  riskLevel={clause.riskLevel}
                  riskDescription={clause.riskDescription}
                />
              ))}
            </div>
          </div>

          {/* Risk Flags & Recommendations */}
          <div className="space-y-4 text-left">
            <SectionHeader 
              title="Identified Risk Flags & Action Items" 
              description="Legal risk exemptions sorted by organizational impact."
              badge="Risk Mitigation"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contract.riskFlags.map((flag) => {
                const flagColor = 
                  flag.severity === 'Critical' ? 'border-red-500/20 bg-red-500/3' :
                  flag.severity === 'High' ? 'border-orange-500/20 bg-orange-500/3' : 'border-amber-500/20 bg-amber-500/3';
                return (
                  <div key={flag.id} className={`rounded-xl border p-5 space-y-4 backdrop-blur-sm flex flex-col justify-between ${flagColor}`}>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-extrabold uppercase tracking-wide text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                          {flag.category} Risk
                        </span>
                        <RiskBadge level={flag.severity} />
                      </div>
                      <p className="text-2xs font-semibold text-slate-200 leading-normal">
                        {flag.description}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-3 space-y-1">
                      <span className="text-3xs font-extrabold uppercase text-indigo-400 flex items-center gap-1">
                        <ShieldCheck size={10} /> Recommended Resolution
                      </span>
                      <p className="text-3xs text-slate-400 leading-relaxed">
                        {flag.recommendation}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Hand Side: AI Chat Assistant Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 rounded-2xl border border-white/5 bg-[#0D0D15]/80 backdrop-blur-md shadow-2xl overflow-hidden h-[calc(100vh-160px)] flex flex-col justify-between">
            
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-3.5 border-b border-white/5 text-left flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/20 p-1.5 text-primary border border-primary/20">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-xs text-white">JurisAssistant Copilot</h3>
                  <span className="text-4xs text-slate-400 flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-500" /> Active Draft Context</span>
                </div>
              </div>
              <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-4xs font-bold uppercase text-cyan-400 flex items-center gap-0.5">
                <Sparkles size={8} /> AI
              </span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-left">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-2xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-tr from-primary to-indigo-600 text-white rounded-br-none'
                      : 'bg-white/5 text-slate-300 border border-white/5 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="border-t border-white/5 p-3 bg-black/20 flex gap-2">
              <input 
                type="text"
                placeholder="Ask a question about this draft..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-white/3 py-2 px-3.5 text-2xs text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-primary/50"
              />
              <button 
                type="submit"
                className="rounded-xl bg-primary px-3 text-white hover:bg-indigo-600 transition-colors shrink-0"
              >
                <Send size={12} />
              </button>
            </form>

          </div>
        </div>

      </div>

    </PageContainer>
  );
};
export default ContractDetails;
