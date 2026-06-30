import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { VoiceProvider } from './context/VoiceContext';
import { SystemResilienceProvider } from './context/SystemResilienceContext';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { Compass } from 'lucide-react';

function DashboardContent() {
  const { userId, userProfile, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="space-y-4 text-center relative z-10">
          <div className="flex justify-center">
            <Compass className="w-10 h-10 text-indigo-400 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-semibold text-lg tracking-tight">Synchronizing Workstation</h3>
            <p className="text-slate-500 text-[11px] font-mono uppercase tracking-wider">Establishing secure handshake</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!userId) {
    return (
      <AnimatePresence mode="wait">
        {!showAuth ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <LandingPage onStart={() => setShowAuth(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <AuthPage onBack={() => setShowAuth(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // 3. Authenticated but un-onboarded State
  if (!userProfile) {
    return (
      <OnboardingFlow onComplete={() => {
        // Once completed, AuthContext automatically triggers profile reload,
        // which moves the state to PlaceholderDashboard
      }} />
    );
  }

  // 4. Onboarded State -> Fully Functional Executive Dashboard
  return <ExecutiveDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <SystemResilienceProvider>
        <ThemeProvider>
          <VoiceProvider>
            <DashboardContent />
          </VoiceProvider>
        </ThemeProvider>
      </SystemResilienceProvider>
    </AuthProvider>
  );
}
