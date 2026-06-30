import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Power, 
  Cpu, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  Clock, 
  Volume2, 
  Palette, 
  Compass, 
  Activity 
} from 'lucide-react';

export const PlaceholderDashboard: React.FC = () => {
  const { userProfile, preferences, logout, currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Aurora Ambient Background Flow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[130px] animate-aurora" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[130px] animate-aurora" style={{ animationDelay: '-6s' }} />
        <div className="absolute top-[30%] left-[25%] w-[350px] h-[350px] rounded-full bg-violet-600/5 blur-[110px] animate-float" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.45)] border border-indigo-400/20"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="font-display font-bold tracking-tight text-xl leading-none">DueNow</h1>
              <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-indigo-400 block mt-1">Workstation Companion Node</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200">{userProfile?.name || 'Partner Executive'}</span>
              <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-bold">Enterprise Rank</span>
            </div>
            <motion.button 
              onClick={logout}
              className="px-5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-full transition-all flex items-center gap-2 text-xs font-bold tracking-wide cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Lock Workstation"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Lock Workstation</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8 items-center justify-center my-auto">
        
        {/* Left Side: Dynamic Interactive Orb & Pulse Visualization */}
        <div className="w-full lg:w-2/5 flex flex-col items-center text-center space-y-6">
          <div className="relative cursor-pointer">
            {/* Massive Volumetric glowing ambient rings */}
            <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/15 blur-2xl pointer-events-none" />
            <motion.div 
              className="absolute -inset-3 rounded-full bg-gradient-to-tr from-indigo-500/30 via-violet-500/20 to-emerald-500/20 blur-md pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />

            {/* Orbit rings */}
            <div className="absolute inset-0 rounded-full border border-white/10 animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute -inset-6 rounded-full border border-indigo-500/10 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />

            {/* Main Interactive AI Orb */}
            <motion.div 
              className="w-36 h-36 rounded-full bg-radial from-indigo-500 via-indigo-600 to-violet-800 shadow-[0_0_60px_rgba(79,70,229,0.5),_inset_0_4px_16px_rgba(255,255,255,0.3)] flex items-center justify-center relative z-10 border border-white/20 animate-orb-breathing"
              whileHover={{ 
                scale: 1.08,
                boxShadow: "0 0 75px rgba(99, 102, 241, 0.75), inset 0 4px 18px rgba(255, 255, 255, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Activity className="w-10 h-10 text-white/95 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
            </motion.div>
          </div>

          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg tracking-tight text-white">{userProfile?.personality ? `${userProfile.personality.toUpperCase()} COMPANION` : 'ACTIVE COMPANION'}</h3>
            <p className="text-slate-400 text-xs font-light max-w-xs font-sans">Click the AI companion node to test vocal speech rates and trigger workstation dialogue synthesis tests.</p>
          </div>

          {/* Glowing wave line visual feedback */}
          <div className="flex items-center gap-1.5 h-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div 
                key={i} 
                className="w-1 bg-indigo-500/60 rounded-full animate-pulse-line" 
                style={{ 
                  height: `${[14, 20, 16, 24, 18, 22, 12, 18][i - 1]}px`,
                  animationDelay: `${i * 0.1}s` 
                }} 
              />
            ))}
          </div>
        </div>

        {/* Right Side: Main Dashboard Information Node Card */}
        <div className="w-full lg:w-3/5 space-y-6">
          <motion.div 
            className="glass-panel p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl relative"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            {/* Module Complete Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono font-bold tracking-wider text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                MODULE 02 SECURE HANDSHAKE COMPLETE
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold">NODE ID: {currentUser?.uid?.substring(0, 8).toUpperCase()}</span>
            </div>

            <div className="space-y-3">
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight leading-tight text-white">
                Welcome, <span className="text-indigo-400 font-bold">{userProfile?.name || 'Partner'}</span>.
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-light leading-relaxed">
                Your voice-first onboarding, custom profile details, and preferences are fully active and persistently synchronized in our Firestore databases.
              </p>
            </div>

            {/* Profile Metrics Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-white/5 py-6">
              
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/20 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Workstation Metadata
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex justify-between">
                    <span className="text-slate-500">Corporate Email:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[150px]">{currentUser?.email}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Sprints Window:</span>
                    <span className="font-semibold text-slate-200">{userProfile?.workingHours?.start} - {userProfile?.workingHours?.end}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Active Node Zone:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[150px]">{userProfile?.workingHours?.timezone}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-slate-950/20 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Companion Preferences
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex justify-between">
                    <span className="text-slate-500">Vocal Companion:</span>
                    <span className="font-bold text-indigo-400 capitalize">{userProfile?.personality || 'mentor'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Acoustic Preset:</span>
                    <span className="font-semibold text-slate-200">{preferences?.voicePreference || 'Zephyr'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Display Theme:</span>
                    <span className="font-semibold text-slate-200 capitalize">{preferences?.theme || 'dark'}</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Pending integration description panel */}
            <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-3.5 shadow-inner">
              <div className="p-2.5 bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 rounded-xl shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-200">Module 03 Integration Sandbox Pending</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                  Module 03 will deploy the complete conversational AI chat dashboard, real-time repository folder scanner engines, bi-directional calendar access layers, and predictive timeline analysis modules.
                </p>
              </div>
            </div>

          </motion.div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            🔒 DUE-NOW WORKSTATION DEPLOYMENT HANDSHAKE VERIFIED
          </span>
          <span className="uppercase">VERIFIED BY FIREBASE AUTH &bull; LOCAL STORAGE SECURED &bull; VER. 2.4.0</span>
        </div>
      </footer>
    </div>
  );
};
