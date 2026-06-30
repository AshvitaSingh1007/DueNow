import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Play, AlertTriangle, CheckCircle2, RefreshCw, 
  Clock, Compass, Calendar, Volume2, ShieldCheck, TrendingUp, AlertCircle, VolumeX,
  Mail, Plus, Check, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ExecutiveBriefing: React.FC = () => {
  const { currentUser, userProfile, googleAccessToken, connectGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'morning' | 'afternoon' | 'evening' | 'gmail'>('morning');
  const [isLoading, setIsLoading] = useState(false);
  const [briefingData, setBriefingData] = useState<any>(null);
  const [afternoonData, setAfternoonData] = useState<any>(null);
  const [eveningData, setEveningData] = useState<any>(null);
  const [gmailData, setGmailData] = useState<any>(null);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchMorning = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/daily-briefing', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}` }
      });
      const data = await res.json();
      setBriefingData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAfternoon = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/afternoon-review', {
        headers: { 'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}` }
      });
      const data = await res.json();
      setAfternoonData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvening = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/evening-review', {
        headers: { 'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}` }
      });
      const data = await res.json();
      setEveningData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGmailSummary = async () => {
    setIsLoading(true);
    setGmailError(null);
    try {
      const token = googleAccessToken || sessionStorage.getItem('google_access_token');
      if (!token) {
        setGmailError('needs_auth');
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/google/gmail/summary', {
        headers: {
          'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`,
          'x-google-access-token': token
        }
      });
      const data = await res.json();
      if (data.needsAuth) {
        setGmailError('needs_auth');
      } else {
        setGmailData(data);
      }
    } catch (err: any) {
      console.error('Failed to load Gmail summary:', err);
      setGmailError(err.message || 'Synchronization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      await connectGoogle();
      setTimeout(() => {
        fetchGmailSummary();
      }, 500);
    } catch (err) {
      console.error('Failed to authenticate Google Services:', err);
    }
  };

  const handleAddSuggestedTask = async (taskTitle: string, emailId: string) => {
    setActionPendingId(emailId);
    try {
      const response = await fetch('/api/ai/confirm-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`
        },
        body: JSON.stringify({
          action: 'create_task',
          taskData: {
            title: taskTitle,
            priority: 'high',
            estimatedDuration: 45,
            notes: `Auto-generated from high-priority Gmail message sync.`
          }
        })
      });
      const result = await response.json();
      if (result.executed) {
        // Acoustically announce success
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(`Task successfully registered: ${taskTitle}. Workstation sequence updated.`);
          window.speechSynthesis.speak(utterance);
        }
        
        // Temporarily mark as added in the view
        setGmailData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            emails: prev.emails.map((e: any) => e.id === emailId ? { ...e, isRegistered: true } : e)
          };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionPendingId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'morning' && !briefingData) fetchMorning();
    if (activeTab === 'afternoon' && !afternoonData) fetchAfternoon();
    if (activeTab === 'evening' && !eveningData) fetchEvening();
    if (activeTab === 'gmail' && !gmailData) fetchGmailSummary();
  }, [activeTab]);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = '';
    if (activeTab === 'morning' && briefingData) {
      textToSpeak = `${briefingData.greeting}. Today's priority is: ${briefingData.suggestedFirstTask}. Estimated workload is ${briefingData.estimatedWorkload}. Your highest risk is ${briefingData.highestRisk}. Strategic recommendation: ${briefingData.recommendation}`;
    } else if (activeTab === 'afternoon' && afternoonData) {
      textToSpeak = `${afternoonData.greeting}. We completed ${afternoonData.tasksCompleted} tasks. Remaining: ${afternoonData.remainingWork}. Current success probability is ${afternoonData.currentProbability}%. Recommendation: ${afternoonData.focusSuggestions}`;
    } else if (activeTab === 'evening' && eveningData) {
      textToSpeak = `${eveningData.greeting}. Success summary: ${eveningData.successSummary}. Preparation for tomorrow: ${eveningData.preparationForTomorrow}. ${eveningData.positiveEncouragement}`;
    }

    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div id="briefing-container" className="space-y-6 max-w-5xl mx-auto p-2">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-100 dark:border-zinc-800 gap-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('morning')}
          className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${
            activeTab === 'morning' 
              ? 'text-gray-900 dark:text-white font-semibold' 
              : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          Morning Pre-flight
          {activeTab === 'morning' && (
            <motion.div layoutId="briefingTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-zinc-100" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('afternoon')}
          className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${
            activeTab === 'afternoon' 
              ? 'text-gray-900 dark:text-white font-semibold' 
              : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          Afternoon Realignment
          {activeTab === 'afternoon' && (
            <motion.div layoutId="briefingTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-zinc-100" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('evening')}
          className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${
            activeTab === 'evening' 
              ? 'text-gray-900 dark:text-white font-semibold' 
              : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          Evening Reflection
          {activeTab === 'evening' && (
            <motion.div layoutId="briefingTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-zinc-100" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('gmail')}
          className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'gmail' 
              ? 'text-gray-900 dark:text-white font-semibold' 
              : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4 text-accent" />
          Gmail Inbox Intel
          {activeTab === 'gmail' && (
            <motion.div layoutId="briefingTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-zinc-100" />
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-gray-100 dark:border-zinc-800 animate-pulse" />
            <RefreshCw className="absolute inset-0 m-auto w-6 h-6 text-gray-500 dark:text-zinc-400 animate-spin" />
          </div>
          <p className="text-xs text-gray-400 font-mono tracking-wider animate-pulse">GENERATING HIGH-FIDELITY BRIEFING...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Greeting Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-xs relative overflow-hidden"
            >
              {activeTab !== 'gmail' && (
                <div className="absolute top-0 right-0 p-4">
                  <button
                    onClick={handleSpeak}
                    className={`p-2.5 rounded-full transition-all border ${
                      isSpeaking 
                        ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400'
                        : 'bg-gray-50 border-gray-100 text-gray-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-750'
                    }`}
                    title={isSpeaking ? "Stop Voice Briefing" : "Read Briefing Aloud"}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              )}

              <div className="flex items-start gap-4 pr-12">
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                  {activeTab === 'gmail' ? <Mail className="w-5 h-5 text-accent" /> : <Compass className="w-5 h-5 text-gray-800 dark:text-zinc-100" />}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-md">
                      {activeTab} briefing
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      Personality: {userProfile?.personality || 'mentor'}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                    {activeTab === 'morning' ? 'Executive Morning Alignment' : activeTab === 'afternoon' ? 'Tactical Mid-day Realignment' : activeTab === 'evening' ? 'High-Performance Reflection' : 'Gmail Inbox Actionable Summary'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed font-sans italic">
                    "{activeTab === 'morning' ? briefingData?.greeting : activeTab === 'afternoon' ? afternoonData?.greeting : activeTab === 'evening' ? eveningData?.greeting : 'Inbox synchronization resolved. Reviewing incoming workspace communications.'}"
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Morning Briefing View */}
            {activeTab === 'morning' && briefingData && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Tactical Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
                    <div className="text-[10px] font-mono text-gray-400 uppercase">First Priority</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1 truncate">
                      {briefingData.suggestedFirstTask}
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
                    <div className="text-[10px] font-mono text-gray-400 uppercase">Workload</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                      {briefingData.estimatedWorkload}
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
                    <div className="text-[10px] font-mono text-gray-400 uppercase">Trajectory</div>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> High
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
                    <div className="text-[10px] font-mono text-gray-400 uppercase">Confidence</div>
                    <div className="text-sm font-semibold mt-1 text-gray-800 dark:text-zinc-200">
                      {briefingData.completionConfidence}
                    </div>
                  </div>
                </div>

                {/* Priorities Table */}
                <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Target Deliverables</h3>
                  <div className="space-y-3">
                    {briefingData.priorities?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-850 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-gray-300 dark:text-zinc-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</div>
                            <div className="text-[10px] font-mono text-gray-400">Deadline: {item.deadline}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm ${
                            item.urgency === 'critical' 
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                              : item.urgency === 'high'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {item.urgency}
                          </span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{item.probability}% Success</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Afternoon Progress Review View */}
            {activeTab === 'afternoon' && afternoonData && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Afternoon Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
                    <div className="text-[10px] font-mono text-gray-400 uppercase">Resolved Today</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {afternoonData.tasksCompleted} <span className="text-xs font-normal text-gray-400">tasks</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
                    <div className="text-[10px] font-mono text-gray-400 uppercase">Remaining Work</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mt-2 truncate">
                      {afternoonData.remainingWork}
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
                    <div className="text-[10px] font-mono text-gray-400 uppercase">Success Probability</div>
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {afternoonData.currentProbability}%
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Tactical Recommendations</h3>
                  <div className="space-y-3">
                    {afternoonData.recommendations?.map((rec: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-850 rounded-xl">
                        <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5" />
                        <span className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Focus Recommendation</h3>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed font-sans">
                    {afternoonData.focusSuggestions}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Evening Wrap-up View */}
            {activeTab === 'evening' && eveningData && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Evening Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase">Daily Score</div>
                      <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                        {eveningData.dailyExecutionScore} <span className="text-xs text-gray-400 font-normal">/ 100</span>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase">Closed Items</div>
                      <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                        {eveningData.completedTasks?.length || 0}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">What Went Right</h3>
                  <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
                    {eveningData.successSummary}
                  </p>
                </div>

                {eveningData.missedItems?.length > 0 && (
                  <div className="p-6 bg-rose-50/30 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-950/50 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400">Missed Deliverables</h3>
                    </div>
                    <ul className="list-disc pl-5 text-xs text-rose-700 dark:text-rose-350 space-y-1">
                      {eveningData.missedItems.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Set up Tomorrow for Success</h3>
                  <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed italic">
                    {eveningData.preparationForTomorrow}
                  </p>
                  <div className="pt-2">
                    <div className="text-[10px] font-mono text-gray-400 uppercase mb-2">Recommended Next Steps</div>
                    <div className="flex flex-wrap gap-2">
                      {eveningData.suggestedNextActions?.map((act: string, idx: number) => (
                        <span key={idx} className="text-[11px] font-sans font-medium px-3 py-1.5 bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 rounded-full">
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Gmail Executive Summary View */}
            {activeTab === 'gmail' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 animate-fade-in"
              >
                {gmailError === 'needs_auth' ? (
                  <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 rounded-3xl space-y-4 shadow-sm">
                    <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Gmail Inbox Integration Inactive</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-sans font-light">
                        Enable Gmail Read-Only Sync to allow DueNow's AI Chief of Staff to synthesize priority items, highlight crucial action items, and suggest workspace tasks directly.
                      </p>
                    </div>
                    <button
                      onClick={handleConnectGmail}
                      className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                    >
                      Connect Gmail Account
                    </button>
                  </div>
                ) : gmailError ? (
                  <div className="p-6 bg-rose-50/20 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/30 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-450">
                      <ShieldAlert className="w-5 h-5" />
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider">Synchronization Error</h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 font-sans font-light leading-relaxed">
                      DueNow failed to fetch recent inbox communications. {gmailError}
                    </p>
                    <button
                      onClick={fetchGmailSummary}
                      className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer hover:bg-rose-600"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : gmailData ? (
                  <div className="space-y-6">
                    {/* Synthesis Panel */}
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/15 dark:to-indigo-950/15 border border-blue-100 dark:border-blue-900/30 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">AI Chief of Staff Synthesis</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed font-sans font-light">
                        {gmailData.executiveSummary}
                      </p>
                    </div>

                    {/* Email List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Actionable Messages</h3>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 rounded-sm">
                          {gmailData.emails?.length || 0} communications analyzed
                        </span>
                      </div>

                      {gmailData.emails && gmailData.emails.length === 0 ? (
                        <p className="text-xs text-gray-400 py-8 text-center font-sans font-light bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl">
                          No recent emails found matching high-performance workspace context.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {gmailData.emails?.map((email: any) => (
                            <div key={email.id} className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-500/20 transition-all space-y-3 shadow-xs">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm ${
                                    email.urgency === 'critical'
                                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                                      : email.urgency === 'medium'
                                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                                  }`}>
                                    {email.urgency || 'low'} urgency
                                  </span>
                                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mt-1.5">{email.subject}</h4>
                                  <p className="text-[10px] font-mono text-gray-400">From: {email.from}</p>
                                </div>
                                {email.deadline && (
                                  <span className="text-[10px] font-mono text-rose-500 bg-rose-500/5 px-2 py-1 rounded-lg border border-rose-500/10 whitespace-nowrap">
                                    ⏳ {email.deadline}
                                  </span>
                                )}
                              </div>
                              <div className="p-3.5 bg-gray-50 dark:bg-zinc-850 rounded-xl">
                                <p className="text-xs text-gray-600 dark:text-zinc-300 font-sans leading-relaxed">
                                  {email.summary}
                                </p>
                              </div>
                              {email.suggestedTask && (
                                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="text-[11px] text-gray-500 dark:text-zinc-400 font-sans italic">
                                    💡 Suggested Task: {email.suggestedTask}
                                  </div>
                                  <button
                                    disabled={actionPendingId === email.id || email.isRegistered}
                                    onClick={() => handleAddSuggestedTask(email.suggestedTask, email.id)}
                                    className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all self-end sm:self-auto cursor-pointer ${
                                      email.isRegistered
                                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                                        : 'bg-accent text-white hover:bg-accent/90 shadow-sm'
                                    }`}
                                  >
                                    {actionPendingId === email.id ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : email.isRegistered ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <Plus className="w-3.5 h-3.5" />
                                    )}
                                    {email.isRegistered ? 'Registered' : 'Register Task'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                    <p className="text-xs text-gray-400 font-sans">Syncing and building secure Gmail Intelligence Digest...</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar Timeline / Schedule Column */}
          <div className="space-y-6">
            {/* Actionable Timeline / Today's Block Schedule */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-800/50 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Aligned Schedule</h3>
                </div>
                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 rounded-sm">
                  Active blocks
                </span>
              </div>

              <div className="relative pl-4 border-l border-gray-100 dark:border-zinc-800 space-y-6">
                {(activeTab === 'morning' ? briefingData?.schedule : [
                  { time: '01:00 PM', event: 'Task Execution Sprint', duration: 45 },
                  { time: '03:30 PM', event: 'Workspace health checkpoint', duration: 15 },
                  { time: '05:00 PM', event: 'Daily wrap-up review', duration: 30 }
                ])?.map((evt: any, i: number) => (
                  <div key={i} className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-zinc-600 border border-white dark:border-zinc-900" />
                    
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {evt.time} ({evt.duration}m)
                      </div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {evt.event}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Risk Monitor Box */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Threat & Risk Monitor</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed font-sans">
                {activeTab === 'morning' ? briefingData?.highestRisk : 'Operational parameters normal.'}
              </p>
              <div className="pt-2">
                <div className="text-[10px] font-mono text-gray-400 uppercase mb-2">Tactical Action</div>
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 rounded-lg text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                  {activeTab === 'morning' ? briefingData?.recommendation : 'Keep scanning workspaces to prevent drift.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
