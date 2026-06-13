import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  GitCompare, 
  BarChart3, 
  Settings, 
  Database,
  Sparkles
} from 'lucide-react';
import { Logo } from '../ui/Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { name: 'Command Center', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Contracts Vault', path: '/contracts', icon: <FileText size={18} /> },
    { name: 'Contract Comparator', path: '/comparison', icon: <GitCompare size={18} /> },
    { name: 'Analytics Terminal', path: '/analytics', icon: <BarChart3 size={18} /> },
    { name: 'System Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-white/5 bg-[#0D0D15] px-4 py-5 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Brand Header */}
        <div className="mb-8 flex items-center justify-between px-2">
          <NavLink to="/" onClick={onClose}>
            <Logo showText={true} iconSize={32} />
          </NavLink>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Routes */}
        <nav className="flex-1 space-y-1.5 px-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-primary/20 to-secondary/15 text-white border-l-2 border-primary shadow-[inset_0_0_12px_rgba(79,70,229,0.05)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Sidebar Widget: Storage Limit Meter */}
        <div className="mt-auto rounded-2xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Database size={16} />
            <span className="font-heading font-bold text-xs">Tenant Data Vault</span>
          </div>
          <p className="mt-1 text-3xs text-slate-400 leading-normal">Active contract analysis storage quota.</p>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-3xs font-semibold text-slate-300">
              <span>Used Capacity</span>
              <span>42.8 GB / 100 GB</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent" 
                style={{ width: '42.8%' }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-3xs font-medium text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors">
            <Sparkles size={10} />
            <span>Request Quota Expansion</span>
          </div>
        </div>

      </aside>
    </>
  );
};
