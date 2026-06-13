import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, MessageSquare } from 'lucide-react';
import { Logo } from '../ui/Logo';


export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-[#08080E] py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 lg:gap-12">
          
          {/* Brand Info Column */}
          <div className="col-span-2 space-y-4">
            <Logo showText={true} iconSize={36} />
            <p className="max-w-xs text-xs text-slate-400 leading-relaxed">
              Enterprise-grade AI-powered legal intelligence for contract clause extraction, risk assessment, and executive summarization.
            </p>
            
            {/* Compliance Badge */}
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-1.5 w-fit">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-3xs font-semibold text-emerald-400">SOC 2 Type II Certified</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-200">Product</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><NavLink to="/dashboard" className="hover:text-white transition-colors">Risk Analyzer</NavLink></li>
              <li><NavLink to="/comparison" className="hover:text-white transition-colors">Compare Suite</NavLink></li>
              <li><NavLink to="/analytics" className="hover:text-white transition-colors">Compliance Board</NavLink></li>
              <li><span className="text-slate-600 cursor-not-allowed">Auto-Redaction (Beta)</span></li>
            </ul>
          </div>

          {/* Resource Links */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-200">Resources</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Legal AI Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Data Security Sheet</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Customer Success</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-200">Company</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Trust Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Relations</a></li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-white/5" />

        {/* Footer Sub-bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-2xs text-slate-500">
          <p>&copy; {currentYear} JurisAI Inc. All rights reserved. For demonstration and visual review purposes only.</p>
          
          {/* Social Icons & Legal links */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="GitHub">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="Discussions">
                <MessageSquare size={14} />
              </a>
            </div>
            <div className="flex items-center gap-3 font-semibold">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
export default Footer;
