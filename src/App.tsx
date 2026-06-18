import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Providers
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Guards
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { PublicRoute } from './components/routes/PublicRoute';

// Layout components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

// Pages
import { Landing } from './pages/Landing';
import { LandingLedger } from './pages/LandingLedger';
import { Dashboard } from './pages/Dashboard';
import { Contracts } from './pages/Contracts';
import { ContractDetails } from './pages/ContractDetails';
import { LegalCopilot } from './pages/LegalCopilot';
import { Comparison } from './pages/Comparison';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { EvaluationDashboard } from './pages/EvaluationDashboard';

// Layout Wrapper to conditionally show sidebar/navbar/footer
const AppContent = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const authPaths = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPaths.includes(location.pathname);
  const isLandingPage = location.pathname === '/' || location.pathname === '/ledger';

  if (isLandingPage || isAuthPage) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-[#0A0A0F]">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/ledger" element={<LandingLedger />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          </Routes>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0F]">
      
      {/* Collapsible Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Panel Content Frame */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Route Pages Container */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
              <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetails /></ProtectedRoute>} />
              <Route path="/copilot" element={<ProtectedRoute><LegalCopilot /></ProtectedRoute>} />
              <Route path="/comparison" element={<ProtectedRoute><Comparison /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/evaluation" element={<ProtectedRoute><EvaluationDashboard /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            </Routes>
          </AnimatePresence>
          <Footer />
        </div>

      </div>

    </div>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
