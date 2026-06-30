import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  Calendar, 
  Clock, 
  Tag, 
  Folder, 
  Sparkles, 
  AlertCircle, 
  TrendingUp, 
  ChevronRight, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  FileDown,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Task, Workspace } from '../types';

export const TaskSection: React.FC = () => {
  const { userId } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter conditions
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('all');

  // Form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskStatus, setTaskStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [taskDuration, setTaskDuration] = useState(45); // estimated minutes
  const [taskDeadline, setTaskDeadline] = useState(''); // formatted datetime
  const [taskWorkspace, setTaskWorkspace] = useState('ws_01');

  // Selected Task for AI recommendations panel
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch lists
  const fetchTasksAndWorkspaces = async () => {
    setLoading(true);
    try {
      // Workspaces first
      const wsResp = await fetch('/api/workspaces', { headers: { 'Authorization': `Bearer ${userId}` } });
      const wsData = await wsResp.json();
      setWorkspaces(wsData.workspaces || []);

      // Tasks next
      const tResp = await fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${userId}` } });
      const tData = await tResp.json();
      setTasks(tData.tasks || []);
      if (tData.tasks && tData.tasks.length > 0) {
        setSelectedTaskId(tData.tasks[0].taskId);
      }
    } catch (e) {
      console.warn('Network endpoints fallback loaded locally');
      // local mock presets
      const mockTasks: Task[] = [
        {
          taskId: 'task_01',
          title: 'Review presentation structure draft',
          description: 'Refactor slides layout to align with Silicon Valley hackathon review priorities.',
          deadline: Date.now() + 12 * 3600 * 1000,
          status: 'pending',
          priority: 'high',
          estimatedDuration: 45,
          workspaceId: 'ws_01',
          successProbability: { current: 85, factors: [], recommendations: [] },
          createdAt: Date.now(),
          completedAt: null
        },
        {
          taskId: 'task_02',
          title: 'Complete Drizzle Schema parameters',
          description: 'Establish secure foreign keys and indices inside sql migrations files.',
          deadline: Date.now() + 24 * 3600 * 1000,
          status: 'in_progress',
          priority: 'medium',
          estimatedDuration: 90,
          workspaceId: 'ws_02',
          successProbability: { current: 70, factors: [], recommendations: [] },
          createdAt: Date.now(),
          completedAt: null
        }
      ];
      setTasks(mockTasks);
      setSelectedTaskId('task_01');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndWorkspaces();
  }, [userId]);

  // Form handle create/update
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const parsedDeadline = taskDeadline ? new Date(taskDeadline).getTime() : Date.now() + 24 * 3600 * 1000;

    const payload: Partial<Task> = {
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      status: taskStatus,
      estimatedDuration: taskDuration,
      deadline: parsedDeadline,
      workspaceId: taskWorkspace,
      successProbability: {
        current: taskPriority === 'high' ? 65 : 85,
        factors: [{ name: 'Priority Index', score: 80, weight: 1 }],
        recommendations: [{ action: 'Complete workspace deliverables', expectedImprovement: 10 }]
      }
    };

    try {
      if (editingTask) {
        // Update
        const resp = await fetch(`/api/tasks/${editingTask.taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userId}` },
          body: JSON.stringify(payload)
        });
        const updated = await resp.json();
        setTasks((prev) => prev.map((t) => t.taskId === editingTask.taskId ? { ...t, ...payload } as Task : t));
      } else {
        // Create
        const resp = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userId}` },
          body: JSON.stringify(payload)
        });
        const created = await resp.json();
        setTasks((prev) => [{ ...payload, taskId: created.taskId, createdAt: Date.now() } as Task, ...prev]);
        setSelectedTaskId(created.taskId);
      }
      
      setShowFormModal(false);
      clearForm();
    } catch (err) {
      console.error('Error saving task:', err);
      // Client-side fallback
      const mockId = editingTask ? editingTask.taskId : `task_local_${Date.now()}`;
      const fallbackTask = { ...payload, taskId: mockId, createdAt: Date.now() } as Task;
      if (editingTask) {
        setTasks((prev) => prev.map((t) => t.taskId === mockId ? fallbackTask : t));
      } else {
        setTasks((prev) => [fallbackTask, ...prev]);
        setSelectedTaskId(mockId);
      }
      setShowFormModal(false);
      clearForm();
    }
  };

  // Open creation
  const handleOpenCreate = () => {
    setEditingTask(null);
    clearForm();
    setShowFormModal(true);
  };

  // Open edit
  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskDuration(task.estimatedDuration);
    setTaskDeadline(new Date(task.deadline).toISOString().slice(0, 16));
    setTaskWorkspace(task.workspaceId);
    setShowFormModal(true);
  };

  // Toggle complete state
  const handleToggleComplete = async (task: Task) => {
    const isCompleted = task.status === 'completed';
    const nextStatus = isCompleted ? 'pending' : 'completed';
    
    try {
      if (nextStatus === 'completed') {
        await fetch(`/api/tasks/${task.taskId}/complete`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${userId}` }
        });
      } else {
        await fetch(`/api/tasks/${task.taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userId}` },
          body: JSON.stringify({ status: 'pending', completedAt: null })
        });
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === task.taskId
            ? { ...t, status: nextStatus, completedAt: nextStatus === 'completed' ? Date.now() : null }
            : t
        )
      );
    } catch (err) {
      console.error('Error toggling task complete:', err);
      // Local updates fallback
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === task.taskId
            ? { ...t, status: nextStatus, completedAt: nextStatus === 'completed' ? Date.now() : null }
            : t
        )
      );
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
    }
  };

  const clearForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskStatus('pending');
    setTaskDuration(45);
    setTaskDeadline(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
    if (workspaces.length > 0) {
      setTaskWorkspace(workspaces[0].workspaceId);
    }
  };

  // Selected task detail helper
  const activeTask = tasks.find((t) => t.taskId === selectedTaskId) || tasks[0];

  // AI Assistant recommendations rules based on task characteristics
  const getAIRecommendations = (task: Task | undefined) => {
    if (!task) return { duration: '30m', priority: 'medium', prep: 'Review core specifications files.' };
    const deadlineHours = Math.max(1, Math.round((task.deadline - Date.now()) / (3600 * 1000)));
    
    let recDuration = task.estimatedDuration;
    let recPriority = task.priority;
    let suggestions = 'Coordinate layout alignment and review folder structures.';

    if (task.title.toLowerCase().includes('presentation') || task.title.toLowerCase().includes('slides')) {
      recDuration = 60;
      recPriority = 'high';
      suggestions = 'Outline slide templates, verify visual consistency, and ensure submission files are loaded.';
    } else if (task.title.toLowerCase().includes('schema') || task.title.toLowerCase().includes('database') || task.title.toLowerCase().includes('code')) {
      recDuration = 90;
      recPriority = 'high';
      suggestions = 'Check database indexes, verify drizzle schemas build cleanly, and inspect missing foreign keys.';
    } else if (deadlineHours < 12) {
      recPriority = 'high';
      suggestions = 'Target high priority margins first! Verify documentation completeness immediately.';
    }

    return {
      duration: `${recDuration} mins`,
      priority: recPriority,
      prep: suggestions,
      deadlineAdvice: deadlineHours < 24 ? `Task deadline is in ${deadlineHours} hours. Execute with priority!` : `Deadlines is relaxed (${deadlineHours}h margin). Keep pacing fluid.`
    };
  };

  // Filters logic
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (activeWorkspaceId !== 'all' && task.workspaceId !== activeWorkspaceId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-display font-extrabold tracking-tight text-ink flex items-center gap-2">
            <TrendingUp className="w-5.5 h-5.5 text-accent" />
            Task Management Hub
          </h2>
          <p className="text-ink-muted text-xs font-light font-sans">
            Create, track, and audit executive tasks with smart suggestions from our NLP assistant.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4.5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Task
        </button>
      </div>

      {/* FILTER BUTTONS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-ink-faint rounded-3xl border border-ink-faint shadow-inner">
        <div className="flex flex-wrap gap-2.5">
          {/* Status filtering */}
          <div className="flex bg-bg/60 p-1 border border-ink-faint rounded-2xl">
            {['all', 'pending', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Priority filtering */}
          <div className="flex bg-bg/60 p-1 border border-ink-faint rounded-2xl">
            {['all', 'low', 'medium', 'high'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  priorityFilter === p
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Mapped select list filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest font-bold">
            Workspace:
          </span>
          <select
            value={activeWorkspaceId}
            onChange={(e) => setActiveWorkspaceId(e.target.value)}
            className="px-3.5 py-1.5 bg-bg border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none"
          >
            <option value="all">All Workspaces</option>
            {workspaces.map((ws) => (
              <option key={ws.workspaceId} value={ws.workspaceId}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-accent animate-spin" />
          <p className="text-ink-muted text-xs font-mono uppercase tracking-wider">Synchronizing Active Tasks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Mapped task list */}
          <div className="lg:col-span-8 space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="p-12 border border-dashed border-ink-faint bg-ink-faint rounded-3xl text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-ink-muted/50 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-ink">Workspace Clear</h4>
                  <p className="text-[10px] text-ink-muted max-w-xs mx-auto font-sans font-light">
                    No tasks found matching filter settings. Complete milestones or create new targets.
                  </p>
                </div>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isSelected = selectedTaskId === task.taskId;
                const isCompleted = task.status === 'completed';
                const workspaceName = workspaces.find((w) => w.workspaceId === task.workspaceId)?.name || 'Default';

                return (
                  <div
                    key={task.taskId}
                    onClick={() => setSelectedTaskId(task.taskId)}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer relative group ${
                      isSelected 
                        ? 'bg-accent/5 border-accent' 
                        : 'bg-ink-faint border-ink-faint hover:border-accent/30 hover:bg-ink-faint/80'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Interactive toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(task);
                        }}
                        className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center shrink-0 hover:scale-105 cursor-pointer transition-all ${
                          isCompleted 
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                            : 'border-ink-faint text-ink-muted hover:border-accent'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm ${
                            task.priority === 'high' 
                              ? 'bg-rose-500/10 text-rose-500' 
                              : task.priority === 'medium'
                              ? 'bg-accent/10 text-accent'
                              : 'bg-ink-faint text-ink-muted'
                          }`}>
                            {task.priority}
                          </span>
                          
                          <span className="text-[10px] font-mono text-ink-muted flex items-center gap-1">
                            <Folder className="w-3 h-3 text-ink-muted/60" />
                            {workspaceName}
                          </span>
                        </div>

                        <h4 className={`text-xs font-bold text-ink truncate ${isCompleted ? 'line-through opacity-60' : ''}`}>
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono text-[10px]">
                      <div className="text-right hidden sm:block">
                        <span className="text-ink-muted flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-accent" />
                          {task.estimatedDuration}m
                        </span>
                        <span className="text-ink-muted/60 text-[9px] block mt-0.5">
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(task);
                          }}
                          className="p-1.5 text-ink-muted hover:text-accent bg-bg border border-ink-faint hover:border-accent/20 rounded-lg cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.taskId);
                          }}
                          className="p-1.5 text-ink-muted hover:text-rose-500 bg-bg border border-ink-faint hover:border-rose-500/20 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <ChevronRight className="w-4 h-4 text-ink-muted/50" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT SIDEBAR: AI TASK ASSISTANT ADVICE */}
          <div className="lg:col-span-4">
            <div className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-6 shadow-sm h-full flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div className="absolute top-[-25%] right-[-25%] w-[180px] h-[180px] bg-accent/10 rounded-full blur-[45px] pointer-events-none" />

              <div className="space-y-4.5 relative z-10 w-full text-left">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block">
                    NLP TASK ADVISOR
                  </span>
                  <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-accent animate-pulse" />
                    AI Assistant Suggestions
                  </h3>
                  <p className="text-ink-muted text-xs font-light font-sans">
                    Context-aware suggestions to refine estimates, deadlines, and preparations.
                  </p>
                </div>

                {activeTask ? (
                  <div className="space-y-4 pt-4">
                    <div className="p-4 bg-ink-faint border border-ink-faint rounded-2xl space-y-3.5 font-sans">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider block">Target Task:</span>
                        <h4 className="text-xs font-bold text-ink">{activeTask.title}</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-ink-faint font-mono text-[10px]">
                        <div>
                          <span className="text-ink-muted block mb-0.5">Recommended Time:</span>
                          <span className="text-ink font-bold">{getAIRecommendations(activeTask).duration}</span>
                        </div>
                        <div>
                          <span className="text-ink-muted block mb-0.5">Recommended Priority:</span>
                          <span className="text-accent font-bold uppercase">{getAIRecommendations(activeTask).priority}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-left font-sans">
                      <span className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">Suggested Preparation:</span>
                      <p className="text-xs text-ink-muted font-light leading-relaxed">
                        {getAIRecommendations(activeTask).prep}
                      </p>
                    </div>

                    <div className="space-y-2 text-left font-sans border-t border-ink-faint pt-3.5">
                      <span className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">Deadline Metric:</span>
                      <p className="text-xs text-ink-muted font-light leading-relaxed">
                        {getAIRecommendations(activeTask).deadlineAdvice}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-12 text-ink-muted space-y-3">
                    <HelpCircle className="w-8 h-8 mx-auto opacity-60" />
                    <div>
                      <h4 className="text-xs font-bold text-ink">No Task Selected</h4>
                      <p className="text-[10px] text-ink-muted font-sans max-w-xs mx-auto">
                        Add a task or click on any task in the list to trigger NLP context analysis.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl flex items-start gap-3 text-left">
                <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="text-[10px] text-ink-muted font-light leading-normal font-sans">
                  DueNow provides suggestions, but keeps the executive in control. We do not automate modifications without explicit command clicks.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Task Creation/Editing Modal Dialog */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg border border-ink-faint p-6 rounded-3xl max-w-md w-full relative z-10 shadow-2xl space-y-5"
            >
              <div className="space-y-1 text-left">
                <h3 className="font-display font-extrabold text-lg text-ink">
                  {editingTask ? 'Refine Task parameters' : 'Establish New Task Node'}
                </h3>
                <p className="text-ink-muted text-xs font-light font-sans">
                  Refining targets aids success probability models.
                </p>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Code Review, Presentation prep..."
                    className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none focus:border-accent/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                    Description
                  </label>
                  <textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Provide detailed description parameters..."
                    rows={2.5}
                    className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Priority Index
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e: any) => setTaskPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Estimated Duration (Mins)
                    </label>
                    <input
                      type="number"
                      required
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(Number(e.target.value))}
                      placeholder="e.g. 45"
                      className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Task Deadline
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Target Workspace
                    </label>
                    <select
                      value={taskWorkspace}
                      onChange={(e) => setTaskWorkspace(e.target.value)}
                      className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none"
                    >
                      {workspaces.map((ws) => (
                        <option key={ws.workspaceId} value={ws.workspaceId}>
                          {ws.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="flex-1 py-3 border border-ink-faint text-ink-muted hover:text-ink rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold uppercase transition-all cursor-pointer shadow-lg"
                  >
                    Save Task
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
