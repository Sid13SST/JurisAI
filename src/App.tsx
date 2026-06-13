import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layout components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

// Pages
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Contracts } from './pages/Contracts';
import { ContractDetails } from './pages/ContractDetails';
import { Comparison } from './pages/Comparison';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

// Layout Wrapper to conditionally show sidebar/navbar
const AppContent = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-[#0A0A0F]">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/:id" element={<ContractDetails />} />
              <Route path="/comparison" element={<Comparison />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Dashboard />} />
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
      <AppContent />
    </Router>
  );
}

export default App;
