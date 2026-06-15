import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Search, MessageSquarePlus, Trash2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import {
  sendMessage as apiSendMessage,
  listSessions,
  listMessages,
  deleteSession as apiDeleteSession,
  type ChatMessage as ChatMessageType,
  type ChatSource
} from '../../services/chatApi';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { SuggestedQuestions } from './SuggestedQuestions';
import { InsightsPanel } from './InsightsPanel';

interface ChatPanelProps {
  contract: any;
  clauses: any[];
  clauseRisks: any[];
  riskAnalysis: any | null;
  onJumpToSource: (sectionNumber: string, sectionTitle: string) => void;
}

type SearchMode = 'ai' | 'keyword';

interface KeywordHit {
  sectionNumber: string;
  title: string;
  snippet: string;
}

function makeLocalId(): string {
  return `local-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  contract,
  clauses,
  clauseRisks,
  riskAnalysis,
  onJumpToSource
}) => {
  const { showToast } = useToast();
  const contractId = contract?.contractId;

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<SearchMode>('ai');
  const [keyword, setKeyword] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load the most recent existing session for this contract on mount.
  useEffect(() => {
    let cancelled = false;
    if (!contractId) return;
    (async () => {
      try {
        const sessions = await listSessions(contractId);
        if (cancelled || sessions.length === 0) return;
        const latest = sessions[0];
        const msgs = await listMessages(latest.sessionId);
        if (cancelled) return;
        setSessionId(latest.sessionId);
        setMessages(msgs);
      } catch {
        // Non-fatal: start with an empty chat.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  // Auto-scroll on new messages / typing.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  /** Resolves a citation to a document section and jumps to it. */
  const handleJump = (source: ChatSource) => {
    if (source.sourceType === 'section') {
      onJumpToSource(source.sourceRef, source.title);
      return;
    }
    // clause / risk reference -> find the clause to get its section.
    const clause = (clauses || []).find((c) => c.clauseId === source.sourceRef);
    if (clause) {
      onJumpToSource(clause.sectionNumber || '', clause.sectionTitle || source.title);
    } else {
      showToast('Could not link this source to a document section.', 'info');
    }
  };

  const askQuestion = async (text: string) => {
    if (!contractId || loading) return;

    const userMsg: ChatMessageType = {
      messageId: makeLocalId(),
      sessionId: sessionId || '',
      contractId,
      userId: '',
      role: 'user',
      content: text,
      sources: [],
      confidence: 0,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await apiSendMessage({ contractId, question: text, sessionId });
      setSessionId(res.sessionId);
      const assistantMsg: ChatMessageType = {
        messageId: makeLocalId(),
        sessionId: res.sessionId,
        contractId,
        userId: '',
        role: 'assistant',
        content: res.answer,
        sources: res.sources || [],
        confidence: res.confidence,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      showToast(err.message || 'Failed to get an answer.', 'error');
      // Roll back the optimistic user message so they can retry.
      setMessages((prev) => prev.filter((m) => m.messageId !== userMsg.messageId));
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  const clearCurrentSession = async () => {
    if (!sessionId) {
      startNewChat();
      return;
    }
    try {
      await apiDeleteSession(sessionId);
      showToast('Chat session deleted.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete session.', 'error');
    } finally {
      startNewChat();
    }
  };

  // Client-side keyword search over clauses + parsed sections.
  const keywordHits: KeywordHit[] = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (mode !== 'keyword' || q.length < 2) return [];
    const hits: KeywordHit[] = [];

    for (const c of clauses || []) {
      const hay = `${c.clauseType} ${c.summary} ${c.fullText}`.toLowerCase();
      const idx = hay.indexOf(q);
      if (idx !== -1) {
        const text = c.fullText || c.summary || '';
        const pos = text.toLowerCase().indexOf(q);
        const start = Math.max(0, pos - 60);
        hits.push({
          sectionNumber: c.sectionNumber || '',
          title: `${c.clauseType}${c.sectionNumber ? ' (Section ' + c.sectionNumber + ')' : ''}`,
          snippet: (pos !== -1 ? text.slice(start, pos + q.length + 60) : text.slice(0, 140)).trim()
        });
      }
    }

    const sections: any[] = Array.isArray(contract?.structuredText) ? contract.structuredText : [];
    for (const s of sections) {
      const content = s.content || '';
      const pos = content.toLowerCase().indexOf(q);
      if (pos !== -1) {
        const start = Math.max(0, pos - 60);
        hits.push({
          sectionNumber: s.sectionNumber || '',
          title: `${s.sectionNumber ? s.sectionNumber + ' ' : ''}${s.title || 'Section'}`,
          snippet: content.slice(start, pos + q.length + 60).trim()
        });
      }
    }
    return hits.slice(0, 30);
  }, [keyword, mode, clauses, contract]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Chat column */}
      <div className="lg:col-span-8 flex flex-col">
        <div className="rounded-2xl border border-white/5 bg-[#111827]/15 backdrop-blur-md flex flex-col h-[calc(100vh-230px)] glass-panel overflow-hidden">
          {/* Header: mode toggle + actions */}
          <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-2.5 shrink-0">
            <div className="flex items-center gap-1 rounded-xl bg-black/30 p-0.5">
              <button
                onClick={() => setMode('ai')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                  mode === 'ai' ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={11} /> Ask AI
              </button>
              <button
                onClick={() => setMode('keyword')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                  mode === 'keyword' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search size={11} /> Search Contract
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={startNewChat}
                title="New chat"
                className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-2 py-1.5 text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <MessageSquarePlus size={12} /> New
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearCurrentSession}
                  title="Delete this chat"
                  className="flex items-center justify-center rounded-lg border border-red-500/10 bg-red-500/5 px-2 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          {mode === 'ai' ? (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 && !loading ? (
                  <SuggestedQuestions onPick={askQuestion} disabled={loading} />
                ) : (
                  messages.map((m) => (
                    <ChatMessage key={m.messageId} message={m} onJumpToSource={handleJump} />
                  ))
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-slate-500"
                    >
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Sparkles size={13} className="text-white" />
                      </div>
                      <div className="flex items-center gap-1.5 rounded-2xl glass-panel border border-white/8 px-4 py-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-white/5 p-3 shrink-0">
                <MessageInput onSend={askQuestion} disabled={loading} />
                <p className="mt-1.5 text-center text-[9px] text-slate-600">
                  Answers are grounded in this contract. JurisAI does not provide legal advice.
                </p>
              </div>
            </>
          ) : (
            /* Keyword search mode */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 shrink-0 border-b border-white/5">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Exact keyword search across clauses and sections..."
                    className="w-full rounded-xl border border-white/8 bg-black/30 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-primary/40"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {keyword.trim().length < 2 ? (
                  <p className="text-center text-[11px] text-slate-600 py-8">Type at least 2 characters to search.</p>
                ) : keywordHits.length === 0 ? (
                  <p className="text-center text-[11px] text-slate-600 py-8">No matches found in this contract.</p>
                ) : (
                  keywordHits.map((hit, i) => (
                    <button
                      key={i}
                      onClick={() => onJumpToSource(hit.sectionNumber, hit.title)}
                      className="w-full text-left rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 hover:border-primary/30 hover:bg-white/5 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5">
                        <FileText size={11} className="text-cyan-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate">{hit.title}</span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-500 line-clamp-2">…{hit.snippet}…</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insights column */}
      <div className="lg:col-span-4">
        <div className="h-[calc(100vh-230px)] overflow-y-auto pr-1">
          <InsightsPanel
            contract={contract}
            clauseRisks={clauseRisks}
            riskAnalysis={riskAnalysis}
            onAsk={(q) => {
              setMode('ai');
              askQuestion(q);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
