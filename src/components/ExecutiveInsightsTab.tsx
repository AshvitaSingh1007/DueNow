import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  ArrowUpRight, 
  RotateCw, 
  Sliders 
} from 'lucide-react';
import { ExecutiveInsights } from '../types';

export const ExecutiveInsightsTab: React.FC = () => {
  const [insights, setInsights] = useState<ExecutiveInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'weekly' | 'goals'>('all');

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/executive-insights');
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (err) {
      console.error('Error fetching executive insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RotateCw className="w-8 h-8 text-accent animate-spin mx-auto" />
        <p className="text-ink-muted text-sm font-mono uppercase tracking-wider">Syncing Executive Metrics...</p>
      </div>
    );
  }

  // Safe defaults if insights aren't loaded or are partially seeded
  const weeklyProductivity = insights?.weeklyProductivity || [];
  const workspaceImprovements = insights?.workspaceImprovements || [];
  const executionTrends = insights?.executionTrends || [];
  const recommendationHistory = insights?.recommendationHistory || [];
  const goalProgress = insights?.goalProgress || [];
  const planningQualityScore = insights?.planningQualityScore || 85;
  const successProbabilityTrend = insights?.successProbabilityTrend || [];
  const aiConfidenceTrend = insights?.aiConfidenceTrend || [];

  return (
    <div id="executive-insights-tab" className="space-y-8 pb-16">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-ink">Executive Intelligence Insights</h2>
          <p className="text-ink-muted text-xs mt-1">Cross-module situational analysis, efficiency trends, and deep learning metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchInsights}
            className="p-2 border border-ink-faint rounded-lg bg-bg hover:bg-ink-faint text-ink-muted hover:text-ink cursor-pointer transition-all"
            title="Refresh analytics data"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <div className="flex items-center bg-ink-faint p-1 rounded-lg border border-ink-faint">
            {(['all', 'weekly', 'goals'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-all cursor-pointer ${
                  activeFilter === filter 
                    ? 'bg-bg text-ink shadow-sm' 
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        <div className="bg-bg/40 backdrop-blur border border-ink-faint p-5 rounded-2xl flex items-center gap-4 hover:border-accent/20 transition-all">
          <div className="p-3 bg-accent/10 rounded-xl text-accent">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-ink-muted font-mono uppercase tracking-widest">SUCCESS SUCCESS PROBABILITY</span>
            <span className="text-xl font-bold tracking-tight text-ink">93%</span>
            <span className="block text-[10px] text-emerald-500 font-bold mt-0.5">▲ +5% increase</span>
          </div>
        </div>

        <div className="bg-bg/40 backdrop-blur border border-ink-faint p-5 rounded-2xl flex items-center gap-4 hover:border-accent/20 transition-all">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-ink-muted font-mono uppercase tracking-widest">PLANNING INDEX</span>
            <span className="text-xl font-bold tracking-tight text-ink">{planningQualityScore}%</span>
            <span className="block text-[10px] text-ink-muted mt-0.5">Highly consistent buffers</span>
          </div>
        </div>

        <div className="bg-bg/40 backdrop-blur border border-ink-faint p-5 rounded-2xl flex items-center gap-4 hover:border-accent/20 transition-all">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-ink-muted font-mono uppercase tracking-widest">AI DECISION COUNT</span>
            <span className="text-xl font-bold tracking-tight text-ink">14</span>
            <span className="block text-[10px] text-emerald-500 font-bold mt-0.5">100% applied successfully</span>
          </div>
        </div>

        <div className="bg-bg/40 backdrop-blur border border-ink-faint p-5 rounded-2xl flex items-center gap-4 hover:border-accent/20 transition-all">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-ink-muted font-mono uppercase tracking-widest">PERSONALIZATION LEVEL</span>
            <span className="text-xl font-bold tracking-tight text-ink">Active</span>
            <span className="block text-[10px] text-ink-muted mt-0.5">Learns working buffers</span>
          </div>
        </div>

      </div>

      {/* Main visual reports layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly execution chart (Bento grid 1) */}
        {(activeFilter === 'all' || activeFilter === 'weekly') && (
          <div className="lg:col-span-8 bg-bg/40 backdrop-blur border border-ink-faint rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-ink">Weekly Performance Distribution</h3>
                <p className="text-[11px] text-ink-muted">Completed deliverables mapped against weekly productivity coefficient.</p>
              </div>
              <Activity className="w-4 h-4 text-accent" />
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-ink-faint">
              {weeklyProductivity.map((item, index) => {
                const heightPercent = `${Math.max(10, item.score)}%`;
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    
                    {/* Tooltip on hover */}
                    <div className="absolute top-0 opacity-0 group-hover:opacity-100 bg-bg-dark text-white border border-ink-faint text-[9px] font-mono px-2 py-1 rounded-md transition-all -translate-y-2 pointer-events-none z-10 whitespace-nowrap">
                      Productivity: {item.score}% | Completed: {item.completedCount}
                    </div>

                    {/* Bar background */}
                    <div className="w-full bg-ink-faint/30 rounded-t-lg h-full flex items-end overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: heightPercent }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-accent/40 to-accent group-hover:to-accent/80 transition-all flex items-center justify-center text-[10px] text-white font-bold"
                      >
                        {item.completedCount > 0 && (
                          <span className="mb-2">{item.completedCount}</span>
                        )}
                      </motion.div>
                    </div>

                    <span className="text-[10px] font-bold text-ink-muted mt-2.5 font-mono">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Confidence & Success Trend (Bento grid 2) */}
        {(activeFilter === 'all' || activeFilter === 'weekly') && (
          <div className="lg:col-span-4 bg-bg/40 backdrop-blur border border-ink-faint rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold tracking-tight text-ink">Co-Pilot Alignment Trend</h3>
              <p className="text-[11px] text-ink-muted">How AI reasoning confidence maps with actual performance milestones.</p>
            </div>

            {/* Sparkline simulation using SVG */}
            <div className="h-32 flex items-end justify-center relative py-2">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Confidence trend path */}
                <path 
                  d={`M 10 70 L 30 65 L 50 60 L 70 45 L 90 20`}
                  fill="none" 
                  stroke="rgba(99, 102, 241, 0.4)" 
                  strokeWidth="2" 
                />
                {/* Success Probability trend path */}
                <path 
                  d={`M 10 60 L 30 55 L 50 48 L 70 30 L 90 10`}
                  fill="none" 
                  stroke="#FF4D00" 
                  strokeWidth="2" 
                />
              </svg>
              <div className="absolute inset-0 flex justify-between px-2 pointer-events-none items-end">
                {successProbabilityTrend.map((t, idx) => (
                  <div key={t.date} className="text-center text-[9px] font-mono text-ink-muted">
                    <div className="font-bold text-accent">{t.probability}%</div>
                    <div>{t.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-ink-faint pt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  Success Probability
                </span>
                <span className="font-bold text-ink">Highly Stable (93%)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  AI Confidence Level
                </span>
                <span className="font-bold text-ink">Peak (95%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Goal analytics & Milestones progress (Bento grid 3) */}
        {(activeFilter === 'all' || activeFilter === 'goals') && (
          <div className="lg:col-span-6 bg-bg/40 backdrop-blur border border-ink-faint rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-ink">Goal Progress Tracking</h3>
                <p className="text-[11px] text-ink-muted">Completion levels of primary executive goals.</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-4">
              {goalProgress.map((g) => (
                <div key={g.title} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-ink truncate max-w-[70%]">{g.title}</span>
                    <span className="text-accent font-mono">{g.percentage}%</span>
                  </div>
                  <div className="w-full bg-ink-faint/50 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${g.percentage}%` }}
                      className="bg-accent h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspace Health progressions (Bento grid 4) */}
        {(activeFilter === 'all' || activeFilter === 'goals') && (
          <div className="lg:col-span-6 bg-bg/40 backdrop-blur border border-ink-faint rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-ink">Workspace Health Optimization Index</h3>
                <p className="text-[11px] text-ink-muted">Before and after scanning/polishing comparisons.</p>
              </div>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="space-y-4">
              {workspaceImprovements.map((w) => (
                <div key={w.name} className="flex items-center justify-between border-b border-ink-faint pb-3.5 last:border-0 last:pb-0">
                  <div className="max-w-[50%]">
                    <span className="text-xs font-bold text-ink truncate block">{w.name}</span>
                    <span className="text-[10px] text-ink-muted font-mono">Workspace Delta</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold font-mono">
                    <span className="text-ink-muted">{w.beforeScore}%</span>
                    <span className="text-ink-muted">➔</span>
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">+{w.afterScore - w.beforeScore}% Gain</span>
                    <span className="text-ink">{w.afterScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation History list (Bento grid 5) */}
        <div className="lg:col-span-12 bg-bg/40 backdrop-blur border border-ink-faint rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink-faint pb-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-ink">AI Decision & Recommendation Log</h3>
              <p className="text-[11px] text-ink-muted">Historical review of strategic recommendations and execution status.</p>
            </div>
            <Clock className="w-4 h-4 text-ink-muted" />
          </div>

          <div className="divide-y divide-ink-faint">
            {recommendationHistory.map((item, index) => (
              <div key={index} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <span className="block text-xs font-semibold text-ink">{item.action}</span>
                  <span className="block text-[10px] text-ink-muted">{item.impact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                    {item.status}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
