import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Premium loading overlay skeleton
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0F] text-slate-200">
        <div className="relative flex items-center justify-center h-24 w-24">
          {/* Animated concentric glowing rings */}
          <div className="absolute h-full w-full rounded-full border border-primary/20 border-t-primary animate-spin" />
          <div className="absolute h-4/5 w-4/5 rounded-full border border-cyan-500/10 border-b-cyan-500 animate-spin [animation-duration:1.5s]" />
          <Sparkles size={24} className="text-cyan-400 animate-pulse" />
        </div>
        <p className="mt-4 font-heading font-extrabold text-xs uppercase tracking-widest text-slate-400 animate-pulse">
          Decrypting Session Credentials...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to login page, preserving the source location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
export default ProtectedRoute;
