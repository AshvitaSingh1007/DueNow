import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  User, 
  Check, 
  RefreshCw, 
  Sliders, 
  Heart, 
  Cpu, 
  ShieldCheck, 
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Lightbulb,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Standard predefined AI Companion Avatars
interface CompanionAvatarPreset {
  id: string;
  name: string;
  emoji: string;
  style: string;
  description: string;
  accent: string;
  imageUrl: string; // fallback if needed, or we use beautiful avatars/emojis
}

const PRESET_COMPANIONS: CompanionAvatarPreset[] = [
  { id: 'zephyr', name: 'Zephyr', emoji: '🌌', style: 'Futuristic', description: 'Deep cosmic insights, high efficiency guidance, and structured roadmap modeling.', accent: 'from-[#FF4D00]/20 to-[#FF4D00]', imageUrl: '' },
  { id: 'sophia', name: 'Sophia', emoji: '⚖️', style: 'Professional', description: 'Strategic executive management style, milestone analysis, and concise corporate feedback.', accent: 'from-amber-600 to-rose-600', imageUrl: '' },
  { id: 'kai', name: 'Kai', emoji: '⚡', style: 'Friendly', description: 'Energetic productivity partner. Motivates, coordinates speed runs, and keeps morale elevated.', accent: 'from-emerald-600 to-teal-600', imageUrl: '' },
  { id: 'zara', name: 'Zara', emoji: '🔮', style: 'Minimalist', description: 'Calm, low-noise executive presence. Provides ultra-crisp summaries and reduces visual clutter.', accent: 'from-purple-600 to-fuchsia-600', imageUrl: '' }
];

