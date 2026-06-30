import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Target, 
  Activity, 
  Cpu, 
  Plus, 
  Calendar, 
  CheckSquare, 
  ChevronRight, 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  ToggleLeft, 
  ToggleRight,
  Database,
  ArrowRight
} from 'lucide-react';
import { Goal, AutomationRule, AIReasoningLog, Workspace } from '../types';

export const GoalsAutomationsTab: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [reasoningLogs, setReasoningLogs] = useState<AIReasoningLog[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // New goal form states
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [milestonesText, setMilestonesText] = useState('');
  const [risksText, setRisksText] = useState('');

  // active sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<'goals' | 'automations' | 'explainable_ai'>('goals');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationAlerts, setEvaluationAlerts] = useState<string[]>([]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [gRes, aRes, lRes, wRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/automations'),
        fetch('/api/ai/reasoning-logs'),
        fetch('/api/workspaces')
      ]);

      if (gRes.ok) setGoals(await gRes.json());
      if (aRes.ok) setAutomations(await aRes.json());
      if (lRes.ok) setReasoningLogs(await lRes.json());
      if (wRes.ok) setWorkspaces(await wRes.json());
    } catch (err) {
      console.error('Error fetching goals & automations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.goalId === goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones.map(m => {
      if (m.id === milestoneId) return { ...m, completed: !m.completed };
      return m;
    });

    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const completionPercentage = updatedMilestones.length > 0 
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : 0;

    const updatedGoal = {
      ...goal,
      milestones: updatedMilestones,
      completionPercentage,
      // Dynamic success probability boost
      successProbability: Math.min(100, goal.successProbability + 3)
    };

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGoal)
      });
      if (res.ok) {
        setGoals(prev => prev.map(g => g.goalId === goalId ? updatedGoal : g));
      }
    } catch (err) {
      console.error('Error toggling milestone:', err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newObjective) return;

    const milestonesList = milestonesText.split('\n')
      .filter(line => line.trim())
      .map((text, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        title: text.trim(),
        targetDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
        completed: false
      }));

    const risksList = risksText.split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());

    const newGoal: Partial<Goal> = {
      title: newTitle,
      objective: newObjective,
      targetDate: newTargetDate ? new Date(newTargetDate).getTime() : Date.now() + 14 * 24 * 60 * 60 * 1000,
      relatedWorkspaces: selectedWorkspace ? [selectedWorkspace] : [],
      milestones: milestonesList,
      currentRisks: risksList.length > 0 ? risksList : ['Timeline constraints'],
      completionPercentage: 0,
      successProbability: 85,
      executiveSummary: 'Goal established. Milestone schedule initialized.',
      status: 'active'
    };

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });
      if (res.ok) {
        const saved = await res.json();
        setGoals(prev => [saved, ...prev]);
        setShowCreateGoal(false);
        setNewTitle('');
        setNewObjective('');
        setNewTargetDate('');
        setSelectedWorkspace('');
        setMilestonesText('');
        setRisksText('');
      }
    } catch (err) {
      console.error('Error creating goal:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to retire this goal from active management?')) return;
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.goalId !== goalId));
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const handleToggleAutomation = async (rule: AutomationRule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setAutomations(prev => prev.map(a => a.id === rule.id ? updated : a));
      }
    } catch (err) {
      console.error('Error toggling automation rule:', err);
    }
  };

  const handleEvaluateAutomations = async () => {
    setEvaluating(true);
    setEvaluationAlerts([]);
    try {
      const res = await fetch('/api/automations/evaluate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setEvaluationAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error evaluating automations:', err);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto" />
        <p className="text-ink-muted text-sm font-mono uppercase tracking-wider">Syncing Tactical Core...</p>
      </div>
    );
  }

  return (
    <div id="goals-automations-tab" className="space-y-8 pb-16">
      
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-faint pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-ink">Goals, Rules & reasoning</h2>
          <p className="text-ink-muted text-xs mt-1">Configure strategic targets, set proactive threshold triggers, and trace AI decision-making.</p>
        </div>
        
        {/* Sub Navigation */}
        <div className="flex items-center gap-1.5 bg-ink-faint p-1 rounded-xl border border-ink-faint">
          <button
            onClick={() => setActiveSubTab('goals')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'goals' ? 'bg-bg text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Goals
          </button>
          <button
            onClick={() => setActiveSubTab('automations')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'automations' ? 'bg-bg text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Automations
          </button>
          <button
            onClick={() => setActiveSubTab('explainable_ai')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'explainable_ai' ? 'bg-bg text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Explainable AI
          </button>
        </div>
      </div>

      {/* SUB TAB: GOALS */}
      {activeSubTab === 'goals' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-mono">Managed Objectives</h3>
            <button
              onClick={() => setShowCreateGoal(!showCreateGoal)}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Establish Goal
            </button>
          </div>

          {/* Goal creation form */}
          {showCreateGoal && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateGoal}
              className="bg-bg/40 backdrop-blur border border-accent/20 p-6 rounded-2xl space-y-4 max-w-2xl"
            >
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider font-mono">Establish Strategic Target</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-muted uppercase">Goal Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Hackathon Final Delivery"
                    className="w-full bg-ink-faint border border-ink-faint rounded-xl px-4 py-2.5 text-xs text-ink focus:border-accent/40 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-muted uppercase">Target Date</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full bg-ink-faint border border-ink-faint rounded-xl px-4 py-2.5 text-xs text-ink focus:border-accent/40 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-muted uppercase">Objective Summary</label>
                <textarea
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="What constitutes a full, outstanding success?"
                  rows={2}
                  className="w-full bg-ink-faint border border-ink-faint rounded-xl px-4 py-2.5 text-xs text-ink focus:border-accent/40 outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-muted uppercase">Relate to Workspace</label>
                  <select
                    value={selectedWorkspace}
                    onChange={(e) => setSelectedWorkspace(e.target.value)}
                    className="w-full bg-ink-faint border border-ink-faint rounded-xl px-4 py-2.5 text-xs text-ink focus:border-accent/40 outline-none"
                  >
                    <option value="">Select Workspace (None)</option>
                    {workspaces.map(w => (
                      <option key={w.workspaceId} value={w.workspaceId}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-muted uppercase">Initial Milestones (One per line)</label>
                  <textarea
                    value={milestonesText}
                    onChange={(e) => setMilestonesText(e.target.value)}
                    placeholder="Refine interface slides&#10;Write final schemas"
                    rows={2}
                    className="w-full bg-ink-faint border border-ink-faint rounded-xl px-4 py-2.5 text-xs text-ink focus:border-accent/40 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-muted uppercase">Perceived Risks (One per line)</label>
                <textarea
                  value={risksText}
                  onChange={(e) => setRisksText(e.target.value)}
                  placeholder="Slow API response times&#10;Inconsistent token margins"
                  rows={2}
                  className="w-full bg-ink-faint border border-ink-faint rounded-xl px-4 py-2.5 text-xs text-ink focus:border-accent/40 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGoal(false)}
                  className="px-4 py-2 bg-ink-faint hover:bg-ink-faint/80 text-ink rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent hover:bg-accent/95 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Establish
                </button>
              </div>
            </motion.form>
          )}

          {/* Goals grid list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {goals.map((goal) => (
              <div 
                key={goal.goalId} 
                className="bg-bg/40 backdrop-blur border border-ink-faint p-6 rounded-2xl flex flex-col justify-between hover:border-accent/10 transition-all space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm tracking-tight text-ink flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent shrink-0" />
                        {goal.title}
                      </h4>
                      <p className="text-[11px] text-ink-muted">{goal.objective}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteGoal(goal.goalId)}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg text-ink-muted hover:text-rose-500 transition-colors cursor-pointer"
                      title="Archive objective"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stats chips */}
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold">
                      Success Prob: {goal.successProbability}%
                    </span>
                    <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-bold">
                      Progress: {goal.completionPercentage}%
                    </span>
                    <span className="text-ink-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-2 border-t border-ink-faint pt-3">
                    <span className="block text-[10px] text-ink-muted uppercase font-bold tracking-wider">Milestones checklist</span>
                    <div className="space-y-1.5">
                      {goal.milestones?.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => handleToggleMilestone(goal.goalId, m.id)}
                            className="focus:outline-none cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={m.completed}
                              onChange={() => {}} // handled by click
                              className="w-3.5 h-3.5 rounded accent-accent border-ink-faint focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                          </button>
                          <span className={`text-xs ${m.completed ? 'line-through text-ink-muted' : 'text-ink font-medium'}`}>
                            {m.title}
                          </span>
                        </div>
                      ))}
                      {(!goal.milestones || goal.milestones.length === 0) && (
                        <span className="text-[11px] text-ink-muted italic block">No active milestones declared.</span>
                      )}
                    </div>
                  </div>

                  {/* Risks & Obstacles */}
                  <div className="space-y-1">
                    <span className="block text-[10px] text-ink-muted uppercase font-bold tracking-wider">Active Risks</span>
                    <div className="space-y-1">
                      {goal.currentRisks?.map((risk, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10">
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-ink-faint pt-3 text-xs bg-accent/5 p-3 rounded-xl border border-accent/10">
                  <span className="block text-[10px] text-accent uppercase font-mono font-bold tracking-widest mb-1">Executive Summary</span>
                  <p className="text-[11px] text-ink italic leading-relaxed">"{goal.executiveSummary}"</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUB TAB: AUTOMATIONS */}
      {activeSubTab === 'automations' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-mono">Executive Automation Rules</h3>
              <p className="text-ink-muted text-xs">Configure transparent thresholds and automated co-pilot workflows.</p>
            </div>
            <button
              onClick={handleEvaluateAutomations}
              disabled={evaluating}
              className="px-4 py-2.5 bg-ink-faint hover:bg-ink-faint/80 text-ink rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 cursor-pointer border border-ink-faint disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
              {evaluating ? 'Scanning systems...' : 'Scan & Evaluate Rules'}
            </button>
          </div>

          {/* Trigger Alert responses */}
          {evaluationAlerts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-accent/5 border border-accent/20 rounded-2xl space-y-3"
            >
              <div className="flex items-center gap-2 text-accent font-semibold text-xs font-mono uppercase tracking-widest">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Active Executive Automations Triggered
              </div>
              <ul className="space-y-2 text-xs">
                {evaluationAlerts.map((alert, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-ink py-1 border-b border-ink-faint last:border-0 last:pb-0">
                    <span className="text-accent">➔</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Rule configurations list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {automations.map((rule) => (
              <div 
                key={rule.id} 
                className={`bg-bg/40 backdrop-blur border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  rule.enabled ? 'border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'border-ink-faint opacity-70'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-xs tracking-tight text-ink uppercase tracking-wide font-mono">{rule.name}</h4>
                    <button 
                      onClick={() => handleToggleAutomation(rule)}
                      className="cursor-pointer"
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-7 h-7 text-accent" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-ink-muted" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-muted">{rule.actionDescription}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono border-t border-ink-faint pt-3">
                  <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                    Condition: {rule.triggerCondition}
                  </span>
                  <span className="text-ink-muted">
                    Last evaluated: {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUB TAB: EXPLAINABLE AI */}
      {activeSubTab === 'explainable_ai' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-mono">Co-Pilot Decision Trace Log</h3>
            <p className="text-ink-muted text-xs">Verify the calculations, contexts retrieved, and expected success probability differentials for every decision.</p>
          </div>

          <div className="space-y-5">
            {reasoningLogs.map((log) => (
              <div key={log.decisionId} className="bg-bg/40 backdrop-blur border border-ink-faint p-6 rounded-2xl space-y-5">
                
                {/* Header info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-ink-faint pb-4 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-ink-muted uppercase tracking-widest block">DECISION ID: {log.decisionId}</span>
                    <h4 className="font-bold text-sm tracking-tight text-ink flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-accent" />
                      Request: "{log.request}"
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold font-mono">
                    <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      Confidence: {log.confidenceScore}%
                    </span>
                    <span className="text-ink-muted">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Unified cross-module context analysis steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-ink-faint/30 p-4 rounded-xl border border-ink-faint space-y-2">
                    <span className="text-[9px] font-mono text-ink-muted uppercase tracking-widest block">1. GATHERED CROSS-MODULE CONTEXT</span>
                    <ul className="space-y-1 text-xs">
                      {log.gatheredContext?.map((ctx, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-ink-muted">
                          <span className="text-accent font-bold">✔</span>
                          <span>{ctx}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-ink-faint/30 p-4 rounded-xl border border-ink-faint space-y-2">
                    <span className="text-[9px] font-mono text-ink-muted uppercase tracking-widest block">2. SITUATION & TIMELINE ANALYSIS</span>
                    <p className="text-xs text-ink-muted">{log.deadlineAnalysis}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-ink-faint/30 p-4 rounded-xl border border-ink-faint space-y-2">
                    <span className="text-[9px] font-mono text-ink-muted uppercase tracking-widest block">3. WORKSPACE INTEGRATION STATUS</span>
                    <p className="text-xs text-ink-muted">{log.calendarAnalysis}</p>
                  </div>

                  <div className="bg-ink-faint/30 p-4 rounded-xl border border-ink-faint space-y-2">
                    <span className="text-[9px] font-mono text-ink-muted uppercase tracking-widest block">4. SUCCESS PROBABILITY™ COEFFICIENT IMPACT</span>
                    <p className="text-xs text-ink-muted">{log.successProbabilityImpact}</p>
                  </div>
                </div>

                {/* Ultimate Decision output */}
                <div className="bg-accent/5 p-4 rounded-xl border border-accent/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-accent uppercase tracking-widest font-bold">5. EXECUTIVE RECOMMENDATION & TRADEOFFS</span>
                    <span className="text-[10px] font-bold text-accent">Preferred Path</span>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-xs font-bold text-ink block">Preferred Option: {log.preferredOption}</span>
                      <p className="text-xs text-ink italic leading-relaxed">"{log.explanation}"</p>
                    </div>
                    <div className="space-y-1 border-t md:border-t-0 md:border-l border-ink-faint pt-2.5 md:pt-0 md:pl-4 shrink-0 text-xs">
                      <span className="text-[10px] font-mono text-ink-muted uppercase block tracking-wider font-bold">Alternative paths considered:</span>
                      {log.alternativeOptions?.map((alt, idx) => (
                        <span key={idx} className="block text-[11px] text-ink-muted font-medium mt-0.5">• {alt}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ))}

            {reasoningLogs.length === 0 && (
              <div className="text-center py-10 border border-dashed border-ink-faint rounded-2xl bg-bg/40">
                <Cpu className="w-8 h-8 text-ink-muted animate-pulse mx-auto mb-2" />
                <p className="text-xs text-ink-muted">No decision logs generated yet. Engage with AI Chat to trigger trace events.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
