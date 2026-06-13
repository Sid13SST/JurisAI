import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Sliders, 
  Save, 
  Moon, 
  Camera, 
  Mail, 
  Calendar, 
  ShieldCheck 
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const Settings: React.FC = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'workspace'>('profile');

  // Profile fields state
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [role, setRole] = useState('Corporate Legal Counsel');
  const [company, setCompany] = useState('NovaLaw Partners');
  
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(fullName);
      showToast('Profile name updated successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to update profile name.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMock = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Configuration parameters updated successfully!', 'success');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Unsupported file format. Please upload JPG, PNG, or WEBP.', 'error');
      return;
    }

    // Size validation (Max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('File size exceeds the 5 MB limit.', 'error');
      return;
    }

    // Read and convert file
    const reader = new FileReader();
    reader.onloadstart = () => {
      setUploadProgress(0);
    };

    reader.onload = async () => {
      const base64Url = reader.result as string;

      // Simulated smooth progress interval
      let progress = 0;
      const interval = setInterval(async () => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          try {
            await updateUserProfile(fullName, base64Url);
            showToast('Profile avatar updated successfully.', 'success');
          } catch (err: any) {
            showToast('Failed to save avatar image.', 'error');
          } finally {
            setUploadProgress(null);
          }
        }
      }, 50);
    };

    reader.onerror = () => {
      showToast('Error reading file contents.', 'error');
      setUploadProgress(null);
    };

    reader.readAsDataURL(file);
  };

  const getInitials = () => {
    if (currentUser?.displayName) {
      const parts = currentUser.displayName.trim().split(/\s+/);
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  const getProviderName = () => {
    if (!currentUser) return 'Unknown';
    const providerId = currentUser.providerData[0]?.providerId;
    if (providerId === 'google.com') return 'Google OAuth';
    if (providerId === 'password') return 'Email / Password';
    return 'Local Session';
  };

  const getCreationDate = () => {
    if (!currentUser?.metadata?.creationTime) return 'N/A';
    try {
      return new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return currentUser.metadata.creationTime;
    }
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
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 cursor-pointer ${
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
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 cursor-pointer ${
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
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 cursor-pointer ${
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
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 cursor-pointer ${
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
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <SectionHeader title="Profile Settings" description="Update your personal details and organization title." badge="Account Details" />
              
              {/* Profile Avatar & Metadata Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
                <div className="relative group">
                  <div className="h-20 w-20 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-gradient-to-tr from-primary to-secondary text-white text-2xl font-bold relative shadow-lg">
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Avatar" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <span>{getInitials()}</span>
                    )}

                    {/* Progress Indicator */}
                    {uploadProgress !== null && (
                      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center z-10">
                        <div className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <span className="text-[9px] text-primary mt-1 font-mono">{uploadProgress}%</span>
                      </div>
                    )}

                    {/* Hover Trigger */}
                    {uploadProgress === null && (
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer z-10">
                        <Camera size={18} />
                        <span className="text-[9px] mt-1 font-semibold">Upload Photo</span>
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/webp" 
                          className="hidden" 
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
                    <span>{currentUser?.displayName || 'JurisAI User'}</span>
                  </h3>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-3xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail size={10} className="text-slate-500" />
                      <span>{currentUser?.email}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} className="text-slate-500" />
                      <span>Member since {getCreationDate()}</span>
                    </span>
                  </div>
                  <div className="flex justify-center sm:justify-start pt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-3xs font-medium text-cyan-400 border border-cyan-500/20">
                      <ShieldCheck size={10} />
                      <span>Auth provider: {getProviderName()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSaving}
                    placeholder="Siddhant Prasad"
                    className="w-full rounded-xl border border-white/5 bg-[#111827]/50 py-2 px-3 text-xs text-slate-200 focus:border-primary/50 outline-none transition-all disabled:opacity-50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Work Email (Read Only)</label>
                  <input 
                    type="email" 
                    value={currentUser?.email || ''} 
                    disabled 
                    className="w-full rounded-xl border border-white/5 bg-white/2 py-2 px-3 text-xs text-slate-500 cursor-not-allowed outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Corporate Role</label>
                  <input 
                    type="text" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-xl border border-white/5 bg-[#111827]/50 py-2 px-3 text-xs text-slate-200 focus:border-primary/50 outline-none transition-all disabled:opacity-50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Company Name</label>
                  <input 
                    type="text" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-xl border border-white/5 bg-[#111827]/50 py-2 px-3 text-xs text-slate-200 focus:border-primary/50 outline-none transition-all disabled:opacity-50" 
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <form onSubmit={handleSaveMock} className="space-y-6">
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
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white hover:opacity-95 transition-all cursor-pointer">
                  <Save size={14} />
                  <span>Update Theme</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveMock} className="space-y-6">
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
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white hover:opacity-95 transition-all cursor-pointer">
                  <Save size={14} />
                  <span>Update Alerts</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'workspace' && (
            <form onSubmit={handleSaveMock} className="space-y-6">
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
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white hover:opacity-95 transition-all cursor-pointer">
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
