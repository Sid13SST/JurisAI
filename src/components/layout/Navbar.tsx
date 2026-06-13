import React, { useState } from 'react';
import { Bell, Search, User, ChevronDown, LogOut, Settings, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../ui/Logo';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const notifications = [
    {
      id: 1,
      title: "Critical Risk Detected",
      desc: "One-sided indemnity found in 'Master Logistics Vendor Agreement'.",
      time: "2 hours ago",
      type: "critical"
    },
    {
      id: 2,
      title: "Analysis Completed",
      desc: "Project Nova Mutual NDA has been successfully parsed.",
      time: "5 hours ago",
      type: "success"
    },
    {
      id: 3,
      title: "High Risk Flagged",
      desc: "Broad IP ownership overreach detected in Executive Employment Agreement.",
      time: "1 day ago",
      type: "high"
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left Side: Logo & Sidebar Toggle */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Toggle Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          
          <Link to="/" className="lg:hidden">
            <Logo showText={true} iconSize={28} />
          </Link>
          
          <div className="hidden lg:block">
            {/* Context Breadcrumb or Search Bar */}
            <div className="relative w-80">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search contracts, risk flags, clauses..." 
                className="w-full rounded-full border border-white/5 bg-white/5 py-1.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none ring-primary/20 transition-all focus:border-primary/50 focus:bg-white/10 focus:ring-4"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Widgets */}
        <div className="flex items-center gap-3">
          
          {/* AI Helper Quick Link */}
          <Link 
            to="/contracts" 
            className="hidden items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 sm:flex"
          >
            <Sparkles size={12} className="animate-pulse" />
            <span>AI Risk Audit</span>
          </Link>

          {/* Notifications Center */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className={`relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors ${showNotifications ? 'bg-white/5 text-white' : ''}`}
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0A0A0F]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-white/10 bg-[#111827] p-2 shadow-2xl ring-1 ring-black/50 glass-panel">
                <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 pb-2">
                  <h4 className="font-heading font-semibold text-sm text-slate-200">Alert Center</h4>
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-2xs font-semibold text-red-400">3 Unresolved</span>
                </div>
                <div className="divide-y divide-white/5 overflow-y-auto max-h-80">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className="p-3 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/contracts');
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-0.5 rounded-full p-1 ${
                          n.type === 'critical' ? 'bg-red-500/10 text-red-400' :
                          n.type === 'high' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'
                        }`}>
                          <ShieldAlert size={14} />
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-xs text-slate-200">{n.title}</p>
                          <p className="mt-0.5 text-2xs text-slate-400 leading-relaxed">{n.desc}</p>
                          <span className="mt-1 block text-3xs text-slate-500">{n.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/5 p-2 text-center">
                  <Link 
                    to="/contracts" 
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-primary hover:text-indigo-400 transition-colors"
                  >
                    View all parsed files
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10" />

          {/* Profile User Control Panel */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-full p-1 hover:bg-white/5 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-semibold text-sm">
                SP
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-200">Siddhant Prasad</p>
                <p className="text-3xs text-slate-400">Legal Counsel</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#111827] p-1 shadow-2xl ring-1 ring-black/50 glass-panel">
                <div className="border-b border-white/5 px-3 py-2 text-left">
                  <p className="text-xs font-bold text-slate-200">JurisAI Platform</p>
                  <p className="text-3xs text-slate-400">Tier: Enterprise Platinum</p>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <User size={14} />
                    <span>My Profile</span>
                  </button>
                  <button 
                    onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Settings size={14} />
                    <span>Account Settings</span>
                  </button>
                  <button 
                    onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <HelpCircle size={14} />
                    <span>Support Desk</span>
                  </button>
                </div>
                <div className="border-t border-white/5 p-1">
                  <button 
                    onClick={() => { setShowProfileMenu(false); navigate('/'); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
