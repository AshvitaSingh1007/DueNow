import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  Volume2, 
  Compass, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Sun, 
  CloudSun, 
  Moon,
  TrendingUp,
  AlertCircle,
  Award,
  Coffee,
  ChevronRight,
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TimelineBlock {
  id: string;
  time: string;
  period: 'morning' | 'afternoon' | 'evening';
  type: 'preparation' | 'task' | 'focus' | 'break';
  title: string;
  duration: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'ai_recommended';
  workspaceId: string;
  voiceText: string;
  progress: number;
  completed: boolean;
}

interface WeeklyPlanDay {
  day: string;
  tasksCount: number;
  focusHours: number;
}

interface PlanRecommendation {
  action: string;
  reason: string;
  expectedBenefit: string;
  estimatedTimeSaved: number;
  expectedSuccessProbabilityImprovement: number;
}

export const ExecutionTimeline: React.FC = () => {
  const { currentUser, googleAccessToken, connectGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'dueNow' | 'googleCalendar'>('dueNow');

  // Local AI Plan states
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanDay[]>([]);
  const [metrics, setMetrics] = useState({
    focusBlocksCount: 0,
    bufferTimeMins: 0,
    prepSessionsCount: 0
  });
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);

  // Google Calendar state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Calendar mutation modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventAttendees, setEventAttendees] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  // Fetch AI plan from server
  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/plan', {
        headers: {
          'Authorization': `Bearer ${currentUser?.uid || localStorage.getItem('dueNow_userId') || 'default-user-id'}`
        }
      });
      const data = await res.json();
      if (data.todayPlan) {
        setTimeline(data.todayPlan);
        setWeeklyPlan(data.weeklyPlan || []);
        setMetrics({
          focusBlocksCount: data.focusBlocksCount || 0,
          bufferTimeMins: data.bufferTimeMins || 0,
          prepSessionsCount: data.prepSessionsCount || 0
        });
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to fetch AI executive plan:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Google Calendar events
  const fetchCalendarEvents = async () => {
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const token = googleAccessToken || sessionStorage.getItem('google_access_token');
      if (!token) {
        setCalendarError('needs_auth');
        setCalendarLoading(false);
        return;
      }
      const res = await fetch('/api/google/calendar', {
        headers: {
          'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`,
          'x-google-access-token': token
        }
      });
      const data = await res.json();
      if (data.needsAuth) {
        setCalendarError('needs_auth');
      } else {
        setCalendarEvents(data.events || []);
      }
    } catch (err: any) {
      console.error('Calendar sync failed:', err);
      setCalendarError('Failed to fetch calendar events. Connection expired.');
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'googleCalendar') {
      fetchCalendarEvents();
    }
  }, [activeTab, googleAccessToken]);

  // Map icon component based on block type
  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'preparation': return Compass;
      case 'task': return Cpu;
      case 'focus': return Sparkles;
      case 'break': return Coffee;
      default: return ShieldCheck;
    }
  };

  // Toggle checklist or block completion status
  const handleToggleComplete = async (blockId: string, currentStatus: boolean, voiceText: string) => {
    const updatedBlocks = timeline.map(block => {
      if (block.id === blockId) {
        const nextStatus = !currentStatus;
        return { 
          ...block, 
          completed: nextStatus,
          progress: nextStatus ? 100 : 0
        };
      }
      return block;
    });

    setTimeline(updatedBlocks);

    try {
      await fetch('/api/ai/plan/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || localStorage.getItem('dueNow_userId') || 'default-user-id'}`
        },
        body: JSON.stringify({ blocks: updatedBlocks })
      });

      if (!currentStatus) {
        speakTimelineFeedback(voiceText, blockId);
      }
    } catch (err) {
      console.error('Failed to save timeline state update:', err);
    }
  };

  // Audio speech synthesis announcer
  const speakTimelineFeedback = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlayingId(id);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.onend = () => setIsPlayingId(null);
    utterance.onerror = () => setIsPlayingId(null);
    window.speechSynthesis.speak(utterance);
  };

  // Google Calendar Connection helper
  const handleConnectCalendar = async () => {
    try {
      await connectGoogle();
      setTimeout(() => {
        fetchCalendarEvents();
      }, 500);
    } catch (err) {
      console.error('Google link sequence failed:', err);
    }
  };

  // Event modal Open methods
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setEventTitle('');
    
    const start = new Date();
    start.setMinutes(start.getMinutes() + (30 - start.getMinutes() % 30), 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    
    const offset = start.getTimezoneOffset() * 60000;
    const localStartISO = new Date(start.getTime() - offset).toISOString().slice(0, 16);
    const localEndISO = new Date(end.getTime() - offset).toISOString().slice(0, 16);
    
    setEventStart(localStartISO);
    setEventEnd(localEndISO);
    setEventDescription('');
    setEventAttendees('');
    setShowEventModal(true);
  };

  const handleOpenEditModal = (event: any) => {
    setEditingEvent(event);
    setEventTitle(event.title);
    
    const offset = new Date().getTimezoneOffset() * 60000;
    const localStartISO = new Date(event.startTime - offset).toISOString().slice(0, 16);
    const localEndISO = new Date(event.endTime - offset).toISOString().slice(0, 16);
    
    setEventStart(localStartISO);
    setEventEnd(localEndISO);
    setEventDescription(event.description || '');
    setEventAttendees(event.attendees?.join(', ') || '');
    setShowEventModal(true);
  };

  // CRUD Save Google Calendar event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEvent(true);
    try {
      const token = googleAccessToken || sessionStorage.getItem('google_access_token');
      if (!token) return;

      const attendeesList = eventAttendees.split(',').map(a => a.trim()).filter(a => a.includes('@'));

      const payload = {
        title: eventTitle,
        startTime: new Date(eventStart).getTime(),
        endTime: new Date(eventEnd).getTime(),
        description: eventDescription,
        attendees: attendeesList
      };

      const url = editingEvent 
        ? `/api/google/calendar/${editingEvent.eventId}`
        : '/api/google/calendar';
      
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`,
          'x-google-access-token': token
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowEventModal(false);
        fetchCalendarEvents();
      }
    } catch (err) {
      console.error('Failed to synchronize calendar event modification:', err);
    } finally {
      setSavingEvent(false);
    }
  };

  // CRUD Delete Google Calendar event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event from Google Calendar?')) return;
    try {
      const token = googleAccessToken || sessionStorage.getItem('google_access_token');
      if (!token) return;

      const res = await fetch(`/api/google/calendar/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`,
          'x-google-access-token': token
        }
      });
      if (res.ok) {
        fetchCalendarEvents();
      }
    } catch (err) {
      console.error('Failed to remove Google Calendar event:', err);
    }
  };

  // Compute completed counts
  const totalEvents = timeline.length;
  const completedEvents = timeline.filter(t => t.completed).length;
  const progressPercent = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

  // Split into chronological sections
  const morningEvents = timeline.filter(e => e.period === 'morning');
  const afternoonEvents = timeline.filter(e => e.period === 'afternoon');
  const eveningEvents = timeline.filter(e => e.period === 'evening');

  const renderPeriodBlock = (title: string, periodIcon: React.ComponentType<any>, periodEvents: TimelineBlock[], accentColor: string) => {
    const PeriodIcon = periodIcon;
    return (
      <div className="space-y-4">
        <h3 className={`text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2 ${accentColor}`}>
          <PeriodIcon className="w-4 h-4" />
          {title} ({periodEvents.length})
        </h3>

        <div className="space-y-3">
          {periodEvents.length === 0 ? (
            <div className="text-left py-6 px-4 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-xs text-slate-400">
              No objectives scheduled for this period.
            </div>
          ) : (
            periodEvents.map((item) => {
              const isDone = item.completed;
              const isPlaying = isPlayingId === item.id;
              const ItemIcon = getBlockIcon(item.type);

              return (
                <motion.div
                  key={item.id}
                  layoutId={`timeline-card-${item.id}`}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isDone 
                      ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-white/5 opacity-70' 
                      : 'bg-white dark:bg-slate-950/25 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-900/10'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${
                      isDone 
                        ? 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/5' 
                        : 'bg-slate-50 dark:bg-accent/10 text-accent border-slate-100 dark:border-accent/10'
                    }`}>
                      <ItemIcon className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-accent font-bold">{item.time}</span>
                        <span className={`text-[8px] font-mono uppercase font-bold tracking-wider px-1.5 rounded-sm ${
                          item.priority === 'critical' || item.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-500' 
                            : 'bg-accent/10 text-accent'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold text-slate-800 dark:text-slate-100 truncate ${isDone ? 'line-through opacity-70' : ''}`}>
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0 font-mono text-[10px]">
                    <span className="text-slate-500 font-semibold">{item.duration}</span>
                    
                    {/* Speech synthesis player */}
                    <button
                      onClick={() => speakTimelineFeedback(item.voiceText, item.id)}
                      className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                        isPlaying 
                          ? 'bg-emerald-500 text-white border-emerald-500' 
                          : 'border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:text-accent dark:hover:text-slate-300'
                      }`}
                      title="Play Vocal Resonance"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
                    </button>

                    {/* Checkbox trigger */}
                    <button
                      onClick={() => handleToggleComplete(item.id, isDone, item.voiceText)}
                      className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                        isDone 
                          ? 'border-accent bg-accent text-white' 
                          : 'border-slate-300 dark:border-white/10 text-slate-400 hover:border-accent'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (loading && timeline.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Sparkles className="w-8 h-8 text-accent animate-spin" />
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Executive Schedules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-white/5 pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5.5 h-5.5 text-accent animate-pulse" />
            AI Scheduling & Timeline Engine
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-light font-sans text-left">
            Calibrate focus blocks, evaluate checklist statuses, and manage synchronized Google Calendar core events.
          </p>
        </div>

        {/* Dynamic tabs switch */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/40 dark:border-white/5 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('dueNow')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dueNow'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-accent" />
            DueNow AI Plan
          </button>
          <button
            onClick={() => setActiveTab('googleCalendar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'googleCalendar'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-accent" />
            Google Calendar Core
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dueNow' ? (
          <motion.div
            key="dueNowPlan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Timeline Event Groups */}
            <div className="lg:col-span-8 space-y-6">
              {renderPeriodBlock('Morning Priorities', Sun, morningEvents, 'text-amber-500')}
              {renderPeriodBlock('Afternoon Focus Blocks', CloudSun, afternoonEvents, 'text-accent')}
              {renderPeriodBlock('Evening Auditing parameters', Moon, eveningEvents, 'text-violet-500')}
              
              {/* Weekly outlook grid */}
              <div className="border border-slate-200 dark:border-white/5 p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-900/10 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-left text-slate-400">Weekly Pace Summary</h4>
                <div className="grid grid-cols-5 gap-3">
                  {weeklyPlan.map((d, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-xl text-center space-y-1.5">
                      <span className="text-[10px] font-mono font-bold block text-slate-400">{d.day}</span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-white block">{d.tasksCount} Tasks</span>
                        <span className="text-[9px] font-mono text-accent block">{d.focusHours}h Focus</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Recommendations Panel */}
            <div className="lg:col-span-4 space-y-5 text-left">
              <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-[-25%] right-[-25%] w-[180px] h-[180px] bg-accent/10 rounded-full blur-[45px] pointer-events-none" />

                <div className="space-y-5 relative z-10 w-full text-left font-sans">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block">
                      INTELLIGENT RE-PACING
                    </span>
                    <h3 className="font-display font-bold text-base text-slate-800 dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4.5 h-4.5 text-accent" />
                      Companion Scheduling
                    </h3>
                  </div>

                  {/* Stats parameters */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/45 rounded-xl border border-slate-100 dark:border-white/5 text-center">
                      <span className="text-[18px] font-extrabold text-slate-800 dark:text-white block">{metrics.focusBlocksCount}</span>
                      <span className="text-[8px] font-mono font-semibold uppercase tracking-wider text-slate-400 block mt-0.5">Focus Blocks</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/45 rounded-xl border border-slate-100 dark:border-white/5 text-center">
                      <span className="text-[18px] font-extrabold text-slate-800 dark:text-white block">{metrics.bufferTimeMins}m</span>
                      <span className="text-[8px] font-mono font-semibold uppercase tracking-wider text-slate-400 block mt-0.5">Buffer Slots</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/45 rounded-xl border border-slate-100 dark:border-white/5 text-center">
                      <span className="text-[18px] font-extrabold text-slate-800 dark:text-white block">{metrics.prepSessionsCount}</span>
                      <span className="text-[8px] font-mono font-semibold uppercase tracking-wider text-slate-400 block mt-0.5">Preps</span>
                    </div>
                  </div>

                  {/* Recommendations list */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Trajectory Mitigations:</span>
                    {recommendations.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No mitigations currently required.</p>
                    ) : (
                      recommendations.map((rec, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-xl space-y-1.5 text-xs text-left">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{rec.action}</span>
                            <span className="text-[9px] font-mono text-emerald-500 font-bold shrink-0">+{rec.expectedSuccessProbabilityImprovement}% Probability</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-light leading-snug">{rec.reason}</p>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/40 dark:border-white/5 text-[9px] text-slate-400 font-mono">
                            <span className="text-accent">{rec.expectedBenefit}</span>
                            <span className="ml-auto">Save {rec.estimatedTimeSaved}m</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl flex items-start gap-3 text-left">
                  <Compass className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-light leading-normal">
                    Agendas auto-adapt based on active task priorities, checklist progress ratios, and current directory scans.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="googleCalendarView"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {calendarError === 'needs_auth' ? (
              <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 rounded-3xl space-y-4 shadow-sm max-w-2xl mx-auto">
                <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Google Calendar Integration Required</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-sans font-light">
                    Link your primary calendar to visually resolve meeting overlays, detect scheduling conflicts, and synchronize events.
                  </p>
                </div>
                <button
                  onClick={handleConnectCalendar}
                  className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  Authorize Google Calendar
                </button>
              </div>
            ) : calendarError ? (
              <div className="p-6 bg-rose-50/20 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/30 rounded-2xl space-y-3 max-w-2xl mx-auto text-left">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-450">
                  <ShieldAlert className="w-5 h-5" />
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider">Sync Sequence Interrupted</h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-400 font-sans font-light leading-relaxed">
                  Unable to establish handshake with Google Calendar APIs: {calendarError}
                </p>
                <button
                  onClick={fetchCalendarEvents}
                  className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer hover:bg-rose-600"
                >
                  Retry API Handshake
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                {/* Events list */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      Synchronized Events ({calendarEvents.length})
                    </h3>
                    <button
                      onClick={handleOpenCreateModal}
                      className="px-3.5 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Event
                    </button>
                  </div>

                  {calendarLoading && calendarEvents.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-accent animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 font-sans">Connecting to Google Cloud APIs...</p>
                    </div>
                  ) : calendarEvents.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                      <p className="text-xs text-slate-400 font-sans">No events scheduled on Google Calendar for today.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {calendarEvents.map((evt) => {
                        const hasConflicts = evt.conflicts && evt.conflicts.length > 0;
                        return (
                          <div 
                            key={evt.eventId}
                            className={`p-5 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 rounded-2xl space-y-3 shadow-xs relative overflow-hidden transition-all hover:border-accent/20 ${
                              hasConflicts ? 'border-rose-200 dark:border-rose-950/40 bg-rose-50/10 dark:bg-rose-950/5' : ''
                            }`}
                          >
                            {hasConflicts && (
                              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-mono uppercase tracking-widest font-extrabold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                                <AlertTriangle className="w-3 h-3" />
                                Dynamic Conflict
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1 pr-24">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                  {evt.title}
                                </h4>
                                <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-accent" />
                                  <span>{new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>-</span>
                                  <span>{new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleOpenEditModal(evt)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
                                  title="Edit Event"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(evt.eventId)}
                                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                                  title="Delete Event"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {evt.description && (
                              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-sans font-light">
                                {evt.description}
                              </p>
                            )}

                            {evt.attendees && evt.attendees.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                  {evt.attendees.map((email: string, idx: number) => (
                                    <span key={idx} className="text-[9px] font-mono bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-md">
                                      {email}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {hasConflicts && (
                              <div className="mt-2.5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold rounded-xl flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <span>⚠️ Schedule Overlap Warn: Overlaps with other synchronized meetings.</span>
                                  <div className="text-[10px] text-rose-500/80 font-light list-disc pl-4">
                                    Double-booking detected on this slot. Rescheduling is suggested.
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Calendar Guidelines panel */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="bg-white dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-5 relative overflow-hidden">
                    <div className="absolute top-[-25%] right-[-25%] w-[180px] h-[180px] bg-accent/10 rounded-full blur-[45px]" />
                    
                    <div className="space-y-4 relative z-10 font-sans">
                      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block">Core Calendar Sync</span>
                      <h3 className="font-display font-bold text-base text-slate-800 dark:text-white">Active Overlaps</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-light">
                        DueNow continuously listens to your Google Calendar. Double bookings are instantly audited and flagged with visual conflict warnings to preserve executive pacing.
                      </p>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-zinc-800/80 rounded-2xl space-y-3">
                        <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">CONFLICT REPORTING</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-400">Total Bookings:</span>
                            <span className="text-slate-700 dark:text-white font-bold">{calendarEvents.length}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-400">Conflict Count:</span>
                            <span className="text-rose-500 font-bold">
                              {calendarEvents.filter(e => e.conflicts && e.conflicts.length > 0).length} Overlaps
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVENT CRUD DIALOG MODAL */}
      <AnimatePresence>
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEventModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-3xl max-w-md w-full relative z-10 shadow-2xl space-y-4"
            >
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {editingEvent ? 'Modify Synchronized Event' : 'Create Google Calendar Event'}
                </h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Primary Calendar Workspace</span>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Workspace Health Checkpoint"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-accent text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase">Start Date/Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-accent text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase">End Date/Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-accent text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Attendees (comma-separated emails)</label>
                  <input
                    type="text"
                    placeholder="executive@duenow.ai, partner@gmail.com"
                    value={eventAttendees}
                    onChange={(e) => setEventAttendees(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-accent text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Description / Purpose</label>
                  <textarea
                    rows={3}
                    placeholder="Describe meeting objective..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-accent text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEvent}
                    className="px-4.5 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    {savingEvent && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {savingEvent ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
