import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Mic, 
  Calendar, 
  FolderSync, 
  Volume2, 
  Clock, 
  User, 
  Compass, 
  MessageSquare, 
  ShieldCheck
} from 'lucide-react';
import { VoicePersonality, WorkingHours } from '../types';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardStep = 
  | 'intro'         // Conversational AI introduction
  | 'profile_type'  // Student vs Professional
  | 'basic_details' // Name, College/Company, Department, Role
  | 'working_hours' // Daily schedule & Timezone
  | 'personality'   // Companion Personality Select
  | 'voice_style'   // Choose voice preview & speech pace
  | 'permissions'   // Step-by-step granular permissions
  | 'saving';       // Completion save and transition

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { userId, currentUser, updateProfile, updatePreferences } = useAuth();
  const [step, setStep] = useState<OnboardStep>('intro');
  const [loading, setLoading] = useState(false);

  // Collected states
  const [name, setName] = useState('');
  const [roleType, setRoleType] = useState<'professional' | 'student'>('professional');
  const [organization, setOrganization] = useState(''); // College or Company
  const [department, setDepartment] = useState('');     // Department or Major
  const [title, setTitle] = useState('');               // Role title
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    start: '09:00',
    end: '17:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  });
  const [assistantName, setAssistantName] = useState('DueNow');
  const [selectedPersonality, setPersonality] = useState<VoicePersonality>('mentor');
  const [voicePreference, setVoicePreference] = useState('Zephyr');
  const [reminderStyle, setReminderStyle] = useState<'professional' | 'motivational' | 'casual'>('professional');
  const [speakingSpeed, setSpeakingSpeed] = useState(1.0);
  const [themePreference, setThemePreference] = useState<'light' | 'dark'>('dark');

  // Permissions step tracking
  const [permissionSubStep, setPermissionSubStep] = useState<number>(0);
  const [micPerm, setMicPerm] = useState<boolean>(false);
  const [calPerm, setCalPerm] = useState<boolean>(false);
  const [workPerm, setWorkPerm] = useState<boolean>(false);
  const [savingProgress, setSavingProgress] = useState(0);

  // Initialize name from firebase email if possible
  useEffect(() => {
    if (currentUser?.displayName && !name) {
      setName(currentUser.displayName);
    } else if (currentUser?.email && !name) {
      setName(currentUser.email.split('@')[0]);
    }
  }, [currentUser]);

  // Voice Speech synthesis preview helpers
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const playVoicePreview = (text: string, rate: number = 1.0) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlayingPreview(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onend = () => setIsPlayingPreview(false);
    utterance.onerror = () => setIsPlayingPreview(false);
    window.speechSynthesis.speak(utterance);
  };

  // Grant permission triggers
  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // close standard check
      setMicPerm(true);
      setPermissionSubStep(1);
    } catch (e) {
      console.warn('Microphone permission blocked or dismissed.', e);
      setMicPerm(false);
      setPermissionSubStep(1); // continue flow gracefully
    }
  };

  // Submit onboarding details
  const handleFinalSubmit = async () => {
    setStep('saving');
    setLoading(true);

    try {
      // Step-by-step progress animation for premium experience
      for (let i = 20; i <= 100; i += 20) {
        await new Promise(r => setTimeout(r, 200));
        setSavingProgress(i);
      }

      const emailVal = currentUser?.email || 'partner@duenow.ai';

      // Save user profile details
      await updateProfile({
        email: emailVal,
        name: name || 'Partner',
        personality: selectedPersonality,
        workingHours: workingHours
      });

      // Save preference details
      await updatePreferences({
        voicePreference: voicePreference,
        theme: themePreference,
        reminderStyle: reminderStyle
      });

      onComplete();
    } catch (error) {
      console.error('Error submitting profile onboarding:', error);
      setStep('permissions');
    } finally {
      setLoading(false);
    }
  };

  // Previews based on selected personality
  const getPersonalityContext = (p: VoicePersonality) => {
    switch (p) {
      case 'mentor':
        return {
          desc: 'Wise, supportive, and milestones-focused. Helps with clarity and executive growth.',
          quote: `"Let's break this presentation down Alex. High anxiety often stems from complex visual tasks. Ready?"`,
          greeting: `"Good morning Alex. We have three milestones scheduled. Let's coordinate our agenda."`,
          reminder: `"Alex, the code guidelines are due in 2 hours. Your current preparation indicates 70% odds. Let's allocate 30 minutes to review."`,
          motivation: `"Focus on the architecture first. One milestone leads directly to the next. You're doing excellent."`
        };
      case 'best_friend':
        return {
          desc: 'Casual, warm, and hyper-encouraging. Keeps motivation high with conversational warmth.',
          quote: `"You've got this Alex! Let's knock this slide out first and grab coffee. No sweat!"`,
          greeting: `"Morning Alex! Ready to crush today's tasks? Let's get into it!"`,
          reminder: `"Hey! Quick heads up: presentation is due in 2 hours. Let's do a quick run-through real quick, you're gonna do great!"`,
          motivation: `"Seriously, look at what you accomplished yesterday! You are a machine. Keep that momentum going!"`
        };
      case 'coach':
        return {
          desc: 'Dynamic, accountability-driven, and high-energy. Focuses on performance, execution, and streaks.',
          quote: `"Time to build momentum, Alex! Your presentation is critical. Focus entirely for the next hour."`,
          greeting: `"Alex, workstation online. We have high-impact items today. Let's establish execution."`,
          reminder: `"Nudge: Presentation deadline is approaching. Success odds dropping. Start your focus session now. Refuse to procrastinate."`,
          motivation: `"Execution equals success. The hard work you put in right now guarantees the milestone. Let's get after it."`
        };
      case 'professional':
        return {
          desc: 'Direct, refined, and highly analytical. Operates like an executive chief of staff.',
          quote: `"Alex, calendar overlaps resolved. Commencing deep-scan on workspace folder. Please stand by."`,
          greeting: `"Good morning, Alex. Workspace status initialized. Presenting structured daily brief."`,
          reminder: `"Notice: Milestone 'guidelines' is scheduled for 18:00. Time allocation required to mitigate 15% probability hazard."`,
          motivation: `"Consistent execution builds professional leverage. Proceed with scheduled tasks."`
        };
    }
  };

  const currentPersona = getPersonalityContext(selectedPersonality);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-6 relative font-sans selection:bg-accent selection:text-white">
      {/* Background ambient animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent-glow/50 blur-[130px] animate-aurora" />
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-glow/30 blur-[130px] animate-aurora" style={{ animationDelay: '-7s' }} />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Dynamic Interactive AI Companion Orb Header */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* outer visual breathing glow */}
            <div className={`absolute -inset-6 rounded-full blur-xl opacity-30 transition-all duration-700 ${
              isPlayingPreview 
                ? 'bg-emerald-500 animate-orb-listening' 
                : step === 'saving' 
                ? 'bg-accent animate-orb-thinking' 
                : 'bg-accent animate-orb-breathing'
            }`} />
            
            <motion.div 
              className={`w-16 h-16 rounded-full flex items-center justify-center border border-ink/10 shadow-lg text-bg ${
                isPlayingPreview 
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 animate-orb-listening' 
                  : step === 'saving' 
                  ? 'bg-gradient-to-tr from-accent to-accent-glow animate-orb-thinking' 
                  : 'bg-gradient-to-tr from-accent to-accent/80 animate-orb-breathing'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <Mic className="w-5 h-5 text-bg filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* STEP: INTRO */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="glass-panel p-10 rounded-3xl space-y-8 text-center"
            >
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/5 border border-ink-faint rounded-full text-[10px] font-mono font-bold tracking-wider text-accent">
                  SYSTEM STATUS: INITIATED
                </span>
                <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight leading-tight text-ink uppercase">
                  "Hi, I'm DueNow."
                </h2>
                <p className="text-ink-muted text-sm max-w-md mx-auto leading-relaxed font-light font-sans">
                  I will serve as your Voice-First AI Executive Companion. Before we sync your workstation files and calculate success probability curves, I want to learn about your goals.
                </p>
              </div>

              <div className="pt-4 max-w-xs mx-auto">
                <motion.button
                  onClick={() => setStep('profile_type')}
                  className="w-full py-4 bg-accent hover:opacity-90 rounded-xl text-bg font-bold tracking-wider shadow-md font-mono text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Begin Configuration</span>
                  <ArrowRight className="w-4 h-4 text-bg" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP: PROFILE TYPE */}
          {step === 'profile_type' && (
            <motion.div
              key="profile_type"
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="glass-panel p-10 rounded-3xl space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent font-mono">Step 1 of 6</span>
                <h3 className="font-display font-bold text-2xl tracking-tight text-ink">How do you manage your days?</h3>
                <p className="text-ink-muted text-xs font-sans">Choose the primary operational domain for your milestones.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <motion.button
                  onClick={() => {
                    setRoleType('professional');
                    setStep('basic_details');
                  }}
                  className={`p-6 border rounded-2xl text-left transition-all relative overflow-hidden cursor-pointer ${
                    roleType === 'professional' ? 'bg-accent/10 border-accent shadow-sm' : 'bg-bg/50 border-ink-faint'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="block text-3xl mb-3">💼</span>
                  <h4 className="font-bold text-ink text-sm font-display">Professional</h4>
                  <p className="text-ink-muted text-[11px] mt-1.5 leading-relaxed font-light font-sans">Managing company targets, corporate sprints, software deliveries, and executive client schedules.</p>
                </motion.button>

                <motion.button
                  onClick={() => {
                    setRoleType('student');
                    setStep('basic_details');
                  }}
                  className={`p-6 border rounded-2xl text-left transition-all relative overflow-hidden cursor-pointer ${
                    roleType === 'student' ? 'bg-accent/10 border-accent shadow-sm' : 'bg-bg/50 border-ink-faint'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="block text-3xl mb-3">🎓</span>
                  <h4 className="font-bold text-ink text-sm font-display">Academic Student</h4>
                  <p className="text-ink-muted text-[11px] mt-1.5 leading-relaxed font-light font-sans">Tracking university hackathons, research labs, coding assignments, exams, and team deliverables.</p>
                </motion.button>
              </div>

              <div className="flex justify-between items-center border-t border-ink-faint pt-6">
                <button 
                  onClick={() => setStep('intro')}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 font-semibold transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-accent" />
                  <span>Back</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: BASIC DETAILS */}
          {step === 'basic_details' && (
            <motion.div
              key="basic_details"
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="glass-panel p-10 rounded-3xl space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent font-mono">Step 2 of 6</span>
                <h3 className="font-display font-bold text-2xl tracking-tight text-ink">A bit about your profile</h3>
                <p className="text-ink-muted text-xs font-sans">These values help customize your companion's workspace queries.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">What is your name?</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">
                      {roleType === 'professional' ? 'Corporate Company' : 'College University'}
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder={roleType === 'professional' ? 'e.g. Google' : 'e.g. Stanford'}
                      className="w-full glass-input rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">
                      {roleType === 'professional' ? 'Department Branch' : 'Academic Major'}
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder={roleType === 'professional' ? 'e.g. Engineering' : 'e.g. Computer Science'}
                      className="w-full glass-input rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">
                    {roleType === 'professional' ? 'Professional Role Title' : 'Academic Specialization'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={roleType === 'professional' ? 'e.g. Senior Product Lead' : 'e.g. Hackathon Team Captain'}
                    className="w-full glass-input rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-ink-faint pt-6">
                <button 
                  onClick={() => setStep('profile_type')}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 font-semibold transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-accent" />
                  <span>Back</span>
                </button>

                <motion.button
                  onClick={() => setStep('working_hours')}
                  disabled={!name.trim()}
                  className="px-6 py-3 bg-accent hover:opacity-90 text-bg disabled:opacity-40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Sync Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5 text-bg" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP: WORKING HOURS */}
          {step === 'working_hours' && (
            <motion.div
              key="working_hours"
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="glass-panel p-10 rounded-3xl space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent font-mono">Step 3 of 6</span>
                <h3 className="font-display font-bold text-2xl tracking-tight text-ink">Coordinate Daily Sprints</h3>
                <p className="text-ink-muted text-xs font-sans">Establish your core operating hours. DueNow blocks these zones for priority focus scans.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Daily Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                    <input
                      type="text"
                      required
                      value={workingHours.start}
                      onChange={(e) => setWorkingHours(prev => ({ ...prev, start: e.target.value }))}
                      placeholder="e.g. 09:00"
                      className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent text-ink"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Daily Close Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                    <input
                      type="text"
                      required
                      value={workingHours.end}
                      onChange={(e) => setWorkingHours(prev => ({ ...prev, end: e.target.value }))}
                      placeholder="e.g. 17:00"
                      className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent text-ink"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Active Timezone Node</label>
                <select
                  value={workingHours.timezone}
                  onChange={(e) => setWorkingHours(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full glass-input rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink bg-bg"
                >
                  <option value="America/New_York">Eastern Standard Time (America/New_York)</option>
                  <option value="America/Chicago">Central Standard Time (America/Chicago)</option>
                  <option value="America/Denver">Mountain Standard Time (America/Denver)</option>
                  <option value="America/Los_Angeles">Pacific Standard Time (America/Los_Angeles)</option>
                  <option value="Europe/London">Greenwich Mean Time (Europe/London)</option>
                  <option value="Asia/Kolkata">India Standard Time (Asia/Kolkata)</option>
                  <option value="Asia/Tokyo">Japan Standard Time (Asia/Tokyo)</option>
                </select>
              </div>

              <div className="flex justify-between items-center border-t border-ink-faint pt-6">
                <button 
                  onClick={() => setStep('basic_details')}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 font-semibold transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-accent" />
                  <span>Back</span>
                </button>

                <motion.button
                  onClick={() => setStep('personality')}
                  className="px-6 py-3 bg-accent hover:opacity-90 text-bg rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Design Companion</span>
                  <ArrowRight className="w-3.5 h-3.5 text-bg" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP: PERSONALITY SELECT */}
          {step === 'personality' && (
            <motion.div
              key="personality"
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="glass-panel p-10 rounded-3xl space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent font-mono">Step 4 of 6</span>
                <h3 className="font-display font-bold text-2xl tracking-tight text-ink">Select AI Persona</h3>
                <p className="text-ink-muted text-xs font-sans">Choose your Executive companion's active communication model.</p>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-2 gap-3">
                {(['mentor', 'best_friend', 'coach', 'professional'] as VoicePersonality[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPersonality(p)}
                    className={`p-4 border rounded-2xl text-left transition-all cursor-pointer ${
                      selectedPersonality === p
                        ? 'border-accent ring-2 ring-accent/10 bg-accent/5 shadow-sm'
                        : 'border-ink-faint bg-bg hover:bg-bg/80 hover:border-ink/20'
                    }`}
                  >
                    <span className="block font-bold text-ink capitalize text-xs font-display">
                      {p === 'mentor' && 'Wise Mentor'}
                      {p === 'best_friend' && 'Best Friend'}
                      {p === 'coach' && 'Performance Coach'}
                      {p === 'professional' && 'Refined Chief of Staff'}
                    </span>
                    <span className="block text-[10px] text-ink-muted mt-1 leading-snug font-sans font-light">
                      {p === 'mentor' && 'Strategic growth feedback.'}
                      {p === 'best_friend' && 'Friendly, daily workspace push.'}
                      {p === 'coach' && 'Extreme accountability constraints.'}
                      {p === 'professional' && 'Direct, highly analytical briefs.'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Mini Interactive Preview Area */}
              {currentPersona && (
                <div className="p-4 bg-bg/50 border border-ink-faint rounded-2xl space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent font-mono flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-accent" />
                      Dynamic Dialogue Preview
                    </span>
                    <motion.button
                      onClick={() => playVoicePreview(currentPersona.quote, speakingSpeed)}
                      disabled={isPlayingPreview}
                      className="text-[10px] font-bold text-accent hover:opacity-85 flex items-center gap-1 font-mono disabled:opacity-40 cursor-pointer"
                      whileHover={{ scale: 1.03 }}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-accent" />
                      <span>{isPlayingPreview ? 'Synthesizing...' : 'Speak Line'}</span>
                    </motion.button>
                  </div>
                  <p className="text-ink-muted text-xs leading-relaxed italic font-light">
                    {currentPersona.quote}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Custom Companion Name</label>
                <input
                  type="text"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="e.g. DueNow"
                  className="w-full glass-input rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink"
                />
              </div>

              <div className="flex justify-between items-center border-t border-ink-faint pt-6">
                <button 
                  onClick={() => setStep('working_hours')}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 font-semibold transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-accent" />
                  <span>Back</span>
                </button>

                <motion.button
                  onClick={() => setStep('voice_style')}
                  className="px-6 py-3 bg-accent hover:opacity-90 text-bg rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Select Voice</span>
                  <ArrowRight className="w-3.5 h-3.5 text-bg" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP: VOICE STYLE */}
          {step === 'voice_style' && (
            <motion.div
              key="voice_style"
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="glass-panel p-10 rounded-3xl space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent font-mono">Step 5 of 6</span>
                <h3 className="font-display font-bold text-2xl tracking-tight text-ink">Audio & Pitch Sync</h3>
                <p className="text-ink-muted text-xs font-sans">Fine-tune the acoustic spectrum and speech tempo of your companion.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Vocal Profile Choice</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Zephyr', 'Kore', 'Puck'].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setVoicePreference(v);
                          playVoicePreview(`I will speak using the ${v} acoustic profile.`, speakingSpeed);
                        }}
                        className={`p-3 border rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                          voicePreference === v ? 'border-accent bg-accent/15 text-ink' : 'border-ink-faint bg-bg text-ink-muted'
                        }`}
                      >
                        {v === 'Zephyr' && 'Zephyr (Warm)'}
                        {v === 'Kore' && 'Kore (Calm)'}
                        {v === 'Puck' && 'Puck (Direct)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Speech Speed Rate</label>
                    <span className="text-xs font-mono font-bold text-accent">{speakingSpeed}x tempo</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={speakingSpeed}
                    onChange={(e) => setSpeakingSpeed(parseFloat(e.target.value))}
                    className="w-full accent-accent bg-ink-faint h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">UI Dark Theme</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setThemePreference('dark')}
                        className={`py-2 px-3 border rounded-lg text-xs font-bold ${
                          themePreference === 'dark' ? 'border-accent bg-accent/10 text-ink' : 'border-ink-faint text-ink-muted'
                        }`}
                      >
                        Twilight
                      </button>
                      <button
                        onClick={() => setThemePreference('light')}
                        className={`py-2 px-3 border rounded-lg text-xs font-bold ${
                          themePreference === 'light' ? 'border-accent bg-accent/10 text-ink' : 'border-ink-faint text-ink-muted'
                        }`}
                      >
                        Classic
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Nudge Dialogue Style</label>
                    <select
                      value={reminderStyle}
                      onChange={(e) => setReminderStyle(e.target.value as any)}
                      className="w-full glass-input rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink bg-bg"
                    >
                      <option value="professional">Professional</option>
                      <option value="motivational">Motivational</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-ink-faint pt-6">
                <button 
                  onClick={() => setStep('personality')}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 font-semibold transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-accent" />
                  <span>Back</span>
                </button>

                <motion.button
                  onClick={() => setStep('permissions')}
                  className="px-6 py-3 bg-accent hover:opacity-90 text-bg rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Grant Scope</span>
                  <ArrowRight className="w-3.5 h-3.5 text-bg" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP: PERMISSIONS FLOW */}
          {step === 'permissions' && (
            <motion.div
              key="permissions"
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="glass-panel p-10 rounded-3xl space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent font-mono">Step 6 of 6</span>
                <h3 className="font-display font-bold text-2xl tracking-tight text-ink">Granular Workstation Scope</h3>
                <p className="text-ink-muted text-xs font-sans">Authorize integrations step-by-step to sync calendar data and repository state.</p>
              </div>

              {/* Sub-steps of permissions */}
              <div className="p-6 bg-bg/50 border border-ink-faint rounded-2xl shadow-inner">
                <AnimatePresence mode="wait">
                  {permissionSubStep === 0 && (
                    <motion.div
                      key="mic"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent shadow-inner">
                          <Mic className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-sm font-display">Microphone Input Sync</h4>
                          <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Secure Local Capture Only
                          </span>
                        </div>
                      </div>

                      <p className="text-ink-muted text-xs leading-relaxed font-light font-sans">
                        Authorizes hands-free vocal collaboration inside the workstation container. Does not background record or transmit private voice data externally.
                      </p>

                      <div className="flex gap-3 pt-2">
                        <motion.button
                          onClick={requestMicrophone}
                          className="px-5 py-2.5 bg-accent hover:opacity-90 text-bg rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-accent/10"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Request Permission
                        </motion.button>
                        <button
                          onClick={() => setPermissionSubStep(1)}
                          className="px-5 py-2.5 bg-ink/5 hover:bg-ink/10 text-ink-muted rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                          Skip mic sync
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {permissionSubStep === 1 && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent shadow-inner">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-sm font-display">Bi-directional Google Calendar Sync</h4>
                          <span className="text-[10px] text-accent font-mono font-bold uppercase tracking-wider">SECURE OAUTH HANDSHAKE</span>
                        </div>
                      </div>

                      <p className="text-ink-muted text-xs leading-relaxed font-light font-sans">
                        Pulls your meetings and calendar schedules in real-time to compute predictive success probabilities and flag major timeline bottlenecks.
                      </p>

                      <div className="flex gap-3 pt-2">
                        <motion.button
                          onClick={() => {
                            setCalPerm(true);
                            setPermissionSubStep(2);
                          }}
                          className="px-5 py-2.5 bg-accent hover:opacity-90 text-bg rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-accent/10"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Authorize Calendar Access
                        </motion.button>
                        <button
                          onClick={() => setPermissionSubStep(2)}
                          className="px-5 py-2.5 bg-ink/5 hover:bg-ink/10 text-ink-muted rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                          Skip calendar sync
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {permissionSubStep === 2 && (
                    <motion.div
                      key="workspace"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent shadow-inner">
                          <FolderSync className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-sm font-display">Active Workspace Scan</h4>
                          <span className="text-[10px] text-accent font-mono font-bold uppercase tracking-wider">LOCAL METRIC PARSER</span>
                        </div>
                      </div>

                      <p className="text-ink-muted text-xs leading-relaxed font-light font-sans">
                        Allows the AI executive engine to check folder health indices, parse active task logs, and ensure your milestone submissions align with guidelines.
                      </p>

                      <div className="flex gap-3 pt-2">
                        <motion.button
                          onClick={() => {
                            setWorkPerm(true);
                            handleFinalSubmit();
                          }}
                          className="px-5 py-2.5 bg-accent hover:opacity-90 text-bg rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-accent/10"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Authorize Directory Scan
                        </motion.button>
                        <button
                          onClick={handleFinalSubmit}
                          className="px-5 py-2.5 bg-ink/5 hover:bg-ink/10 text-ink-muted rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                          Skip scan
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-between items-center border-t border-ink-faint pt-6">
                <button 
                  onClick={() => {
                    if (permissionSubStep > 0) {
                      setPermissionSubStep(prev => prev - 1);
                    } else {
                      setStep('voice_style');
                    }
                  }}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 font-semibold transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-accent" />
                  <span>Back</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: SAVING STATE */}
          {step === 'saving' && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-10 rounded-3xl space-y-6 text-center"
            >
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-inner animate-spin">
                  <Compass className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-xl text-ink uppercase tracking-wide">Establishing Profile Node</h3>
                <p className="text-ink-muted text-xs font-sans">Securing preferences, companion metadata, and credentials in Firestore database...</p>
              </div>

              <div className="max-w-xs mx-auto space-y-2">
                <div className="w-full bg-ink/5 h-2 rounded-full overflow-hidden shadow-inner border border-ink-faint">
                  <motion.div 
                    className="bg-accent h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${savingProgress}%` }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-accent font-bold tracking-wider">{savingProgress}% SYNCED</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
