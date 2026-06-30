import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, CheckCircle2, AlertCircle, Plus, Calendar, 
  Trash2, Sparkles, Volume2, Target, Send, Clock, BadgeAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ReminderCenter: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [reminderMessage, setReminderMessage] = useState('');
  const [associatedTaskId, setAssociatedTaskId] = useState('');
  const [reminderType, setReminderType] = useState<'motivational' | 'professional' | 'warning'>('professional');
  const [minutesFromNow, setMinutesFromNow] = useState('30');

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders', {
        headers: { 'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}` }
      });
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}` }
      });
      const data = await res.json();
      setTasks(data.tasks || []);
      if (data.tasks?.length > 0) {
        setAssociatedTaskId(data.tasks[0].taskId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReminders();
    fetchTasks();
  }, []);

  const handleSpeakReminder = (msg: string) => {
    const utterance = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis.speak(utterance);
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderMessage.trim()) return;

    setIsSubmitting(true);
    const scheduledTime = Date.now() + parseInt(minutesFromNow) * 60 * 1000;

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`
        },
        body: JSON.stringify({
          taskId: associatedTaskId,
          scheduledTime,
          reminderType,
          message: reminderMessage,
          sent: false,
          personality: userProfile?.personality || 'mentor'
        })
      });

      if (res.ok) {
        setReminderMessage('');
        fetchReminders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async (reminderId: string, message: string) => {
    try {
      const res = await fetch(`/api/reminders/${reminderId}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}` }
      });
      if (res.ok) {
        handleSpeakReminder(message);
        // Toggle acknowledge state in local array
        setReminders(prev => prev.map(rem => rem.reminderId === reminderId ? { ...rem, sent: true } : rem));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="reminders-center-container" className="max-w-5xl mx-auto space-y-6 p-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scheduled Reminders List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Scheduled Nudges</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 rounded-sm">
                Active Queue
              </span>
            </div>

            <div className="space-y-3.5">
              {reminders.length > 0 ? (
                reminders.map((rem: any) => (
                  <div 
                    key={rem.reminderId} 
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                      rem.sent 
                        ? 'bg-gray-50/50 border-gray-100/50 dark:bg-zinc-850/50 dark:border-zinc-800/50 opacity-70' 
                        : 'bg-white border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm ${
                          rem.reminderType === 'warning' 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                            : rem.reminderType === 'motivational'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                        }`}>
                          {rem.reminderType}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          Scheduled: {new Date(rem.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-zinc-200 leading-relaxed font-sans italic">
                        "{rem.message}"
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleSpeakReminder(rem.message)}
                        className="p-2 bg-gray-50 border border-gray-100 text-gray-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-750 transition-all"
                        title="Synthesize Speak"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      {!rem.sent && (
                        <button
                          onClick={() => handleAcknowledge(rem.reminderId, rem.message)}
                          className="p-2 bg-gray-900 border border-transparent text-white dark:bg-white dark:text-gray-900 rounded-lg text-xs font-semibold hover:opacity-90 transition-all"
                          title="Acknowledge & Play"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-6 h-6 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-[10px] font-mono text-gray-400 uppercase">NO REMINDERS SCHEDULED</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Reminder Panel */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800 pb-3">
              <Plus className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Create Nudge</h3>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Nudge Content</label>
                <textarea
                  placeholder="Type a supportive, personality-driven notification message..."
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl text-xs text-gray-800 dark:text-zinc-200 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Nudge Type</label>
                  <select
                    value={reminderType}
                    onChange={(e: any) => setReminderType(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 px-3 py-2 rounded-lg text-xs text-gray-800 dark:text-zinc-200 focus:outline-hidden"
                  >
                    <option value="professional">Professional</option>
                    <option value="motivational">Motivational</option>
                    <option value="warning">Warning Nudge</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Timing (mins)</label>
                  <select
                    value={minutesFromNow}
                    onChange={(e) => setMinutesFromNow(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 px-3 py-2 rounded-lg text-xs text-gray-800 dark:text-zinc-200 focus:outline-hidden"
                  >
                    <option value="5">In 5 mins</option>
                    <option value="15">In 15 mins</option>
                    <option value="30">In 30 mins</option>
                    <option value="60">In 1 hour</option>
                    <option value="120">In 2 hours</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Link Objective</label>
                <select
                  value={associatedTaskId}
                  onChange={(e) => setAssociatedTaskId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl text-xs text-gray-800 dark:text-zinc-200 focus:outline-hidden"
                >
                  {tasks.length > 0 ? (
                    tasks.map((t: any) => (
                      <option key={t.taskId} value={t.taskId}>
                        {t.title}
                      </option>
                    ))
                  ) : (
                    <option value="">General Delivery</option>
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Scheduling Nudge...' : 'Schedule Reminder'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
