import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Award, CheckCircle2, Star, Clock, 
  BookOpen, Calendar, HelpCircle, Activity, Sparkles, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ExecutionAnalytics: React.FC = () => {
  const { currentUser } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/metrics', {
        headers: { 'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}` }
      });
      const data = await res.json();
      setMetrics(data.executionScore || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const achievementsList = [
    { name: 'Perfect Planner', desc: 'Maintain scheduling accuracy above 85%', key: 'Perfect Planner', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { name: 'Deep Focus', desc: 'Lock in at least 1 focus block successfully', key: 'Deep Focus', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
    { name: 'Deadline Hero', desc: 'Achieve 100% deadlines completed on-time', key: 'Deadline Hero', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { name: 'Workspace Master', desc: 'Secure Workspace Health above 90%', key: 'Workspace Master', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { name: 'Execution Champion', desc: 'Complete 3 or more deliverables in a single day', key: 'Execution Champion', color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Activity className="w-8 h-8 text-gray-400 dark:text-zinc-600 animate-pulse" />
        <p className="text-[10px] font-mono tracking-wider uppercase text-gray-400 animate-pulse">COMPUTING METRIC SHELF...</p>
      </div>
    );
  }

  const score = metrics?.score ?? 78;

  return (
    <div id="analytics-shelf-container" className="max-w-5xl mx-auto space-y-6 p-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Performance Dial & Score Breakdowns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Dial & Trend Card */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center shadow-xs">
            
            {/* Left Circular Gauge */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="70" className="stroke-gray-100 dark:stroke-zinc-850 fill-none" strokeWidth="8" />
                  <motion.circle 
                    cx="80" cy="80" r="70" 
                    className="stroke-gray-900 dark:stroke-zinc-100 fill-none" 
                    strokeWidth="8" 
                    strokeDasharray="440"
                    initial={{ strokeDashoffset: 440 }}
                    animate={{ strokeDashoffset: 440 - (440 * score) / 100 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </svg>
                <div>
                  <div className="text-3xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                    {score}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">Execution™</div>
                </div>
              </div>
              <p className="text-[10px] font-mono text-gray-400 uppercase">Score generated from 7 key variables</p>
            </div>

            {/* Right Quick Summary */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase">Monthly Trend</span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <TrendingUp className="w-5 h-5" /> {metrics?.monthlyTrend || '+18% increase'}
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                Your execution accuracy is outstanding. Your preparation consistency is at an all-time high, maintaining maximum protection against workspace drift.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-mono bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-sm">
                  Confidence: HIGH
                </span>
                <span className="text-[10px] font-mono bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-sm">
                  Active streak: 4 DAYS
                </span>
              </div>
            </div>
          </div>

          {/* Subscore breakdowns */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">High-Fidelity Parameter Breakdowns</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Planning Accuracy */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-850 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Planning Accuracy</span>
                  <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">{metrics?.planningAccuracy || 90}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gray-900 dark:bg-zinc-100 h-full rounded-full" style={{ width: `${metrics?.planningAccuracy || 90}%` }} />
                </div>
              </div>

              {/* Focus Sessions */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-850 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Focus Session Target</span>
                  <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">{(metrics?.focusSessions ?? 0) >= 1 ? '100%' : '0%'} ({metrics?.focusSessions ?? 0} blocks)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gray-900 dark:bg-zinc-100 h-full rounded-full" style={{ width: `${(metrics?.focusSessions ?? 0) >= 1 ? 100 : 0}%` }} />
                </div>
              </div>

              {/* Workspace Improvements */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-850 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Workspace Improvements</span>
                  <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">{metrics?.workspaceImprovements || 78}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gray-900 dark:bg-zinc-100 h-full rounded-full" style={{ width: `${metrics?.workspaceImprovements || 78}%` }} />
                </div>
              </div>

              {/* Documentation */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-850 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Documentation Completeness</span>
                  <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">{metrics?.documentation || 85}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gray-900 dark:bg-zinc-100 h-full rounded-full" style={{ width: `${metrics?.documentation || 85}%` }} />
                </div>
              </div>

              {/* Consistency */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-850 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Task Consistency</span>
                  <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">{metrics?.consistency || 80}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gray-900 dark:bg-zinc-100 h-full rounded-full" style={{ width: `${metrics?.consistency || 80}%` }} />
                </div>
              </div>

              {/* Preparation */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-850 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Preparation Accuracy</span>
                  <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">{metrics?.preparation || 90}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gray-900 dark:bg-zinc-100 h-full rounded-full" style={{ width: `${metrics?.preparation || 90}%` }} />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Achievements Column */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800 pb-3">
              <Award className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">Achievements Shelf</h3>
            </div>

            <div className="space-y-4">
              {achievementsList.map((badge, idx) => {
                const isUnlocked = metrics?.achievements?.includes(badge.key) || false;

                return (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition-all ${
                      isUnlocked 
                        ? 'bg-white border-gray-100 dark:bg-zinc-900 dark:border-zinc-800' 
                        : 'bg-gray-50/50 border-gray-100/50 dark:bg-zinc-900/50 dark:border-zinc-800/40 opacity-40'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg shrink-0 ${isUnlocked ? badge.color : 'bg-gray-100 text-gray-400 dark:bg-zinc-800'}`}>
                      <Star className={`w-4 h-4 ${isUnlocked ? 'fill-current' : ''}`} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {badge.name}
                        </span>
                        {isUnlocked && (
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/25 px-1.5 py-0.5 rounded-sm">
                            unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-normal line-clamp-2">
                        {badge.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
