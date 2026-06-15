import React from 'react';
import { Sparkles, User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType, ChatSource } from '../../services/chatApi';
import { SourceCitation } from './SourceCitation';

interface ChatMessageProps {
  message: ChatMessageType;
  onJumpToSource?: (source: ChatSource) => void;
}

function confidenceStyle(confidence: number): string {
  if (confidence >= 80) return 'text-green-400 border-green-500/20 bg-green-500/10';
  if (confidence >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
  return 'text-red-400 border-red-500/20 bg-red-500/10';
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onJumpToSource }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-white/5 border border-white/10 text-slate-300'
            : 'bg-gradient-to-br from-primary to-secondary text-white'
        }`}
      >
        {isUser ? <User size={13} /> : <Sparkles size={13} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-primary/15 border border-primary/20 text-slate-100 rounded-tr-sm'
              : 'glass-panel border border-white/8 text-slate-200 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        {/* Assistant: confidence + sources */}
        {!isUser && (
          <>
            {message.confidence > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${confidenceStyle(message.confidence)}`}>
                  {message.confidence}% confidence
                </span>
              </div>
            )}
            {Array.isArray(message.sources) && message.sources.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Sources</span>
                {message.sources.map((s, i) => (
                  <SourceCitation key={`${s.sourceRef}-${i}`} source={s} onJump={onJumpToSource} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
