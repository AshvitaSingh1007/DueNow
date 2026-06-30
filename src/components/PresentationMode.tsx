import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Sparkles, 
  Mic, 
  Compass, 
  Calendar, 
  Mail, 
  FolderGit2, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  Cpu, 
  Info,
  Terminal,
  Volume2
} from 'lucide-react';

interface PresentationModeProps {
  activeSection: string;
  setActiveSection: (section: any) => void;
  speakText?: (text: string) => void;
}

interface PresentationStep {
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  navSection: 'dashboard' | 'tasks' | 'calendar' | 'workspaces' | 'ai_chat' | 'settings' | 'briefing' | 'goals' | 'insights';
  speakerScript: string;
  techStack: string;
  actionLabel: string;
  onAction: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  activeSection,
  setActiveSection,
  speakText
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlayingScriptVoice, setIsPlayingScriptVoice] = useState(false);

  const steps: PresentationStep[] = [
    {
      title: 'Voice-First Auth & Onboarding Handshake',
      subtitle: 'Step 1: Logging in using voice biometrics',
      icon: Mic,
      navSection: 'dashboard',
      speakerScript: 'DueNow begins with a vocal authorization. Rather than a tedious form, the executive logs in by speaking. The platform analyzes voice frequencies, securely syncs with Firebase Auth, and constructs a customized profile context on the fly.',
      techStack: 'Web Speech API (Synthesis/Recognition) & Firebase Authentication handshake with localized storage caching.',
      actionLabel: 'Trigger Vocal Greeting Simulation',
      onAction: () => {
        if (speakText) {
          speakText('Vocal biometrics authenticated successfully. Welcome back, Chief Executive. System synchronization active.');
        }
      }
    },
    {
      title: 'Morning Executive Briefing',
      subtitle: 'Step 2: AI-driven daily task formulation',
      icon: Compass,
      navSection: 'briefing',
      speakerScript: 'Every morning, the AI synthesizes unread Gmail threads, priority documents, and calendar conflicts into an active briefing. No more digging through a messy inbox — your co-pilot tells you exactly what requires immediate attention.',
      techStack: 'Gemini 2.5 Flash context injection compiling Gmail message threads, meeting coordinates, and local workspace deliverables.',
      actionLabel: 'Go To Morning Briefing Screen',
      onAction: () => {
        setActiveSection('briefing');
      }
    },
    {
      title: 'Intelligent Smart Scheduling Engine',
      subtitle: 'Step 3: Calendar automation & focus allocations',
      icon: Calendar,
      navSection: 'calendar',
      speakerScript: 'When a new deliverable is added, DueNow analyzes your Google Calendar, detects blocks, schedules dedicated focus sessions, and locks in pre-meeting and post-meeting buffer offsets automatically.',
      techStack: 'Bi-directional Google Calendar API sync with dynamic scheduling heuristics and adaptive timing constraints.',
      actionLabel: 'Inspect Calendar Scheduler',
      onAction: () => {
        setActiveSection('calendar');
      }
    },
    {
      title: 'Gmail Intelligence Hub',
      subtitle: 'Step 4: Real-time context mining',
      icon: Mail,
      navSection: 'dashboard',
      speakerScript: 'DueNow acts as an active workspace listener. It continuously monitors linked email communication, detects critical project updates, extracts hidden deadlines, and surfaces risk factor alerts to the dashboard.',
      techStack: 'Google OAuth API + Gemini NLP mining pipelines with transactional local index token caching.',
      actionLabel: 'Inspect Gmail Threat Indicators',
      onAction: () => {
        setActiveSection('dashboard');
        setTimeout(() => {
          const el = document.getElementById('workspace-alerts');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    },
    {
      title: 'Workspace Intelligence™ Compartments',
      subtitle: 'Step 5: High-density compartmentalization',
      icon: FolderGit2,
      navSection: 'workspaces',
      speakerScript: 'Our Workspace Intelligence partitions complex venture plans into secure hubs. Each workspace contains dedicated files, email streams, sub-tasks, and calculated Workspace Health ratings.',
      techStack: 'Durable Firestore multi-collection architecture mapping user-specific workspace partitions with real-time reactive sync.',
      actionLabel: 'Examine Workspaces Console',
      onAction: () => {
        setActiveSection('workspaces');
      }
    },
    {
      title: 'AI Technical Document Analysis',
      subtitle: 'Step 6: Parsing raw executive materials',
      icon: FileText,
      navSection: 'workspaces',
      speakerScript: 'Presenters can upload a PDF, slide outline, or text doc directly. The companion analyzes it, extracts action deliverables, and auto-generates structured checklists to guarantee you do not miss a detail.',
      techStack: 'Gemini Document OCR + structural meta-parsing generating interactive schema checklists saved straight to Firestore.',
      actionLabel: 'Analyze Document Demo Workstation',
      onAction: () => {
        setActiveSection('workspaces');
      }
    },
    {
      title: 'Submission Readiness™ Analytics',
      subtitle: 'Step 7: Project completeness audits',
      icon: ShieldCheck,
      navSection: 'workspaces',
      speakerScript: 'Rather than simple checklist markers, Submission Readiness evaluates critical deliverables, documents completeness, and highlights remaining deliverables needed to ensure successful venture completion.',
      techStack: 'Analytical completeness heuristic models calculated instantly from Firestore document attachments and sub-task schemas.',
      actionLabel: 'Inspect Completeness Checklists',
      onAction: () => {
        setActiveSection('workspaces');
      }
    },
    {
      title: 'Automated Goal & Policy Management',
      subtitle: 'Step 8: Formulating high-level strategic aims',
      icon: TrendingUp,
      navSection: 'goals',
      speakerScript: 'Define long-term strategic aims like a VC Pitch or a Tech Interview. The system binds related tasks, monitors risks, and executes reactive triggers like safety alerts if the completion likelihood drops.',
      techStack: 'Milestone percentage trackers with reactive Firestore database listener triggers and automated alert emission pipelines.',
      actionLabel: 'View Active Goals & Automations',
      onAction: () => {
        setActiveSection('goals');
      }
    },
    {
      title: 'Executive Performance Insights',
      subtitle: 'Step 9: Interactive metric tracking',
      icon: Activity,
      navSection: 'insights',
      speakerScript: 'Our Premium Insights Dashboard graphs weekly productivity gains, planning quality indices, and Success Probability tracks to provide executive analytics with bulletproof visual fidelity.',
      techStack: 'D3.js and Recharts mapping historic execution velocities with responsive, high-framerate hardware accelerated layout canvases.',
      actionLabel: 'Examine Executive Insights',
      onAction: () => {
        setActiveSection('insights');
      }
    },
    {
      title: 'Explainable AI Reasoning Trace',
      subtitle: 'Step 10: Under-the-hood transparent auditing',
      icon: Cpu,
      navSection: 'goals',
      speakerScript: 'DueNow respects your executive intelligence. Every smart schedule, task priority, or notification alert is cataloged in our reasoning trace logs, showing the data reviewed, confidence coefficients, and alternative options considered.',
      techStack: 'Explainable AI Decision Pipeline (XC-DP) logging raw reasoning models directly to audit trails for security auditing.',
      actionLabel: 'Inspect Reasoning Logs',
      onAction: () => {
        setActiveSection('goals');
      }
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setActiveSection(steps[nextStep].navSection);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setActiveSection(steps[prevStep].navSection);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setActiveSection(steps[0].navSection);
  };

  const handleSpeakScript = () => {
    if (!speakText) return;
    setIsPlayingScriptVoice(true);
    speakText(steps[currentStep].speakerScript);
    setTimeout(() => setIsPlayingScriptVoice(false), 8000);
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Presentation Controller Title Bar */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-ink-faint shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-accent/5 rounded-full blur-[50px] pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <Play className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase leading-none">
              PRESENTATION & DEMO SCRIPT MODE
            </span>
            <h2 className="text-xl font-display font-black text-ink tracking-tight uppercase mt-1">
              Live Judging Sequence
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-ink-faint hover:bg-ink-faint-more border border-ink-faint rounded-xl text-xs font-bold text-ink transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Demo</span>
          </button>
          <span className="text-xs font-mono text-ink-muted bg-bg/50 px-3 py-2 rounded-xl border border-ink-faint font-bold">
            SCENE {currentStep + 1} OF {steps.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Sequence Checklist */}
        <div className="lg:col-span-4 bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-5 shadow-sm space-y-2 text-left h-fit">
          <h3 className="text-xs font-mono font-bold text-ink-muted uppercase tracking-wider mb-3 px-2">
            Demo Script Navigation
          </h3>
          <div className="space-y-1.5">
            {steps.map((step, idx) => {
              const IsActive = idx === currentStep;
              const StepIconRef = step.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentStep(idx);
                    setActiveSection(step.navSection);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                    IsActive 
                      ? 'bg-accent text-white shadow-md shadow-accent/15' 
                      : 'text-ink-muted hover:text-ink hover:bg-ink-faint'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${IsActive ? 'bg-white/20 text-white' : 'bg-ink-faint text-ink-muted'}`}>
                    <StepIconRef className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate flex-1">
                    <span className="block text-[9px] opacity-75 font-mono leading-none mb-0.5">SCENE 0{idx + 1}</span>
                    <span className="truncate block font-semibold">{step.title}</span>
                  </div>
                  {IsActive && (
                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Step Controller Module */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-6 rounded-3xl border border-ink-faint space-y-6 text-left shadow-lg"
          >
            {/* Step Meta info */}
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/5 border border-accent/20 rounded-full text-[10px] font-mono font-bold tracking-wider text-accent">
                  ACTIVE PRESENTATION MODULE
                </span>
                <h3 className="text-lg font-display font-black text-ink tracking-tight uppercase">
                  {currentStepData.title}
                </h3>
                <p className="text-xs text-ink-muted font-mono leading-none">
                  {currentStepData.subtitle}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
                <StepIcon className="w-6 h-6" />
              </div>
            </div>

            {/* Speaking Script Section */}
            <div className="bg-bg/60 border border-ink-faint rounded-2xl p-5 relative">
              <div className="absolute top-4 right-4 flex gap-1">
                {speakText && (
                  <button
                    onClick={handleSpeakScript}
                    disabled={isPlayingScriptVoice}
                    className="p-1.5 rounded-lg bg-accent/15 hover:bg-accent/25 border border-accent/20 text-accent cursor-pointer transition-colors"
                    title="Speak Presenter Script via AI synthesis"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
                <div className="bg-ink-faint border border-ink-faint text-[9px] font-mono font-semibold uppercase tracking-wider text-ink-muted px-2 py-1 rounded">
                  PRESENTER SPEAKING POINTS
                </div>
              </div>
              <p className="text-ink text-xs leading-relaxed font-sans pr-10 font-light mt-3">
                "{currentStepData.speakerScript}"
              </p>
            </div>

            {/* Architecture / Under the hood section */}
            <div className="bg-slate-950/45 border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Under the Hood &bull; System Telemetry</span>
              </div>
              <p className="text-zinc-400 text-xs font-mono font-light leading-relaxed">
                {currentStepData.techStack}
              </p>
            </div>

            {/* Shortcut Interaction Trigger */}
            <div className="border-t border-ink-faint pt-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent animate-pulse" />
                <span className="text-[11px] text-ink-muted font-sans font-light">
                  This action automates view traversal and parameters setup instantly.
                </span>
              </div>

              <button
                onClick={currentStepData.onAction}
                className="w-full sm:w-auto px-5 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md shadow-accent/15 uppercase font-display"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>{currentStepData.actionLabel}</span>
              </button>
            </div>
          </motion.div>

          {/* Stepper Navigation controls */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-5 py-3 border border-ink-faint rounded-xl text-xs font-bold text-ink hover:bg-ink-faint disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Scene</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              className="px-5 py-3 bg-accent hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-accent/15 cursor-pointer"
            >
              <span>Next Scene</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
