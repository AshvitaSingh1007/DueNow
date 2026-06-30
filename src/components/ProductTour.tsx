import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  LayoutDashboard, 
  Compass, 
  TrendingUp, 
  ShieldCheck, 
  Settings, 
  MessageSquare, 
  FolderGit2, 
  Mic 
} from 'lucide-react';

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  setActiveSection: (section: any) => void;
}

interface TourStep {
  title: string;
  description: string;
  section?: 'dashboard' | 'tasks' | 'calendar' | 'workspaces' | 'ai_chat' | 'settings' | 'briefing' | 'goals' | 'insights';
  icon: React.ComponentType<any>;
  elementHighlight?: string; // CSS selector to guide focus conceptually
}

export const ProductTour: React.FC<ProductTourProps> = ({
  isOpen,
  onClose,
  activeSection,
  setActiveSection
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      title: 'DueNow Executive Cockpit',
      description: 'Welcome to your primary command console. This dashboard provides immediate high-level awareness of active workspaces, priority tasks, calendar bottlenecks, and real-time Google Workspace sync.',
      section: 'dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Voice-First Dock OS',
      description: 'Located permanently at the bottom, the Voice Dock is a hardware-grade hands-free conversation channel. Click the mic node to speak naturally, formulate schedules, trigger briefing notes, and retrieve contextual details.',
      section: 'dashboard',
      icon: Mic
    },
    {
      title: 'Success Probability™ Indicator',
      description: 'An advanced AI risk model that continuously aggregates active deadlines, workspace health metrics, and previous velocity trends to mathematically project submission likelihood in real-time.',
      section: 'dashboard',
      icon: TrendingUp
    },
    {
      title: 'Workspace Intelligence™',
      description: 'Each executive project is isolated into a secure Workspace context. The system automatically indexes your local files, Google Drive documents, and related Gmail threads to maintain bulletproof compartmentalization.',
      section: 'workspaces',
      icon: FolderGit2
    },
    {
      title: 'Morning Executive Briefing',
      description: 'Generates cohesive high-level digests summarizing unread Gmail priorities, meeting timelines, and focus schedules so you start every morning fully preflight-prepared.',
      section: 'briefing',
      icon: Compass
    },
    {
      title: 'Interactive AI Companion',
      description: 'A contextual agent equipped with deep retrieval memory. Query across Drive files, request schedule alignments, generate slides outlines, and analyze documents seamlessly in a structured conversational log.',
      section: 'ai_chat',
      icon: MessageSquare
    },
    {
      title: 'Smart Goals & Automated Policies',
      description: 'Formulate macro objectives and break them down into actionable milestones. The system monitors progress, evaluates safety risks, and triggers automated alerts if deadlines begin slipping.',
      section: 'goals',
      icon: ShieldCheck
    },
    {
      title: 'Connected Workspace Integration',
      description: 'DueNow provides instant, native connections to Google Calendar, Drive, Docs, Keep, and Gmail. Access your live corporate ecosystem without exposing private OAuth keys.',
      section: 'settings',
      icon: Settings
    },
    {
      title: 'Adaptive Co-Pilot Personalization',
      description: 'Configure custom voice synthesis parameters, proactivity thresholds, and strategic feedback tones. Enable Developer Diagnostics to verify pipeline telemetry at any moment.',
      section: 'settings',
      icon: Settings
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      const targetSection = steps[nextStep].section;
      if (targetSection && activeSection !== targetSection) {
        setActiveSection(targetSection);
      }
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      const targetSection = steps[prevStep].section;
      if (targetSection && activeSection !== targetSection) {
        setActiveSection(targetSection);
      }
    }
  };

  const handleComplete = () => {
    localStorage.setItem('duenow_tour_completed', 'true');
    onClose();
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-end md:items-center justify-center p-4 md:p-6">
      {/* Dimmed backdrop filter - pointer-events active only around the tour module */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] pointer-events-auto" 
        onClick={handleComplete}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, type: 'spring', damping: 25 }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800/80 rounded-3xl shadow-2xl p-6 pointer-events-auto overflow-hidden text-left"
      >
        {/* Colorful top-bar aura */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent via-indigo-500 to-emerald-500" />
        
        {/* Close Button */}
        <button 
          onClick={handleComplete}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Skip product tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-accent/15 border border-accent/25 text-accent">
            <StepIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase leading-none">
              DUENOW WORKSTATION TOUR &bull; STEP {currentStep + 1} OF {steps.length}
            </span>
            <h3 className="text-base font-display font-black tracking-tight text-white mt-1">
              {currentStepData.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-300 text-xs font-light leading-relaxed mb-6 font-sans">
          {currentStepData.description}
        </p>

        {/* Dynamic visual indicator to point to the screen elements */}
        {currentStepData.section && (
          <div className="mb-5 py-2 px-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>Interactive: Navigating workspace view to <strong className="text-slate-200 capitalize">{currentStepData.section}</strong></span>
          </div>
        )}

        {/* Control Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
          <button 
            onClick={handleComplete}
            className="text-xs text-slate-400 hover:text-white transition-colors font-semibold cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-3 py-2 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-accent hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-accent/15 cursor-pointer"
            >
              <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
