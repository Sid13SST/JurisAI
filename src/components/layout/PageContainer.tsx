import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action
}) => {
  // Scroll to top on page mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 ${className}`}
    >
      {/* Page Header section */}
      {(title || subtitle || action) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
          <div className="space-y-1">
            {title && (
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="flex shrink-0 items-center gap-3">
              {action}
            </div>
          )}
        </div>
      )}

      {/* Main content slot */}
      <main className="w-full">
        {children}
      </main>
    </motion.div>
  );
};
export default PageContainer;
