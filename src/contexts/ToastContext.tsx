import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          border: 'border-emerald-500/20',
          bg: 'bg-emerald-500/5',
          text: 'text-emerald-400',
          icon: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        };
      case 'error':
        return {
          border: 'border-red-500/20',
          bg: 'bg-red-500/5',
          text: 'text-red-400',
          icon: <AlertCircle size={16} className="text-red-400 shrink-0" />
        };
      case 'warning':
        return {
          border: 'border-amber-500/20',
          bg: 'bg-amber-500/5',
          text: 'text-amber-400',
          icon: <AlertTriangle size={16} className="text-amber-400 shrink-0" />
        };
      case 'info':
        return {
          border: 'border-cyan-500/20',
          bg: 'bg-cyan-500/5',
          text: 'text-cyan-400',
          icon: <Info size={16} className="text-cyan-400 shrink-0" />
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Alert Overlay Portal */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = getToastStyle(toast.type);
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
                layout
                className={`pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border ${style.border} ${style.bg} p-4 shadow-xl backdrop-blur-md glass-panel`}
              >
                <div className="flex gap-2.5 items-start">
                  {style.icon}
                  <span className={`text-2xs font-semibold leading-relaxed ${style.text}`}>
                    {toast.message}
                  </span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="rounded-lg p-0.5 text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
