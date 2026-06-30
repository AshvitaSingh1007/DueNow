import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Play, Pause, RotateCw, CheckCircle2, Flame, Award, Clock, Sparkles, 
  ChevronRight, Volume2, Calendar, Target, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FocusSession: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');
  const [duration, setDuration] = useState<number>(25); // minutes
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}` }
      });
      const data = await res.json();
      setTasks(data.tasks || []);
      if (data.tasks?.length > 0) {
        setSelectedTaskId(data.tasks[0].taskId);
        setSelectedTaskTitle(data.tasks[0].title);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/focus/history', {
        headers: { 'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}` }
      });
      const data = await res.json();
      setRecentSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchHistory();
  }, []);

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    const selected = tasks.find(t => t.taskId === taskId);
    setSelectedTaskTitle(selected ? selected.title : 'Deep Focus Block');
  };

  // Keep track of time updates
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          // Periodic encouraging announcements
          if (prev % 300 === 0 && prev > 0) {
            playVoiceEncouragement();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    setIsCompleted(true);
    playEncouragementOnComplete();

    try {
      const res = await fetch('/focus/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`
        },
        body: JSON.stringify({
          taskId: selectedTaskId,
          taskTitle: selectedTaskTitle || 'Deep Focus Block',
          duration: duration,
          completed: true
        })
      });
      if (res.ok) {
        fetchHistory();
        // Refresh parent components or indicators if needed
      }
    } catch (err) {
      console.error(err);
    }
  };

  const playVoiceEncouragement = () => {
    if (isMuted) return;
    const persona = userProfile?.personality || 'mentor';
    let msg = '';
    if (persona === 'coach') {
      msg = "Keep pushing forward! Lock in your focus. No distractions!";
    } else if (persona === 'best_friend') {
      msg = "You are doing amazing! I'm right here with you. Keep it up!";
    } else if (persona === 'professional') {
      msg = "Maintain structural focus. Progress is being tracked successfully.";
    } else {
      msg = "Excellent concentration. Take a steady breath and let your thoughts align.";
    }
    const utterance = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis.speak(utterance);
  };

  const playEncouragementOnComplete = () => {
    if (isMuted) return;
    const persona = userProfile?.personality || 'mentor';
    let msg = '';
    if (persona === 'coach') {
      msg = "Boom! Focus block completed. Excellent drive!";
    } else if (persona === 'best_friend') {
      msg = "Hooray! You did it! So proud of your focus today!";
    } else if (persona === 'professional') {
      msg = "Focus session completed. Metrics recorded and score successfully updated.";
    } else {
      msg = "Beautiful work. Your focus block has resolved. Let your mind rest briefly.";
    }
    const utterance = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis.speak(utterance);
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
    setIsCompleted(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setTimeLeft(duration * 60);
  };

  const selectDuration = (mins: number) => {
    setDuration(mins);
    setTimeLeft(mins * 60);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0 && mins <= 180) {
      setDuration(mins);
      setTimeLeft(mins * 60);
      setIsRunning(false);
      setIsCompleted(false);
      setCustomMinutes('');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rSecs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.max(0, Math.min(100, ((duration * 60 - timeLeft) / (duration * 60)) * 100)) : 0;

  return (
    <div id="focus-zone-container" className="max-w-5xl mx-auto space-y-6 p-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Timer Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden shadow-xs">
            {/* Top Indicator */}
            <div className="w-full flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 px-2.5 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 animate-pulse" /> Focus Block
              </span>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-xs font-mono text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 border border-gray-100 dark:border-zinc-800 px-2.5 py-1 rounded-full"
              >
                <Volume2 className="w-3.5 h-3.5" /> {isMuted ? 'Muted' : 'Sound On'}
              </button>
            </div>

            {/* Selected Task Header */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Active Objective</span>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-md">
                {selectedTaskTitle || 'Deep Focus Block'}
              </h2>
            </div>

            {/* Radial-like visual countdown clock */}
            <div className="relative w-56 h-56 flex items-center justify-center">
              {/* SVG Ring Background */}
              <svg className="absolute w-full h-full -rotate-90">
                <circle 
                  cx="112" 
                  cy="112" 
                  r="100" 
                  className="stroke-gray-100 dark:stroke-zinc-850 fill-none" 
                  strokeWidth="6" 
                />
                <motion.circle 
                  cx="112" 
                  cy="112" 
                  r="100" 
                  className="stroke-gray-900 dark:stroke-zinc-100 fill-none" 
                  strokeWidth="6" 
                  strokeDasharray="628"
                  initial={{ strokeDashoffset: 628 }}
                  animate={{ strokeDashoffset: 628 - (628 * progressPercent) / 100 }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </svg>

              {/* Central Time */}
              <div className="z-10 space-y-1">
                <div className="text-4xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                  {isRunning ? 'concentration active' : isCompleted ? 'session resolved' : 'paused'}
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleReset}
                className="p-3 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-xl transition-all"
                title="Reset Timer"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleStartPause}
                className={`px-8 py-3.5 rounded-xl font-medium shadow-xs transition-all flex items-center gap-2 ${
                  isRunning 
                    ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400' 
                    : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isRunning ? 'Pause Block' : 'Start Focus'}
              </button>

              <button
                onClick={playVoiceEncouragement}
                className="p-3 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-xl transition-all"
                title="Trigger Encouraging Voice Nudge"
              >
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </button>
            </div>
          </div>

          {/* Quick Duration & Custom Picker Panel */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Configure Interval</h3>
            <div className="grid grid-cols-4 gap-2.5">
              {[25, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => selectDuration(mins)}
                  className={`py-3.5 rounded-xl text-xs font-medium font-sans border transition-all ${
                    duration === mins 
                      ? 'bg-gray-50 border-gray-200 dark:bg-zinc-850 dark:border-zinc-700 text-gray-900 dark:text-white font-bold' 
                      : 'border-gray-100 dark:border-zinc-800 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomSubmit} className="flex gap-2.5 pt-2">
              <input
                type="number"
                placeholder="Custom duration (minutes)..."
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                min="1"
                max="180"
                className="flex-1 bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-xs font-sans text-gray-900 dark:text-white focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                Apply
              </button>
            </form>
          </div>
        </div>

        {/* Right Task Selector & History Panel */}
        <div className="space-y-6">
          {/* Target Task Selector */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800 pb-3">
              <Target className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Map Focus Target</h3>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Associate Deliverable</label>
              <select
                value={selectedTaskId}
                onChange={(e) => handleTaskChange(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 px-4 py-3 rounded-xl text-xs text-gray-800 dark:text-zinc-200 focus:outline-hidden"
              >
                {tasks.length > 0 ? (
                  tasks.map((t: any) => (
                    <option key={t.taskId} value={t.taskId}>
                      {t.title} ({t.priority})
                    </option>
                  ))
                ) : (
                  <option value="">General Deep Work Block</option>
                )}
              </select>
              <p className="text-[10px] text-gray-400 leading-relaxed leading-normal">
                Completing a focus session will automatically flag the associated deliverable as "completed" and update your Execution Score™ dynamically.
              </p>
            </div>
          </div>

          {/* Recent History Panel */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800 pb-3">
              <Award className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Focus Session Logs</h3>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {recentSessions.length > 0 ? (
                recentSessions.map((sess: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-zinc-850 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{sess.taskTitle}</div>
                      <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {sess.duration}m duration
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25 px-2 py-0.5 rounded-sm shrink-0">
                      +{sess.scoreAwarded} pts
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Flame className="w-5 h-5 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-[10px] font-mono text-gray-400 uppercase">NO RECENT FOCUS BLOCKS</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
