import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Sliders, 
  Save, 
  Moon
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeader } from '../components/ui/SectionHeader';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'workspace'>('profile');

  // Forms states
  const [profileForm, setProfileForm] = useState({
    fullName: 'Siddhant Prasad',
    email: 'siddhant.prasad@jurisai.com',
    role: 'Corporate Legal Counsel',
    company: 'NovaLaw Partners'
  });

  const [appearanceForm, setAppearanceForm] = useState({
    theme: 'Dark Default',
    transparency: true,
    animationSpeed: 'Standard'
  });

  const [notificationsForm, setNotificationsForm] = useState({
    criticalAlerts: true,
    weeklyDigests: false,
    collaboratorNotes: true,
    slackIntegration: true
  });

  const [workspaceForm, setWorkspaceForm] = useState({
    defaultModel: 'JurisModels-4.2-Pro',
    defaultRetention: '90 Days',
    confidenceThreshold: 85
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Configuration parameters updated successfully!");
  };

  return (
    <PageContainer
      title="System Settings"
      subtitle="Configure profile info, dashboard appearance, notification rules, and workspace parameters."
    >
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 text-left">
        
        {/* Left Side: Navigation Tabs */}
        <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-[#111827]/20 p-3 backdrop-blur-md h-fit space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 ${
              activeTab === 'profile' 
                ? 'bg-gradient-to-r from-primary/25 to-secondary/15 text-white border-l-2 border-primary' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <User size={16} />
            <span>Profile Settings</span>
          </button>

          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 ${
              activeTab === 'appearance' 
                ? 'bg-gradient-to-r from-primary/25 to-secondary/15 text-white border-l-2 border-primary' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Moon size={16} />
            <span>Appearance Toggles</span>
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 ${
              activeTab === 'notifications' 
                ? 'bg-gradient-to-r from-primary/25 to-secondary/15 text-white border-l-2 border-primary' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Bell size={16} />
            <span>Notification Rules</span>
          </button>

          <button 
            onClick={() => setActiveTab('workspace')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 ${
              activeTab === 'workspace' 
                ? 'bg-gradient-to-r from-primary/25 to-secondary/15 text-white border-l-2 border-primary' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sliders size={16} />
            <span>Workspace Defaults</span>
          </button>
        </div>

        {/* Right Side: Tab Contents Panel */}
        <div className="lg:col-span-9 rounded-2xl border border-white/5 bg-[#111827]/20 p-6 backdrop-blur-md">
          
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-6">
              <SectionHeader title="Profile Settings" description="Update your personal details and organization title." badge="Account Details" />
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400">Full Name</label>
                  <input 
                    type="text" 
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-[#111827]/50 py-2 px-3 text-xs text-slate-200 focus:border-primary/50 outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400">Work Email</label>
                  <input 
                    type="email" 
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-[#111827]/50 py-2 px-3 text-xs text-slate-200 focus:border-primary/50 outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400">Corporate Role</label>
                  <input 
                    type="text" 
                    value={profileForm.role}
                    onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-[#111827]/50 py-2 px-3 text-xs text-slate-200 focus:border-primary/50 outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400">Company Name</label>
                  <input 
                    type="text" 
                    value={profileForm.company}
                    onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-[#111827]/50 py-2 px-3 text-xs text-slate-200 focus:border-primary/50 outline-none" 
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-end">
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white hover:opacity-95 transition-all">
                  <Save size={14} />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <form onSubmit={handleSave} className="space-y-6">
              <SectionHeader title="Appearance Toggles" description="Customize transparency layers, glassmorphism density, and theme modes." badge="Visuals" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-white/2 border border-white/5 p-4">
                  <div>
                    <h4 className="font-heading font-semibold text-xs text-slate-200">Default Color Theme</h4>
                    <p className="text-3xs text-slate-400">Set the default interface colorway. Currently limited to Dark Theme.</p>
                  </div>
                  <select 
                    value={appearanceForm.theme}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, theme: e.target.value })}
                    className="rounded-xl border border-white/5 bg-[#111827] py-1.5 px-3 text-xs text-slate-200 outline-none"
                  >
                    <option>Dark Default</option>
                    <option>Lights Out (True Black)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/2 border border-white/5 p-4">
                  <div>
                    <h4 className="font-heading font-semibold text-xs text-slate-200">Glassmorphism Transparency</h4>
                    <p className="text-3xs text-slate-400">Enable translucent backdrop blur shadows for cards and overlays.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setAppearanceForm({ ...appearanceForm, transparency: !appearanceForm.transparency })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${appearanceForm.transparency ? 'bg-primary' : ''}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${appearanceForm.transparency ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-end">
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white hover:opacity-95 transition-all">
                  <Save size={14} />
                  <span>Update Theme</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <form onSubmit={handleSave} className="space-y-6">
              <SectionHeader title="Notification Rules" description="Set up automated alerts for contract audits, risk detections, and sync reports." badge="Alert Center" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/2 border border-white/5 p-4">
                  <div>
                    <h4 className="font-heading font-semibold text-xs text-slate-200">Critical Risk Email Alerts</h4>
                    <p className="text-3xs text-slate-400">Receive immediate email alerts when a newly scanned draft has Critical risk flags.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNotificationsForm({ ...notificationsForm, criticalAlerts: !notificationsForm.criticalAlerts })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${notificationsForm.criticalAlerts ? 'bg-primary' : ''}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notificationsForm.criticalAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/2 border border-white/5 p-4">
                  <div>
                    <h4 className="font-heading font-semibold text-xs text-slate-200">Slack Webhook Alerts</h4>
                    <p className="text-3xs text-slate-400">Synchronize warning flags straight into your team's #legal-ops channel.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNotificationsForm({ ...notificationsForm, slackIntegration: !notificationsForm.slackIntegration })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${notificationsForm.slackIntegration ? 'bg-primary' : ''}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notificationsForm.slackIntegration ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-end">
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white hover:opacity-95 transition-all">
                  <Save size={14} />
                  <span>Update Alerts</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'workspace' && (
            <form onSubmit={handleSave} className="space-y-6">
              <SectionHeader title="Workspace Defaults" description="Define threshold models, confidence values, and data retention windows." badge="Legal Ops" />
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400 font-bold">Standard Parsing AI Model</label>
                  <select 
                    value={workspaceForm.defaultModel}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, defaultModel: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 px-3 text-xs text-slate-300 outline-none"
                  >
                    <option>JurisModels-4.2-Pro</option>
                    <option>JurisModels-4.0-Fast</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400 font-bold">Data Retention Window</label>
                  <select 
                    value={workspaceForm.defaultRetention}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, defaultRetention: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-[#111827] py-2 px-3 text-xs text-slate-300 outline-none"
                  >
                    <option>90 Days</option>
                    <option>1 Year</option>
                    <option>Indefinite (SOC2 Compliant)</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-3xs font-extrabold uppercase text-slate-400 font-bold flex justify-between">
                    <span>Audit Confidence Acceptance Threshold</span>
                    <span className="text-indigo-400 font-mono">{workspaceForm.confidenceThreshold}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="50" 
                    max="95" 
                    value={workspaceForm.confidenceThreshold}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, confidenceThreshold: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <p className="text-3xs text-slate-500">Flags are auto-suppressed if AI model certainty falls below this threshold value.</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-end">
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white hover:opacity-95 transition-all">
                  <Save size={14} />
                  <span>Update Rules</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </PageContainer>
  );
};
export default Settings;