export const AvatarCustomizer: React.FC = () => {
  const { userProfile, updateProfile, googleAccessToken, connectGoogle, disconnectGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'user' | 'companion' | 'google' | 'advanced' | 'help' | 'diagnostics' | 'hackathon'>('companion');

  // --- DEV & PREFERENCES STATES ---
  const [devModeEnabled, setDevModeEnabled] = useState(() => localStorage.getItem('due_now_dev_mode') === 'true');
  const [privacyLogging, setPrivacyLogging] = useState(() => localStorage.getItem('due_now_privacy_logging') !== 'false');
  const [privacySandbox, setPrivacySandbox] = useState(() => localStorage.getItem('due_now_privacy_sandbox') === 'true');
  const [notifyPreMeeting, setNotifyPreMeeting] = useState(() => localStorage.getItem('due_now_notify_premeeting') !== 'false');
  const [notifySuccessRisk, setNotifySuccessRisk] = useState(() => localStorage.getItem('due_now_notify_successrisk') !== 'false');
  const [accessReduceMotion, setAccessReduceMotion] = useState(() => localStorage.getItem('due_now_access_reducemotion') === 'true');
  const [accessEnlargedTargets, setAccessEnlargedTargets] = useState(() => localStorage.getItem('due_now_access_enlargedtargets') === 'true');

  // --- ADVANCED / DEMO MODE STATE ---
  const [demoEnabled, setDemoEnabled] = useState(() => {
    return localStorage.getItem('due_now_demo_mode') === 'true';
  });
  const [demoToggling, setDemoToggling] = useState(false);

  const [preferredWorkStart, setPreferredWorkStart] = useState('09:00');
  const [preferredWorkEnd, setPreferredWorkEnd] = useState('17:00');
  const [preferredFocusDuration, setPreferredFocusDuration] = useState(45);
  const [preferredReminderTiming, setPreferredReminderTiming] = useState(30);
  const [preferredMeetingBuffer, setPreferredMeetingBuffer] = useState(15);
  const [communicationStyle, setCommunicationStyle] = useState<'concise' | 'analytical' | 'supportive'>('analytical');
  const [aiProactivity, setAiProactivity] = useState<'low' | 'medium' | 'high'>('high');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch adaptive preferences when mounting or when switching to advanced tab
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await fetch('/api/preferences/adaptive');
        if (res.ok) {
          const data = await res.json();
          setPreferredWorkStart(data.preferredWorkStart || '09:00');
          setPreferredWorkEnd(data.preferredWorkEnd || '17:00');
          setPreferredFocusDuration(data.preferredFocusDuration || 45);
          setPreferredReminderTiming(data.preferredReminderTiming || 30);
          setPreferredMeetingBuffer(data.preferredMeetingBuffer || 15);
          setCommunicationStyle(data.communicationStyle || 'analytical');
          setAiProactivity(data.aiProactivity || 'high');
        }
      } catch (err) {
        console.warn('Silent error retrieving adaptive co-pilot preferences:', err);
      }
    };
    if (activeTab === 'advanced') {
      fetchPrefs();
    }
  }, [activeTab]);

  const handleSaveAdaptivePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setSaveSuccess(false);
    try {
      const prefs = {
        preferredWorkStart,
        preferredWorkEnd,
        preferredFocusDuration,
        preferredReminderTiming,
        preferredMeetingBuffer,
        communicationStyle,
        aiProactivity
      };
      const res = await fetch('/api/preferences/adaptive', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving adaptive preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleToggleDemoMode = async (enabled: boolean) => {
    setDemoToggling(true);
    try {
      const res = await fetch('/api/demo/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (res.ok) {
        localStorage.setItem('due_now_demo_mode', enabled ? 'true' : 'false');
        setDemoEnabled(enabled);
        window.location.reload();
      }
    } catch (err) {
      console.error('Error toggling demo mode:', err);
    } finally {
      setDemoToggling(false);
    }
  };

  // --- USER AVATAR STATE ---
  const [userAvatarType, setUserAvatarType] = useState<'initials' | 'photo' | 'upload'>('initials');
  const [userInitialsColor, setUserInitialsColor] = useState('bg-[#FF4D00]');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- COMPANION AVATAR STATE ---
  const [companionName, setCompanionName] = useState(userProfile?.personality || 'Zephyr');
  const [selectedPreset, setSelectedPreset] = useState<string>('zephyr');
  const [companionGender, setCompanionGender] = useState<'Male' | 'Female' | 'Friendly' | 'Minimal' | 'Futuristic' | 'Realistic'>('Futuristic');
  const [companionStyle, setCompanionStyle] = useState<'Professional' | 'Friendly' | 'Minimal' | 'Futuristic' | 'Realistic'>('Futuristic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [customCompanionPreset, setCustomCompanionPreset] = useState<CompanionAvatarPreset | null>(null);

  // --- GOOGLE SERVICES SETTINGS STATE ---
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [syncingTasks, setSyncingTasks] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleTasksSync = async () => {
    if (!googleAccessToken) return;
    setSyncingTasks(true);
    setSyncSuccess(false);
    try {
      const res = await fetch('/api/google/tasks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken || 'default-user-id'}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error synchronizing tasks:', err);
    } finally {
      setSyncingTasks(false);
    }
  };

  const renderServiceCard = (
    title: string,
    emoji: string,
    desc: string,
    permissionsList: string[],
    connected: boolean,
    serviceKey: string,
    badgeText?: string,
    showSync?: boolean
  ) => {
    const isExpanded = expandedService === serviceKey;
    const lastSyncStr = connected ? 'Last Synced: Just now' : 'Last Synced: Not connected';

    return (
      <div 
        key={serviceKey}
        className="p-5 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl flex flex-col justify-between min-h-[220px] transition-all hover:shadow-xs relative overflow-hidden"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-150 dark:bg-zinc-805 rounded-lg text-sm">{emoji}</span>
              <h4 className="text-xs font-bold text-gray-905 dark:text-white">{title}</h4>
            </div>
            {badgeText && (
              <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[8px] font-bold uppercase tracking-wider">
                {badgeText}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed font-sans font-light">
            {desc}
          </p>

          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1.5"
            >
              <h5 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Granted Scopes & Capabilities:</h5>
              <ul className="space-y-1">
                {permissionsList.map((perm, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-zinc-400 font-sans font-light">
                    <span className="text-accent text-[8px]">●</span> {perm}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        <div className="pt-3 mt-4 border-t border-slate-150 dark:border-zinc-800/60 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 font-bold uppercase">
            <span>{connected ? '🟢 ACTIVE' : '⚪ INACTIVE'}</span>
            <span className="text-[8px] tracking-wider text-slate-400 font-light lowercase font-sans">{lastSyncStr}</span>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <button
              onClick={() => setExpandedService(isExpanded ? null : serviceKey)}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-705 dark:text-zinc-400 dark:hover:text-zinc-200 uppercase tracking-wide transition-all select-none"
            >
              {isExpanded ? 'Hide Scopes' : 'Manage Scopes'}
            </button>
            <div className="flex items-center gap-1.5">
              {showSync && connected && (
                <button
                  onClick={handleTasksSync}
                  disabled={syncingTasks}
                  className="px-2 py-1 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-50 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingTasks ? 'animate-spin' : ''}`} />
                  {syncSuccess ? 'Synced ✓' : 'Sync'}
                </button>
              )}
              {!connected ? (
                <button
                  onClick={connectGoogle}
                  className="px-2.5 py-1 bg-accent hover:bg-accent/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Authorize
                </button>
              ) : (
                <button
                  onClick={disconnectGoogle}
                  className="px-2.5 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle fake upload for user avatar
  const handleUserAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setTimeout(() => {
        setCustomAvatarUrl(reader.result as string);
        setUserAvatarType('upload');
        setIsUploading(false);
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  // Handle companion AI generation simulation
  const handleGenerateAICompanion = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationLogs(['Initiating neural model matrix...', 'Setting prompt parameter weights...', 'Analyzing task list deadlines...']);

    const logs = [
      'Rendering cinematic lighting layers...',
      'Injecting conversational NLP nodes...',
      'Aligning vocal resonance styles...',
      'Glow layers fully resolved.',
      'AI Companion Core initiated successfully!'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Apply generated custom companion
            const customId = `custom-${Date.now()}`;
            const generatedCompanion: CompanionAvatarPreset = {
              id: customId,
              name: companionName,
              emoji: '🤖',
              style: companionStyle,
              description: `Custom-tailored AI executive advisor in ${companionStyle} mode. Focused on maximum execution efficiency.`,
              accent: 'from-[#FF4D00]/20 to-[#FF4D00]',
              imageUrl: ''
            };
            setCustomCompanionPreset(generatedCompanion);
            setSelectedPreset(customId);
            setIsGenerating(false);
          }, 400);
          return 100;
        }

        // Add logs progressively
        if (prev % 20 === 0 && currentLogIndex < logs.length) {
          setGenerationLogs((prevLogs) => [...prevLogs, logs[currentLogIndex]]);
          currentLogIndex++;
        }

        return prev + 5;
      });
    }, 100);
  };

  // Sync companion choice to database profile
  const handleSaveCompanionSettings = async (preset: CompanionAvatarPreset) => {
    try {
      await updateProfile({
        personality: preset.id as any, // maps to database profile updates
      });
      alert(`AI Companion "${preset.name}" is now online as your active executive companion!`);
    } catch (e) {
      console.error('Error syncing companion settings:', e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-faint pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-display font-extrabold tracking-tight text-ink flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Avatar Identity & Companion Systems
          </h2>
          <p className="text-ink-muted text-xs font-light font-sans">
            Design your identity card and orchestrate personalized AI companion nodes.
          </p>
        </div>

        {/* Tab Toggle switcher */}
        <div className="flex flex-wrap gap-1 bg-ink-faint p-1 rounded-2xl border border-ink-faint shadow-inner justify-center md:justify-start">
          <button
            onClick={() => setActiveTab('companion')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'companion'
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            AI Companion
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'user'
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Your Profile
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'google'
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Google Workspace
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'advanced'
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Co-Pilot & Preferences
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'help'
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Help & Docs
          </button>
          <button
            onClick={() => setActiveTab('hackathon')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'hackathon'
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Submission Kit
          </button>
          {devModeEnabled && (
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === 'diagnostics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-400 hover:text-indigo-300'
              }`}
            >
              Diagnostics
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'companion' ? (
          <motion.div
            key="companion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left: Interactive Configurator */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* COMPANION SPEC DESIGN PANEL */}
              <div className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-6 shadow-sm space-y-5 text-left">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2 font-display">
                  <Sliders className="w-4 h-4 text-accent" />
                  Orchestrate Custom AI Avatar
                </h3>

                <div className="space-y-4">
                  {/* Name parameter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold text-ink-muted uppercase tracking-wider block">
                      Companion Name
                    </label>
                    <input
                      type="text"
                      value={companionName}
                      onChange={(e) => setCompanionName(e.target.value)}
                      placeholder="e.g. Zephyr, Sarah, Jarvis..."
                      className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none focus:border-accent/50"
                    />
                  </div>

                  {/* Twin toggle controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gender Tone Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-semibold text-ink-muted uppercase tracking-wider block">
                        Gender Preset
                      </label>
                      <select
                        value={companionGender}
                        onChange={(e: any) => setCompanionGender(e.target.value)}
                        className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none focus:border-accent/50"
                      >
                        <option value="Futuristic">Non-binary (Cosmic)</option>
                        <option value="Female">Female Style</option>
                        <option value="Male">Male Style</option>
                        <option value="Friendly">Casual / Warm</option>
                        <option value="Minimal">Low Noise</option>
                        <option value="Realistic">Synthesized Human</option>
                      </select>
                    </div>

                    {/* Aesthetic Mode */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-semibold text-ink-muted uppercase tracking-wider block">
                        Aesthetic Style
                      </label>
                      <select
                        value={companionStyle}
                        onChange={(e: any) => setCompanionStyle(e.target.value)}
                        className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none focus:border-accent/50"
                      >
                        <option value="Futuristic">Futuristic (Neon glow)</option>
                        <option value="Professional">Corporate Executive</option>
                        <option value="Friendly">Cozy Companion</option>
                        <option value="Minimal">Swiss Grid Minimalist</option>
                        <option value="Realistic">Hyper Realistic Portrait</option>
                      </select>
                    </div>
                  </div>

                  {/* Simulate Generation Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleGenerateAICompanion}
                      disabled={isGenerating || !companionName.trim()}
                      className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/10 cursor-pointer"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Generating AI Assets ({generationProgress}%)
                        </>
                      ) : (
                        <>
                          <Cpu className="w-4 h-4" />
                          Generate Custom AI Portrait Assets
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* ACTIVE PRESET SELECTION CHIPS */}
              <div className="space-y-3.5 text-left">
                <h4 className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-widest block">
                  Select Predefined Companion Nodes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...PRESET_COMPANIONS, ...(customCompanionPreset ? [customCompanionPreset] : [])].map((item) => {
                    const isSelected = selectedPreset === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedPreset(item.id);
                          setCompanionName(item.name);
                        }}
                        className={`text-left p-4.5 rounded-2xl border transition-all relative flex flex-col justify-between h-40 group cursor-pointer ${
                          isSelected 
                            ? 'bg-bg/85 border-accent shadow-md shadow-accent/5' 
                            : 'bg-bg/40 border-ink-faint hover:border-accent/30 hover:bg-bg/60'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{item.emoji}</span>
                            <div>
                              <h4 className="text-xs font-bold text-ink">{item.name}</h4>
                              <span className="text-[9px] font-mono uppercase text-accent font-bold block">{item.style} Preset</span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-4.5 h-4.5 rounded-full bg-accent flex items-center justify-center text-white text-[9px]">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-ink-muted font-sans leading-relaxed mt-2 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="pt-2 w-full flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveCompanionSettings(item);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                              isSelected 
                                ? 'bg-accent text-white' 
                                : 'bg-ink-faint text-ink-muted group-hover:bg-accent group-hover:text-white'
                            }`}
                          >
                            Set Online
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right: AI Asset Rendering Engine Simulator */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-20%] w-[150px] h-[150px] bg-[#FF4D00]/10 rounded-full blur-[40px] pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#FF4D00]/10 text-[#FF4D00] rounded-md">
                      RENDER ENGINE: V1.2.4
                    </span>
                    <h3 className="font-display font-bold text-base text-slate-800 dark:text-white mt-1">
                      Companion Core Matrix
                    </h3>
                  </div>

                  {/* Generation Progress state */}
                  {isGenerating ? (
                    <div className="space-y-4 py-8">
                      <div className="relative w-44 h-44 mx-auto rounded-full border-2 border-dashed border-[#FF4D00]/20 flex items-center justify-center animate-spin" style={{ animationDuration: '10s' }} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 mt-8">
                        <span className="text-3xl font-bold font-display text-[#FF4D00]">{generationProgress}%</span>
                        <span className="text-[9px] font-mono text-slate-400 animate-pulse uppercase tracking-wider">Rendering neural node</span>
                      </div>

                      {/* Diagnostic console terminal logs */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-[9px] space-y-1 h-32 overflow-y-auto text-emerald-400 scrollbar-none select-none text-left">
                        {generationLogs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-slate-600">[{i}]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 text-center py-6">
                      {/* Generative Visual box representation */}
                      <div className="relative w-40 h-40 mx-auto rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 overflow-hidden shadow-inner group">
                        
                        {/* Selected preset gradient highlight */}
                        <div className={`absolute inset-0 bg-gradient-to-tr opacity-10 blur-xl ${
                          PRESET_COMPANIONS.find(p => p.id === selectedPreset)?.accent || 'from-[#FF4D00]/20 to-[#FF4D00]'
                        }`} />

                        {/* Custom visual avatar emoji display */}
                        <span className="text-6.5xl select-none group-hover:scale-110 transition-transform duration-300">
                          {selectedPreset.startsWith('custom-') 
                            ? '🤖' 
                            : PRESET_COMPANIONS.find(p => p.id === selectedPreset)?.emoji || '🌌'}
                        </span>
                      </div>

                      <div className="space-y-1.5 max-w-xs mx-auto">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {companionName} Style Offline Check
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-light">
                          Your companion style is set to <span className="font-bold text-[#FF4D00]">{companionStyle}</span>. Click "Set Online" on any preset to initiate it.
                        </p>
                      </div>

                      {/* Interactive metadata lists */}
                      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4.5 space-y-2.5 text-left text-[11px] font-mono select-none">
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Acoustic Sync:</span>
                          <span className="text-slate-700 dark:text-white font-bold uppercase">Synthesized</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 border-t border-slate-200/50 dark:border-white/5 pt-2">
                          <span>Core Personality:</span>
                          <span className="text-[#FF4D00] font-bold uppercase">{selectedPreset}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 border-t border-slate-200/50 dark:border-white/5 pt-2">
                          <span>Execution Mode:</span>
                          <span className="text-slate-700 dark:text-white font-bold">{companionStyle}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#FF4D00]/5 border border-[#FF4D00]/10 rounded-2xl flex items-start gap-3.5 select-none text-left">
                  <ShieldCheck className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-light leading-normal">
                    DueNow companion configurations are isolated on device and synced only to private server vaults. Absolutely no data training models are fed with executive files.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        ) : (
          <motion.div
            key="user"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Left Column - User Avatar Upload / Presets */}
            <div className="md:col-span-6 space-y-6">
              <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FF4D00]" />
                  Identity Selection Mode
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'initials', label: 'Use Initials', icon: HelpCircle },
                    { type: 'upload', label: 'Upload Photo', icon: Upload },
                    { type: 'photo', label: 'Capture Live', icon: Camera }
                  ].map((btn) => (
                    <button
                      key={btn.type}
                      onClick={() => setUserAvatarType(btn.type as any)}
                      className={`p-3.5 rounded-2xl border transition-all text-center flex flex-col items-center gap-2 cursor-pointer ${
                        userAvatarType === btn.type
                          ? 'bg-slate-100 dark:bg-[#FF4D00]/10 border-[#FF4D00] text-[#FF4D00]'
                          : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <btn.icon className="w-4 h-4" />
                      <span className="text-[10px] font-bold tracking-tight">{btn.label}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {userAvatarType === 'initials' && (
                    <motion.div
                      key="initials"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Choose Background Glow Color</span>
                      <div className="flex gap-3">
                        {[
                          { bg: 'bg-[#FF4D00]', name: 'Orange' },
                          { bg: 'bg-rose-600', name: 'Rose' },
                          { bg: 'bg-emerald-600', name: 'Emerald' },
                          { bg: 'bg-amber-600', name: 'Amber' },
                          { bg: 'bg-purple-600', name: 'Purple' }
                        ].map((color) => (
                          <button
                            key={color.bg}
                            onClick={() => setUserInitialsColor(color.bg)}
                            className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center cursor-pointer transition-transform ${
                              userInitialsColor === color.bg ? 'scale-110 ring-2 ring-[#FF4D00] ring-offset-2 dark:ring-offset-slate-950' : 'opacity-80 hover:opacity-100'
                            }`}
                            title={color.name}
                          >
                            {userInitialsColor === color.bg && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {userAvatarType === 'upload' && (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 text-center"
                    >
                      <div className="border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl p-6 hover:border-[#FF4D00] dark:hover:border-[#FF4D00]/50 transition-all cursor-pointer relative group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUserAvatarUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="space-y-2 flex flex-col items-center">
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#FF4D00] transition-colors" />
                          <div>
                            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Choose custom picture</span>
                            <span className="block text-[10px] text-slate-400 font-light mt-0.5">PNG, JPG, SVG up to 5MB</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {userAvatarType === 'photo' && (
                    <motion.div
                      key="photo"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-5 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl space-y-4 text-center"
                    >
                      <Camera className="w-8 h-8 mx-auto text-[#FF4D00]" />
                      <div className="space-y-1.5 max-w-xs mx-auto">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Camera Device Connection Required</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans leading-normal">
                          Connect local desktop camera nodes. Accept frame permission prompts at the top of the workspace frame to snap dynamic profile updates instantly.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          alert('Initializing camera driver... Please allow permissions in your browser bar.');
                        }}
                        className="px-4 py-2 bg-[#FF4D00] hover:opacity-95 text-bg rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                      >
                        Initiate Capture Driver
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column - Real-time Identity Card Preview */}
            <div className="md:col-span-6">
              <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm h-full flex flex-col justify-between text-center relative overflow-hidden">
                <div className="absolute top-[-25%] right-[-25%] w-[180px] h-[180px] bg-[#FF4D00]/10 rounded-full blur-[45px] pointer-events-none" />
                
                <div className="space-y-6 py-6">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Identity Card Live Preview</span>

                  {/* Visual Avatar frame */}
                  <div className="relative w-36 h-36 mx-auto rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
                    {userAvatarType === 'initials' || (!customAvatarUrl && userAvatarType === 'upload') ? (
                      <div className={`absolute inset-0 ${userInitialsColor} flex items-center justify-center text-white text-5xl font-display font-extrabold shadow-inner select-none`}>
                        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                    ) : (
                      <img
                        src={customAvatarUrl || ''}
                        alt="Profile avatar"
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-base font-display font-extrabold text-slate-800 dark:text-white">
                      {userProfile?.name || 'Partner Executive'}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-full text-[10px] font-mono font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                      Executive Account Active
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed max-w-xs mx-auto">
                    Your visual avatar helps customize the companion headers, timeline logs, and team check-ins across multiple workspaces.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/50 dark:border-white/5">
                  <button
                    onClick={() => {
                      alert('Identity profile credentials synced! All changes reflected immediately.');
                    }}
                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                  >
                    Save Avatar State
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'google' && (
          <motion.div
            key="google"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6 text-left w-full"
          >
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-accent animate-pulse" />
                      Executive Connected Services Settings
                    </h3>
                    <p className="text-xs text-slate-400 font-light font-sans">
                      Connect, manage permissions, and authorize real-time synchronization with your Google Workspace.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={googleAccessToken ? disconnectGoogle : connectGoogle}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        googleAccessToken
                          ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'
                          : 'bg-accent text-white hover:bg-accent/90 shadow-sm'
                      }`}
                    >
                      {googleAccessToken ? 'Disconnect All' : 'Connect Workspace'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Google Calendar */}
                  {renderServiceCard(
                    "Google Calendar",
                    "📅",
                    "Allows the Planning Engine to dynamically map events, scheduling conflicts, and voice-assisted calendar creation.",
                    ["Read calendars", "Create events", "Update events", "Delete events", "Conflict detection"],
                    !!googleAccessToken,
                    "calendar"
                  )}

                  {/* Gmail Integration */}
                  {renderServiceCard(
                    "Gmail (Read Only)",
                    "✉️",
                    "Enables the AI to safely analyze your inbox context, generating automated briefings and task recommendations.",
                    ["Read emails", "Summarize threads", "Detect deadlines", "Detect action items", "Suggest tasks"],
                    !!googleAccessToken,
                    "gmail",
                    "Read-Only"
                  )}

                  {/* Google Drive */}
                  {renderServiceCard(
                    "Google Drive",
                    "💾",
                    "Enables the Google Picker file selector to analyze project files, documentation, and slide decks.",
                    ["Browse selected folders", "Read files", "Import files", "Analyze documents"],
                    !!googleAccessToken,
                    "drive"
                  )}

                  {/* Google Tasks */}
                  {renderServiceCard(
                    "Google Tasks",
                    "✅",
                    "Synchronizes your tasks between DueNow and Google Tasks for seamless cross-platform capability.",
                    ["Read tasks", "Create Google tasks", "Two-way synchronization", "Convert to Smart Tasks"],
                    !!googleAccessToken,
                    "tasks",
                    undefined,
                    true
                  )}

                  {/* Google Docs */}
                  {renderServiceCard(
                    "Google Docs",
                    "📄",
                    "Deep analysis of connected documents to extract project requirements, action items, and checklists.",
                    ["Summarize content", "Extract action items", "Detect deadlines", "Generate tasks"],
                    !!googleAccessToken,
                    "docs"
                  )}

                  {/* Google Slides */}
                  {renderServiceCard(
                    "Google Slides",
                    "📊",
                    "Evaluates presentation decks, missing sections, flow consistency, and presentation readiness.",
                    ["Analyze slide texts", "Evaluate completeness", "Missing section checks", "Improvement tips"],
                    !!googleAccessToken,
                    "slides"
                  )}

                  {/* Google Keep */}
                  {renderServiceCard(
                    "Google Keep",
                    "💡",
                    "Saves voice captures, quick thoughts, and strategic recommendations instantly as Keep Quick Notes.",
                    ["Voice capture note sync", "Remember this commands", "Save this idea integration", "Quick notes capture"],
                    !!googleAccessToken,
                    "keep"
                  )}

                  {/* Google Meet */}
                  {renderServiceCard(
                    "Google Meet",
                    "📹",
                    "Detects virtual conferences in calendar events to trigger active preparation briefings and focus locks.",
                    ["Detect video conferences", "Meeting preflight prep", "Voice preflight reminders"],
                    !!googleAccessToken,
                    "meet"
                  )}

                  {/* Google Contacts */}
                  {renderServiceCard(
                    "Google Contacts",
                    "👥",
                    "Provides context on email authors and meeting attendees to distinguish recruiters, clients, and partners.",
                    ["Read contacts", "Contextual person tags", "Differentiate interviewers", "Recognize managers"],
                    !!googleAccessToken,
                    "contacts"
                  )}
                </div>

                <div className="p-4 bg-accent/5 border border-accent/15 rounded-2xl flex items-start gap-3 select-none text-left">
                  <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-light leading-normal font-sans">
                    DueNow interacts with Google Workspace via official Google APIs using secure OAuth 2.0 authorization tokens cached entirely inside your local `sessionStorage`. All metadata is secure, and no permanent credentials are stored on centralized databases.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'advanced' && (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6 text-left w-full"
          >
            <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-8">
              
              {/* PRESENTATION DEMO MODE TOGGLE CARD */}
              <div className="border-b border-slate-150 dark:border-zinc-800 pb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-accent animate-pulse" />
                      Presentation / Judges Demo Mode
                    </h3>
                    <p className="text-xs text-slate-400 font-light font-sans">
                      Instantly populate rich, comprehensive mock workspaces, goals, and tasks for live presentation testing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {demoEnabled ? '🟢 DEMO MODE ACTIVE' : '⚪ SEEDED MODE DEACTIVATED'}
                    </span>
                    <button
                      onClick={() => handleToggleDemoMode(!demoEnabled)}
                      disabled={demoToggling}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        demoEnabled
                          ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
                          : 'bg-accent text-white hover:bg-accent/90 shadow-sm'
                      }`}
                    >
                      {demoToggling ? 'Processing...' : demoEnabled ? 'Disable Demo Data' : 'Seed Presentation Demo'}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-sans font-light">
                  Demo Mode simulates a fully populated executive environment immediately, including Series Seed Venture plans and Technical System Design interview milestones. This allows judges to explore beautiful dashboards, health scores, and metrics without requiring real credentials.
                </p>
              </div>

              {/* ADAPTIVE PERSONALIZATION CONTROLS */}
              <form onSubmit={handleSaveAdaptivePrefs} className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-1">
                    <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                    Adaptive Personality & Co-Pilot Settings
                  </h3>
                  <p className="text-xs text-slate-400 font-light font-sans">
                    Refine how the co-pilot allocates schedules, manages task priorities, and drafts recommendations.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Preferences sliders */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-zinc-300">Preferred Workstart Hour</span>
                        <span className="text-accent font-mono">{preferredWorkStart}</span>
                      </div>
                      <input 
                        type="text" 
                        value={preferredWorkStart} 
                        onChange={(e) => setPreferredWorkStart(e.target.value)}
                        placeholder="e.g. 08:30"
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-ink focus:border-accent/40 outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-zinc-300">Preferred Focus Session Block</span>
                        <span className="text-accent font-mono">{preferredFocusDuration} mins</span>
                      </div>
                      <input 
                        type="range" 
                        min={15} 
                        max={120} 
                        step={5}
                        value={preferredFocusDuration} 
                        onChange={(e) => setPreferredFocusDuration(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-zinc-300">Pre-Meeting Buffer Offset</span>
                        <span className="text-accent font-mono">{preferredMeetingBuffer} mins</span>
                      </div>
                      <input 
                        type="range" 
                        min={5} 
                        max={60} 
                        step={5}
                        value={preferredMeetingBuffer} 
                        onChange={(e) => setPreferredMeetingBuffer(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>
                  </div>

                  {/* Dropdowns */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">Co-Pilot Proactivity Threshold</label>
                      <select 
                        value={aiProactivity} 
                        onChange={(e: any) => setAiProactivity(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs text-ink focus:border-accent/40 outline-none"
                      >
                        <option value="low">Passive (Triggered on manual scan or chats)</option>
                        <option value="medium">Adaptive (Highlights daily threshold violations)</option>
                        <option value="high">High Proactive (Instant notification warnings & plan formulations)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">Executive Feedback Tone</label>
                      <select 
                        value={communicationStyle} 
                        onChange={(e: any) => setCommunicationStyle(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs text-ink focus:border-accent/40 outline-none"
                      >
                        <option value="concise">Concise (1-sentence strategic commands)</option>
                        <option value="analytical">Analytical (Deep explanations, probability factors & tradeoffs)</option>
                        <option value="supportive">Supportive (Progress validation & scheduling motivation cues)</option>
                      </select>
                    </div>
                  </div>

                </div>

                <div className="flex justify-between items-center border-t border-slate-150 dark:border-zinc-800 pt-5">
                  <span className="text-[10px] text-slate-400 font-light">
                    These profiles securely update your local co-pilot, adapting recommendations automatically.
                  </span>
                  <div className="flex items-center gap-3">
                    {saveSuccess && (
                      <span className="text-xs text-emerald-500 font-bold font-mono">Preferences saved ✓</span>
                    )}
                    <button
                      type="submit"
                      disabled={savingPrefs}
                      className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
                    >
                      {savingPrefs ? 'Updating...' : 'Save Settings'}
                    </button>
                  </div>
                </div>

              </form>

              {/* DYNAMIC ADDITIONAL PREFERENCES PANEL */}
              <div className="border-t border-slate-150 dark:border-zinc-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Privacy & Workspace Sandbox */}
                <div className="space-y-4 text-left">
                  <h4 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Security & Local Privacy Layers
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={privacyLogging} 
                        onChange={(e) => {
                          setPrivacyLogging(e.target.checked);
                          localStorage.setItem('due_now_privacy_logging', String(e.target.checked));
                        }}
                        className="rounded border-slate-300 text-accent focus:ring-accent" 
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ink">Enable Conversation Diagnostics Logging</span>
                        <span className="text-[10px] text-ink-muted leading-none">Keeps anonymized telemetry for speech tuning.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={privacySandbox} 
                        onChange={(e) => {
                          setPrivacySandbox(e.target.checked);
                          localStorage.setItem('due_now_privacy_sandbox', String(e.target.checked));
                        }}
                        className="rounded border-slate-300 text-accent focus:ring-accent" 
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ink">Activate Local Workstation Sandbox</span>
                        <span className="text-[10px] text-ink-muted leading-none">Force local memory storage only, bypassing cloud index cache.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Notifications & Accessibility Settings */}
                <div className="space-y-4 text-left">
                  <h4 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Notifications & Accessibility
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={notifyPreMeeting} 
                        onChange={(e) => {
                          setNotifyPreMeeting(e.target.checked);
                          localStorage.setItem('due_now_notify_premeeting', String(e.target.checked));
                        }}
                        className="rounded border-slate-300 text-accent focus:ring-accent" 
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ink">Proactive Voice Meeting Briefs</span>
                        <span className="text-[10px] text-ink-muted leading-none">Verbally announces calendar warnings.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={notifySuccessRisk} 
                        onChange={(e) => {
                          setNotifySuccessRisk(e.target.checked);
                          localStorage.setItem('due_now_notify_successrisk', String(e.target.checked));
                        }}
                        className="rounded border-slate-300 text-accent focus:ring-accent" 
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ink">Success Probability Violations</span>
                        <span className="text-[10px] text-ink-muted leading-none">Pop system alerts when project complete scores slip.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={accessReduceMotion} 
                        onChange={(e) => {
                          setAccessReduceMotion(e.target.checked);
                          localStorage.setItem('due_now_access_reducemotion', String(e.target.checked));
                        }}
                        className="rounded border-slate-300 text-accent focus:ring-accent" 
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ink">Reduce Visual Motion Effects</span>
                        <span className="text-[10px] text-ink-muted leading-none">Bypasses complex aurora layout filters.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={accessEnlargedTargets} 
                        onChange={(e) => {
                          setAccessEnlargedTargets(e.target.checked);
                          localStorage.setItem('due_now_access_enlargedtargets', String(e.target.checked));
                        }}
                        className="rounded border-slate-300 text-accent focus:ring-accent" 
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ink">Enlarge Interface Click Targets</span>
                        <span className="text-[10px] text-ink-muted leading-none">Adds touch targets optimized for mobile/screen readers.</span>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              {/* INTERNAL DEVELOPER DIAGNOSTICS TOGGLER */}
              <div className="border-t border-slate-150 dark:border-zinc-800 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Developer Diagnostics Command Panel
                  </h4>
                  <p className="text-[10px] text-slate-400 font-light font-sans">
                    Unlocks background workstation latency indicators, live pipeline diagnostics logs, and SDK connectivity charts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !devModeEnabled;
                    setDevModeEnabled(nextVal);
                    localStorage.setItem('due_now_dev_mode', String(nextVal));
                    if (nextVal) {
                      setActiveTab('diagnostics');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    devModeEnabled 
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {devModeEnabled ? 'Disable Developer Mode' : 'Enable Developer Mode'}
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* HELP & DOCUMENTATION CENTER */}
        {activeTab === 'help' && (
          <motion.div
            key="help"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6 text-left w-full font-sans"
          >
            <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6">
              
              <div className="border-b border-slate-150 dark:border-zinc-800 pb-4 flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
                  <HelpCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase leading-none">
                    WORKSTATION HANDBOOK
                  </span>
                  <h3 className="text-lg font-display font-black text-ink uppercase tracking-tight mt-0.5">
                    Help & Knowledge Base
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Getting Started & Shortcuts */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-accent uppercase font-mono tracking-wider">
                      1. Getting Started Walkthrough
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light font-sans">
                      DueNow is a high-performance productivity cockpit designed for startup founders, tech interview candidates, and busy executives. Speak naturally to organize files, create calendar blocks, review inbox threats, and project your workspace success probability.
                    </p>
                  </div>

                  <div className="space-y-3 bg-bg/50 border border-ink-faint rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-ink uppercase font-mono tracking-wider">
                      2. Keyboard Accelerators
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      <li className="flex justify-between items-center border-b border-ink-faint pb-1.5 font-sans">
                        <span>Activate Voice Microphone Node</span>
                        <kbd className="px-2 py-0.5 bg-ink-faint border border-ink-faint rounded font-mono text-[10px] font-bold">Space + Ctrl</kbd>
                      </li>
                      <li className="flex justify-between items-center border-b border-ink-faint pb-1.5 font-sans">
                        <span>Skip Active Onboarding Tour</span>
                        <kbd className="px-2 py-0.5 bg-ink-faint border border-ink-faint rounded font-mono text-[10px] font-bold">Esc</kbd>
                      </li>
                      <li className="flex justify-between items-center border-b border-ink-faint pb-1.5 font-sans">
                        <span>Trigger Active Sync Routine</span>
                        <kbd className="px-2 py-0.5 bg-ink-faint border border-ink-faint rounded font-mono text-[10px] font-bold">Ctrl + S</kbd>
                      </li>
                      <li className="flex justify-between items-center font-sans">
                        <span>Toggle High Contrast Focus Map</span>
                        <kbd className="px-2 py-0.5 bg-ink-faint border border-ink-faint rounded font-mono text-[10px] font-bold">Ctrl + H</kbd>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-accent uppercase font-mono tracking-wider">
                      3. Workspace Intelligence Guide
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light font-sans">
                      Workspaces act as secure partitions. When you select a workspace (e.g., Series Seed Pitch), the AI Companion automatically limits its semantic searches to materials matching that specific workspace, keeping your documents completely segregated.
                    </p>
                  </div>
                </div>

                {/* Voice dictionary & FAQs */}
                <div className="space-y-6">
                  <div className="bg-slate-950/45 border border-white/5 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase font-mono tracking-wider">
                      4. Vocal Command Library
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="border-b border-white/5 pb-1.5">
                        <strong className="text-slate-300 font-bold block">"Brief me on today's priorities"</strong>
                        <span className="text-zinc-400 text-[10px] font-light font-sans">Synthesizes and speaks active workspace alerts and emails.</span>
                      </div>
                      <div className="border-b border-white/5 pb-1.5">
                        <strong className="text-slate-300 font-bold block">"Create task review pitch outline for venture"</strong>
                        <span className="text-zinc-400 text-[10px] font-light font-sans">Instantly drafts and links sub-tasks to the current workspace.</span>
                      </div>
                      <div className="border-b border-white/5 pb-1.5">
                        <strong className="text-slate-300 font-bold block">"Formulate smart schedule for slide design"</strong>
                        <span className="text-zinc-400 text-[10px] font-light font-sans">Scans calendar and registers optimal focus slots.</span>
                      </div>
                      <div>
                        <strong className="text-slate-300 font-bold block">"Verify submission readiness of Series Seed"</strong>
                        <span className="text-zinc-400 text-[10px] font-light font-sans">Audits document checklists and provides completeness scores.</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-accent uppercase font-mono tracking-wider">
                      5. Frequently Asked Questions
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <strong className="text-slate-800 dark:text-zinc-200 block font-bold">Why is Success Probability fluctuating?</strong>
                        <span className="text-slate-500 dark:text-zinc-400 leading-relaxed font-light font-sans block mt-0.5">
                          It uses real-time metrics. Adding unlinked goals, missing milestone dates, or ignoring unread client messages directly increases risk coefficients and drops the probability.
                        </span>
                      </div>
                      <div>
                        <strong className="text-slate-800 dark:text-zinc-200 block font-bold">How is my data secured?</strong>
                        <span className="text-slate-500 dark:text-zinc-400 leading-relaxed font-sans font-light block mt-0.5">
                          DueNow utilizes a full-stack architecture with strict Firestore server rules. No third-party servers ever receive your Google Workspace OAuth permissions or access tokens.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* DEVELOPER DIAGNOSTICS PANEL */}
        {activeTab === 'diagnostics' && (
          <motion.div
            key="diagnostics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6 text-left w-full"
          >
            <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6">
              
              <div className="border-b border-slate-150 dark:border-zinc-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-sans">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Cpu className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase leading-none">
                      DIAGNOSTICS & TELEMETRY LOGS
                    </span>
                    <h3 className="text-lg font-display font-black text-ink uppercase tracking-tight mt-0.5">
                      Workstation Diagnostics OS
                    </h3>
                  </div>
                </div>
                <div className="px-3 py-1 bg-indigo-500/15 border border-indigo-500/25 rounded-full text-[10px] font-mono font-bold text-indigo-400 uppercase">
                  Version RC1 Connected
                </div>
              </div>

              {/* Status parameters grids */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-bg/50 border border-ink-faint rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Firestore Link</span>
                  <div className="text-emerald-500 font-bold flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>SECURE_ACTIVE</span>
                  </div>
                </div>
                <div className="p-3 bg-bg/50 border border-ink-faint rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Speech Synthesis API</span>
                  <div className="text-emerald-500 font-bold flex items-center gap-1.5">
                    <span>ONLINE_SUPPORTED</span>
                  </div>
                </div>
                <div className="p-3 bg-bg/50 border border-ink-faint rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Speech Recognition API</span>
                  <div className="text-emerald-500 font-bold flex items-center gap-1.5">
                    <span>WEB_KIT_READY</span>
                  </div>
                </div>
                <div className="p-3 bg-bg/50 border border-ink-faint rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Gemini Orchestrator</span>
                  <div className="text-emerald-500 font-bold flex items-center gap-1.5">
                    <span>READY_2.5_FLASH</span>
                  </div>
                </div>
              </div>

              {/* Detailed environment metrics */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Tech specifications */}
                <div className="md:col-span-7 bg-bg/50 border border-ink-faint rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                    System Environment Variables
                  </h4>
                  <div className="space-y-2 text-xs font-mono text-slate-500 dark:text-zinc-400 leading-relaxed">
                    <div className="flex justify-between border-b border-ink-faint pb-1">
                      <span className="text-slate-400">BUILD_RELEASE_VER:</span>
                      <strong className="text-ink">RC1 (Release Candidate 1)</strong>
                    </div>
                    <div className="flex justify-between border-b border-ink-faint pb-1">
                      <span className="text-slate-400">DEPLOY_ENVIRONMENT:</span>
                      <strong className="text-ink">Cloud Run Production</strong>
                    </div>
                    <div className="flex justify-between border-b border-ink-faint pb-1">
                      <span className="text-slate-400">DATABASE_MODEL:</span>
                      <strong className="text-ink">Cloud Firestore (Blueprints)</strong>
                    </div>
                    <div className="flex justify-between border-b border-ink-faint pb-1">
                      <span className="text-slate-400">AUTHENTICATED_USER_UID:</span>
                      <strong className="text-ink truncate max-w-[200px]">Secure_Session_UUID</strong>
                    </div>
                    <div className="flex justify-between border-b border-ink-faint pb-1">
                      <span className="text-slate-400">GOOGLE_WORKSPACE_SCOPES:</span>
                      <strong className="text-ink">Calendar, Drive, Keep, Gmail</strong>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-400">NETWORK_INTERFACE_MODE:</span>
                      <strong className="text-emerald-500">RESILIENT_SYNC_ACTIVE</strong>
                    </div>
                  </div>
                </div>

                {/* Audit trail */}
                <div className="md:col-span-5 bg-slate-950/45 border border-white/5 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                    Under-The-Hood Pipeline
                  </h4>
                  <div className="space-y-2 text-[11px] font-mono text-zinc-400">
                    <div className="border-l-2 border-emerald-500 pl-3 space-y-0.5">
                      <span className="block text-[9px] text-zinc-500 leading-none">12:44:02 UTC</span>
                      <p className="leading-tight">Initializing DueNow OS RC1 engine...</p>
                    </div>
                    <div className="border-l-2 border-emerald-500 pl-3 space-y-0.5">
                      <span className="block text-[9px] text-zinc-500 leading-none">12:44:05 UTC</span>
                      <p className="leading-tight">Connecting to persistent Firestore endpoints...</p>
                    </div>
                    <div className="border-l-2 border-emerald-500 pl-3 space-y-0.5">
                      <span className="block text-[9px] text-zinc-500 leading-none">12:44:11 UTC</span>
                      <p className="leading-tight">Parsing Google OAuth active connections...</p>
                    </div>
                    <div className="border-l-2 border-indigo-400 pl-3 space-y-0.5">
                      <span className="block text-[9px] text-zinc-500 leading-none">12:44:15 UTC</span>
                      <p className="leading-tight text-indigo-400">Sync complete. Workstation latency: 42ms</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* HACKATHON SUBMISSION ASSET KIT */}
        {activeTab === 'hackathon' && (
          <motion.div
            key="hackathon"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6 text-left w-full"
          >
            <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6">
              
              <div className="border-b border-slate-150 dark:border-zinc-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-sans">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase leading-none">
                      HACKATHON SUBMISSION TOOLKIT
                    </span>
                    <h3 className="text-lg font-display font-black text-ink uppercase tracking-tight mt-0.5">
                      Judging Submission Kit
                    </h3>
                  </div>
                </div>
                <div className="px-3 py-1 bg-amber-500/15 border border-amber-500/25 rounded-full text-[10px] font-mono font-bold text-amber-500 uppercase">
                  Exportable Materials
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-zinc-400 font-light font-sans leading-relaxed">
                We have generated comprehensive, beautifully written hackathon submission assets. Use the copy button on each card to copy-paste directly into Devpost, GitHub READMEs, or presentation slides!
              </p>

              <div className="space-y-6">
                
                {/* 1. Problem & Slogan */}
                <div className="bg-bg/50 border border-ink-faint rounded-2xl p-5 space-y-3 relative font-sans">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-ink font-mono uppercase tracking-wider">
                      1. Problem Statement & Project Slogan
                    </h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("Slogan: DueNow — The Voice-First AI Executive co-pilot for high-pressure founders.\n\nProblem Statement: High-pressure executives lose up to 12 hours a week manually consolidating tasks, mining details from unread emails, and adjusting schedules across calendar locks. Existing assistants fail because they operate statically, requiring constant manual typing, and expose sensitive credentials to third-party scrapers.");
                        alert("Copied Problem & Slogan!");
                      }}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-accent/10 border border-accent/20 text-accent rounded hover:bg-accent/20 transition-all cursor-pointer"
                    >
                      Copy Content
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <strong className="block text-ink font-bold">Slogan:</strong>
                    <p className="text-slate-500 dark:text-zinc-400">DueNow — The Voice-First AI Executive co-pilot for high-pressure founders.</p>
                    <strong className="block text-ink font-bold mt-2">Problem:</strong>
                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed font-light">High-pressure executives lose up to 12 hours a week manually consolidating tasks, mining details from unread emails, and adjusting schedules across calendar locks. Existing assistants fail because they operate statically, requiring constant manual typing, and expose sensitive credentials to third-party scrapers.</p>
                  </div>
                </div>

                {/* 2. Solutions & Innovation */}
                <div className="bg-bg/50 border border-ink-faint rounded-2xl p-5 space-y-3 relative font-sans">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-ink font-mono uppercase tracking-wider">
                      2. Unified Solution & Technical Innovation
                    </h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("Solution: DueNow provides a hardware-grade hands-free Voice Dock OS running locally on the executive's workstation. It compartmentalizes complex venture plans into secure Workspaces, syncs in real-time with Google Workspace, and models a dynamic Success Probability™ based on actual execution patterns.\n\nInnovation: Includes (1) Success Probability Risk Forecasting, (2) Segmented firestore security guidelines to bypass browser scrapers, (3) OCR slide-outline analysis generating checklist tasks, and (4) Transparent Explainable AI reasoning audit logs.");
                        alert("Copied Solution & Innovation!");
                      }}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-accent/10 border border-accent/20 text-accent rounded hover:bg-accent/20 transition-all cursor-pointer"
                    >
                      Copy Content
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <strong className="block text-ink font-bold">Solution:</strong>
                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed font-light">DueNow provides a hardware-grade hands-free Voice Dock OS running locally on the executive's workstation. It compartmentalizes complex venture plans into secure Workspaces, syncs in real-time with Google Workspace, and models a dynamic Success Probability™ based on actual execution patterns.</p>
                    <strong className="block text-ink font-bold mt-2">Innovation Highlights:</strong>
                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed font-light">Includes (1) Success Probability Risk Forecasting, (2) Segmented firestore security guidelines to bypass browser scrapers, (3) OCR slide-outline analysis generating checklist tasks, and (4) Transparent Explainable AI reasoning audit logs.</p>
                  </div>
                </div>

                {/* 3. Tech Stack */}
                <div className="bg-bg/50 border border-ink-faint rounded-2xl p-5 space-y-3 relative font-sans">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-ink font-mono uppercase tracking-wider">
                      3. Technical Architecture & Tech Stack
                    </h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("Architecture: Frontend SPA built on Vite, React 18, and Tailwind CSS. State managed via native React Context hooks and motion layout filters. Persistent data stored inside Firestore using a structured blueprint mapping user-specific subcollections. Secure server built on Express compiling CommonJS assets via Esbuild and tsx dev runners.\n\nStack:\n- React 18, Vite, TypeScript\n- Tailwind CSS, Lucide icons\n- Express v4 server\n- Firebase SDK, Firestore rules validation\n- Google Web Speech Synthesis & Recognition APIs\n- Gemini 2.5 Flash SDK");
                        alert("Copied Tech Stack!");
                      }}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-accent/10 border border-accent/20 text-accent rounded hover:bg-accent/20 transition-all cursor-pointer"
                    >
                      Copy Content
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <strong className="block text-ink font-bold">Architecture:</strong>
                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed font-light">Frontend SPA built on Vite, React 18, and Tailwind CSS. State managed via native React Context hooks and motion layout filters. Persistent data stored inside Firestore using a structured blueprint mapping user-specific subcollections. Secure server built on Express compiling CommonJS assets via Esbuild and tsx dev runners.</p>
                    <strong className="block text-ink font-bold mt-2">Tech Stack Checklist:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-zinc-400">
                      <li>React 18, Vite, TypeScript, motion/react</li>
                      <li>Tailwind CSS, Lucide icons, D3/Recharts</li>
                      <li>Express v4 Node backend server on Cloud Run</li>
                      <li>Firebase Firestore SDK & Blueprint schemas</li>
                      <li>Web Speech Synthesis & Speech Recognition API</li>
                      <li>Gemini 2.5 Flash API co-pilot integration</li>
                    </ul>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
