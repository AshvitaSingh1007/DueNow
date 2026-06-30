import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  FileCode, 
  Sparkles, 
  Folder, 
  Compass, 
  ChevronRight, 
  HardDrive,
  Search,
  ArrowLeft,
  Upload,
  Clock,
  Sparkle,
  Layers,
  Tag,
  Sliders,
  Calendar,
  AlertTriangle,
  Activity,
  Info,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Workspace, WorkspaceFile, SubmissionReadiness, WorkspaceRecommendation } from '../types';

interface WorkspaceSectionProps {
  onScanComplete?: (newHealth: number) => void;
}

const EMOJI_OPTIONS = ['💼', '🔬', '🎓', '💻', '🎨', '📊', '🚀', '💡', '🔑', '🎯', '📢', '🌍'];

const COLOR_OPTIONS = [
  { value: 'from-indigo-600 to-violet-600', label: 'Indigo Fusion' },
  { value: 'from-emerald-600 to-teal-600', label: 'Emerald Mint' },
  { value: 'from-rose-600 to-orange-600', label: 'Sunset Glow' },
  { value: 'from-cyan-600 to-blue-600', label: 'Ocean Breeze' },
  { value: 'from-amber-600 to-red-600', label: 'Crimson Ember' },
  { value: 'from-slate-700 to-slate-800', label: 'Midnight Obsidian' }
];

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({ onScanComplete }) => {
  const { userId } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticSearching, setSemanticSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<any[] | null>(null);
  const [semanticAiText, setSemanticAiText] = useState<string>('');

  // Creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDescription, setNewWsDescription] = useState('');
  const [newWsType, setNewWsType] = useState<'hackathon' | 'interview' | 'college' | 'custom'>('hackathon');
  const [newWsIcon, setNewWsIcon] = useState('💼');
  const [newWsColor, setNewWsColor] = useState('from-indigo-600 to-violet-600');
  const [newWsPriority, setNewWsPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newWsDeadline, setNewWsDeadline] = useState(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [newWsTags, setNewWsTags] = useState('');

  // Upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Scanning states
  const [activeScanningId, setActiveScanningId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  // Detailed File viewer modal
  const [viewingFile, setViewingFile] = useState<WorkspaceFile | null>(null);

  // Fetch workspaces on mount or select change
  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workspaces', {
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      const data = await response.json();
      if (data.workspaces) {
        setWorkspaces(data.workspaces);
        if (selectedWorkspaceId) {
          const current = data.workspaces.find((w: Workspace) => w.workspaceId === selectedWorkspaceId);
          if (current) setSelectedWorkspace(current);
        }
      }
    } catch (e) {
      console.error('Error fetching workspaces:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [userId]);

  // Handle open workspace detail
  const handleOpenWorkspace = (ws: Workspace) => {
    setSelectedWorkspaceId(ws.workspaceId);
    setSelectedWorkspace(ws);
  };

  // Handle create workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    const parsedTags = newWsTags.split(',').map(t => t.trim()).filter(Boolean);
    const wsPayload: Partial<Workspace> = {
      name: newWsName,
      description: newWsDescription,
      projectSummary: newWsDescription,
      type: newWsType,
      icon: newWsIcon,
      color: newWsColor,
      priority: newWsPriority,
      deadline: new Date(newWsDeadline).getTime(),
      tags: parsedTags,
      status: 'active',
      progress: 0,
      health: 50,
      healthFactors: {
        documentation: 0,
        organization: 20,
        submissionFiles: 0,
        projectStructure: 10
      },
      files: []
    };

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify(wsPayload)
      });
      const created = await response.json();
      
      const newWs = {
        ...wsPayload,
        workspaceId: created.workspaceId
      } as Workspace;

      setWorkspaces(prev => [newWs, ...prev]);
      setShowCreateModal(false);
      // Reset inputs
      setNewWsName('');
      setNewWsDescription('');
      setNewWsIcon('💼');
      setNewWsColor('from-indigo-600 to-violet-600');
      setNewWsPriority('medium');
      setNewWsTags('');
    } catch (err) {
      console.error('Error creating workspace:', err);
    }
  };

  // Delete Workspace
  const handleDeleteWorkspace = async (wsId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workspace? All mapped file metadata will be permanently unlinked.')) return;
    try {
      await fetch(`/api/workspaces/${wsId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      setWorkspaces(prev => prev.filter(ws => ws.workspaceId !== wsId));
      if (selectedWorkspaceId === wsId) {
        setSelectedWorkspaceId(null);
        setSelectedWorkspace(null);
      }
    } catch (err) {
      console.error('Error deleting workspace:', err);
    }
  };

  // Real Workspace scanning
  const handleScanWorkspace = async (wsId: string) => {
    setActiveScanningId(wsId);
    setScanProgress(10);
    setScanLogs(['Initializing Workspace Intelligence scan...', 'Reading trusted workspace metadata...']);

    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 10;
      });
    }, 150);

    try {
      setScanLogs(prev => [...prev, 'Analyzing documentation nodes...', 'Running Submission Readiness™ calculations...']);
      const response = await fetch(`/api/workspaces/${wsId}/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      const updatedWs = await response.json();
      
      clearInterval(interval);
      setScanProgress(100);
      setScanLogs(prev => [...prev, 'AI Project Summary generated.', 'Integrity metrics resolved successfully!']);

      setTimeout(() => {
        setWorkspaces(prev => prev.map(w => w.workspaceId === wsId ? updatedWs : w));
        if (selectedWorkspaceId === wsId) {
          setSelectedWorkspace(updatedWs);
        }
        if (onScanComplete) {
          onScanComplete(updatedWs.health);
        }
        setActiveScanningId(null);
        setScanProgress(0);
      }, 500);

    } catch (err) {
      console.error('Workspace scan failed:', err);
      clearInterval(interval);
      setActiveScanningId(null);
    }
  };

  // Conversational Search query execution
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSemanticResults(null);
      return;
    }

    setSemanticSearching(true);
    try {
      const response = await fetch(`/api/ai/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      const data = await response.json();
      setSemanticResults(data.results || []);
      setSemanticAiText(data.aiResponse || '');
    } catch (err) {
      console.error('Semantic search failed:', err);
    } finally {
      setSemanticSearching(false);
    }
  };

  // File Upload Handlers
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const getCategoryFromExtension = (filename: string): 'code' | 'documentation' | 'presentation' | 'image' | 'data' | 'unknown' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'go', 'rs', 'html', 'css'].includes(ext || '')) return 'code';
    if (['pdf', 'docx', 'txt', 'md'].includes(ext || '')) return 'documentation';
    if (['pptx', 'ppt', 'key'].includes(ext || '')) return 'presentation';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return 'image';
    if (['json', 'csv', 'yaml', 'xml'].includes(ext || '')) return 'data';
    return 'unknown';
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedWorkspaceId) return;
    setUploadingFile(true);
    setUploadProgress(15);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setUploadProgress(40);
        const textContent = e.target?.result as string || '';
        
        const payload = {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          mimeType: file.type || 'text/plain',
          category: getCategoryFromExtension(file.name),
          content: textContent.substring(0, 8000) // keep reasonable chunks
        };

        setUploadProgress(70);
        const res = await fetch(`/api/workspaces/${selectedWorkspaceId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        setUploadProgress(100);
        setTimeout(() => {
          if (data.workspace) {
            setSelectedWorkspace(data.workspace);
            setWorkspaces(prev => prev.map(w => w.workspaceId === data.workspace.workspaceId ? data.workspace : w));
          }
          setUploadingFile(false);
          setUploadProgress(0);
        }, 300);
      };

      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.py') || file.name.endsWith('.js')) {
        reader.readAsText(file);
      } else {
        // Simple dummy reading for non-text formats like presentation/pdf
        setTimeout(() => {
          reader.dispatchEvent(new Event('load'));
        }, 500);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!selectedWorkspaceId) return;
    if (!confirm('Are you sure you want to remove this file from your workspace?')) return;

    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspaceId}/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      const updated = await res.json();
      setSelectedWorkspace(updated);
      setWorkspaces(prev => prev.map(w => w.workspaceId === updated.workspaceId ? updated : w));
    } catch (err) {
      console.error('File deletion failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header and Navigation */}
      <AnimatePresence mode="wait">
        {!selectedWorkspace ? (
          // WORKSPACES GRID LISTING VIEW
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Top Action Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-display font-extrabold tracking-tight text-ink flex items-center gap-2">
                  <FolderGit2 className="w-5.5 h-5.5 text-accent animate-pulse" />
                  Workspace Intelligence™
                </h2>
                <p className="text-ink-muted text-xs font-light font-sans">
                  Securely map, verify, and scan your Trusted Workspaces for peak performance and submission readiness.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4.5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  New Workspace
                </button>
              </div>
            </div>

            {/* Semantic AI Search Area */}
            <div className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-5 shadow-sm space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-ink-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask anything semantic: 'Find my latest resume', 'Where are the presentation files?', 'Show action items'..."
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none focus:border-accent/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={semanticSearching}
                  className="px-5 py-2.5 bg-accent/15 hover:bg-accent/25 text-accent rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {semanticSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Semantic Search
                </button>
              </form>

              {/* Semantic search results dropdown style */}
              {semanticResults !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-bg border border-ink-faint rounded-2xl space-y-3 text-left"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-ink-faint">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-accent" /> AI Semantic Analysis
                    </span>
                    <button 
                      onClick={() => { setSemanticResults(null); setSearchQuery(''); }}
                      className="text-xs text-ink-muted hover:text-ink font-medium"
                    >
                      Clear Results
                    </button>
                  </div>

                  {semanticAiText && (
                    <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl text-xs text-ink leading-relaxed">
                      {semanticAiText}
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-ink-muted uppercase tracking-wider block">Matching nodes found</span>
                    {semanticResults.length === 0 ? (
                      <p className="text-xs text-ink-muted font-sans py-2">No matching workspaces, documents, or tasks found.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {semanticResults.map((item, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              const found = workspaces.find(w => w.workspaceId === item.parentWorkspaceId || w.workspaceId === item.id);
                              if (found) handleOpenWorkspace(found);
                            }}
                            className="p-3 bg-ink-faint hover:bg-ink-faint/80 border border-ink-faint rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="space-y-1 min-w-0">
                              <span className="text-[8px] font-mono font-bold uppercase text-accent tracking-wider block">
                                {item.type}
                              </span>
                              <h4 className="text-xs font-bold text-ink truncate">{item.name}</h4>
                              <p className="text-[10px] text-ink-muted truncate font-sans">{item.explanation}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-xs font-bold text-accent">{item.confidence}%</span>
                              <span className="block text-[8px] font-mono text-ink-muted uppercase">Confidence</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* List/Grid of Workspaces */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto text-accent animate-spin" />
                <p className="text-ink-muted text-xs font-mono uppercase tracking-wider animate-pulse">Syncing trusted workspaces...</p>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="py-20 text-center space-y-4 border-2 border-dashed border-ink-faint rounded-3xl">
                <Folder className="w-12 h-12 text-ink-muted/50 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-base text-ink">No Trusted Workspaces</h3>
                  <p className="text-ink-muted text-xs max-w-sm mx-auto font-sans">
                    You have not established any workspaces yet. Build one to securely monitor and optimize your deliverable intelligence.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Create First Workspace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.map((ws) => {
                  const isScanning = activeScanningId === ws.workspaceId;
                  const deadlineDate = ws.deadline ? new Date(ws.deadline).toLocaleDateString() : 'No deadline';

                  return (
                    <motion.div
                      key={ws.workspaceId}
                      layoutId={`ws-card-${ws.workspaceId}`}
                      onClick={() => handleOpenWorkspace(ws)}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-5 shadow-sm hover:border-accent/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[280px] text-left cursor-pointer group"
                    >
                      {/* Decorative gradient glow */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-accent/5 pointer-events-none rounded-bl-full" />
                      
                      <div className="space-y-3 relative z-10">
                        {/* Header metadata */}
                        <div className="flex items-center justify-between">
                          <span className={`w-8 h-8 rounded-xl bg-gradient-to-r ${ws.color || 'from-indigo-600 to-violet-600'} text-white flex items-center justify-center text-sm shadow-md`}>
                            {ws.icon || '💼'}
                          </span>
                          
                          <div className="text-right shrink-0">
                            <span className="text-2xl font-display font-black text-accent block">
                              {ws.health || 0}%
                            </span>
                            <span className="text-[8px] font-mono text-ink-muted uppercase tracking-wider block">
                              Health Score
                            </span>
                          </div>
                        </div>

                        {/* Title and descriptions */}
                        <div className="space-y-1">
                          <h3 className="font-display font-extrabold text-base text-ink group-hover:text-accent transition-colors truncate">
                            {ws.name}
                          </h3>
                          <p className="text-ink-muted text-xs font-light font-sans line-clamp-2 leading-relaxed">
                            {ws.projectSummary || ws.description || 'No objective outlined yet.'}
                          </p>
                        </div>

                        {/* Tags */}
                        {ws.tags && ws.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {ws.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-ink-faint border border-ink-faint rounded-md text-[9px] font-mono text-ink-muted">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer bar */}
                      <div className="border-t border-ink-faint pt-3 mt-4 flex items-center justify-between text-[10px] font-mono text-ink-muted/80">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-accent" /> {deadlineDate}
                        </span>
                        <span className="flex items-center gap-1 text-ink hover:text-accent font-bold">
                          Manage Workspace <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          // WORKSPACE INTELLIGENCE PANEL (DETAILED VIEW)
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Nav and Actions Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-faint pb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedWorkspaceId(null); setSelectedWorkspace(null); }}
                  className="p-2.5 text-ink hover:text-accent hover:bg-accent/10 border border-ink-faint rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl">{selectedWorkspace.icon}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono uppercase tracking-wider text-white bg-gradient-to-r ${selectedWorkspace.color || 'from-indigo-600 to-violet-600'}`}>
                      {selectedWorkspace.type}
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">
                      Priority: {selectedWorkspace.priority || 'medium'}
                    </span>
                  </div>
                  <h2 className="text-xl font-display font-extrabold text-ink tracking-tight truncate max-w-xl">
                    {selectedWorkspace.name}
                  </h2>
                </div>
              </div>

              <div className="flex gap-2 self-start md:self-auto">
                <button
                  onClick={() => handleDeleteWorkspace(selectedWorkspace.workspaceId)}
                  className="p-2.5 text-ink-muted hover:text-rose-500 border border-ink-faint hover:border-rose-500/20 rounded-xl transition-all cursor-pointer bg-bg"
                  title="Delete Workspace"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleScanWorkspace(selectedWorkspace.workspaceId)}
                  disabled={activeScanningId === selectedWorkspace.workspaceId}
                  className="px-4 py-2.5 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:bg-accent/90 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${activeScanningId === selectedWorkspace.workspaceId ? 'animate-spin' : ''}`} />
                  {activeScanningId === selectedWorkspace.workspaceId ? 'Deep Scanning...' : 'Run Intelligence Scan'}
                </button>
              </div>
            </div>

            {/* Scan progress animation banner */}
            {activeScanningId === selectedWorkspace.workspaceId && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-5 bg-accent/5 border border-accent/15 rounded-3xl space-y-3"
              >
                <div className="flex justify-between text-xs font-mono font-bold text-accent">
                  <span>AI Core Scanner active: Recalculating workspace indexes</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full bg-ink-faint rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    className="bg-accent h-1.5"
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-ink-faint font-mono text-[9px] h-20 overflow-y-auto text-emerald-400 text-left select-none space-y-0.5">
                  {scanLogs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-ink-muted/50">[{i}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* BENTO GRID METRICS AND ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: AI Project Summary and Health Dashboard */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. AI Project Summary Dashboard Panel */}
                <div className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-6 shadow-sm text-left relative overflow-hidden">
                  <div className="absolute top-[-10%] right-[-10%] w-[120px] h-[120px] bg-accent/5 rounded-full blur-[35px] pointer-events-none" />
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                    <h3 className="font-display font-extrabold text-base text-ink">
                      AI Project Summary™
                    </h3>
                  </div>

                  {selectedWorkspace.aiProjectSummary?.executiveSummary ? (
                    <div className="space-y-4">
                      <p className="text-xs text-ink-muted font-light font-sans leading-relaxed">
                        {selectedWorkspace.aiProjectSummary.executiveSummary}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-ink-faint text-xs">
                        <div className="space-y-1.5">
                          <span className="font-mono text-[10px] text-accent uppercase tracking-wider block">Current Progress</span>
                          <p className="text-ink font-light leading-relaxed font-sans">{selectedWorkspace.aiProjectSummary.currentProgress}</p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="font-mono text-[10px] text-rose-400 uppercase tracking-wider block">Top Risks</span>
                          <ul className="list-disc list-inside space-y-0.5 text-rose-300 font-sans font-light">
                            {selectedWorkspace.aiProjectSummary.topRisks?.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-ink-faint text-xs">
                        <div className="space-y-1.5">
                          <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider block">Immediate Next Actions</span>
                          <ul className="list-decimal list-inside space-y-0.5 text-emerald-300 font-sans font-light">
                            {selectedWorkspace.aiProjectSummary.nextActions?.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-1.5">
                          <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider block">Target Timeline & Completion</span>
                          <p className="text-ink font-sans font-light">
                            Completion Estimate: <span className="text-cyan-300 font-bold font-mono">{selectedWorkspace.aiProjectSummary.completionEstimate}</span>
                          </p>
                          {selectedWorkspace.aiProjectSummary.deadlines?.map((d, i) => (
                            <span key={i} className="inline-block px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded text-[9px] font-mono mr-1">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <Sparkles className="w-8 h-8 text-ink-muted mx-auto animate-pulse" />
                      <p className="text-xs text-ink-muted font-sans">
                        Intelligence logs are un-scanned. Run an intelligence scan to trigger AI Project Summaries.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Workspace Health Dashboard */}
                <div className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-6 shadow-sm text-left">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-accent" />
                      <h3 className="font-display font-extrabold text-base text-ink">
                        Workspace Health Dashboard™
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-3xl font-display font-black text-accent block">
                        {selectedWorkspace.health}%
                      </span>
                      <span className="text-[8px] font-mono text-ink-muted uppercase tracking-widest block">
                        HEALTH INDEX
                      </span>
                    </div>
                  </div>

                  {/* Factor Breakdown Bars */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Documentation Factor */}
                      <div className="p-3.5 bg-ink-faint border border-ink-faint rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-muted">Documentation Completeness</span>
                          <span className="text-ink font-bold">{selectedWorkspace.healthFactors?.documentation ?? 0}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1">
                          <div className="bg-accent h-1 rounded-full" style={{ width: `${selectedWorkspace.healthFactors?.documentation ?? 0}%` }} />
                        </div>
                      </div>

                      {/* Organization Factor */}
                      <div className="p-3.5 bg-ink-faint border border-ink-faint rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-muted">Project Organization</span>
                          <span className="text-ink font-bold">{selectedWorkspace.healthFactors?.organization ?? 0}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1">
                          <div className="bg-accent h-1 rounded-full" style={{ width: `${selectedWorkspace.healthFactors?.organization ?? 0}%` }} />
                        </div>
                      </div>

                      {/* Readiness Factor */}
                      <div className="p-3.5 bg-ink-faint border border-ink-faint rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-muted">Task & Deadline Readiness</span>
                          <span className="text-ink font-bold">{selectedWorkspace.healthFactors?.submissionFiles ?? 0}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1">
                          <div className="bg-accent h-1 rounded-full" style={{ width: `${selectedWorkspace.healthFactors?.submissionFiles ?? 0}%` }} />
                        </div>
                      </div>

                      {/* Structure Factor */}
                      <div className="p-3.5 bg-ink-faint border border-ink-faint rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-muted">Project Structure Integrity</span>
                          <span className="text-ink font-bold">{selectedWorkspace.healthFactors?.projectStructure ?? 0}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1">
                          <div className="bg-accent h-1 rounded-full" style={{ width: `${selectedWorkspace.healthFactors?.projectStructure ?? 0}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Outstanding Issues Warnings */}
                    {selectedWorkspace.missingComponents && selectedWorkspace.missingComponents.length > 0 && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl space-y-2 text-xs">
                        <span className="font-bold flex items-center gap-1.5 text-rose-300">
                          <AlertTriangle className="w-4 h-4 text-rose-400" /> Integrity Deficiencies Found ({selectedWorkspace.missingComponents.length})
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-sans font-light">
                          {selectedWorkspace.missingComponents.map((c, i) => (
                            <div key={i} className="flex items-center gap-1.5 p-2 bg-rose-950/20 rounded-xl border border-rose-950/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                              <span className="truncate">Missing: <span className="font-mono font-bold">{c}</span></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. AI Recommendations Panel */}
                {selectedWorkspace.recommendations && selectedWorkspace.recommendations.length > 0 && (
                  <div className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-6 shadow-sm text-left space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkle className="w-5 h-5 text-accent" />
                      <h3 className="font-display font-extrabold text-base text-ink">
                        AI Recommended Actions™
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedWorkspace.recommendations.map((rec, idx) => (
                        <div 
                          key={idx}
                          className="p-4 bg-ink-faint border border-ink-faint rounded-2xl flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1.5">
                            <span className="px-2 py-0.5 bg-accent/15 text-accent border border-accent/20 rounded-md text-[8px] font-mono uppercase block w-max">
                              {rec.category || 'Documentation'}
                            </span>
                            <h4 className="text-xs font-bold text-ink leading-normal">{rec.action}</h4>
                            <p className="text-[11px] text-ink-muted font-sans font-light leading-normal">{rec.reason}</p>
                          </div>
                          <div className="pt-2 border-t border-ink-faint flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                            <Info className="w-3.5 h-3.5" /> {rec.expectedImpact}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Submission Readiness Widget & Document Uploads */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 4. Submission Readiness Widget */}
                <div className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-6 shadow-sm text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-extrabold text-base text-ink">
                      Submission Readiness™
                    </h3>
                    <span className="text-xl font-display font-black text-accent">
                      {selectedWorkspace.submissionReadiness?.score ?? 0}%
                    </span>
                  </div>

                  {/* Checklist indicators */}
                  <div className="space-y-2">
                    {selectedWorkspace.submissionReadiness?.checklist?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-ink-faint rounded-xl border border-ink-faint text-xs font-mono">
                        <span className="text-ink-muted">{item.name}</span>
                        {item.checked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Required Actions List */}
                  {selectedWorkspace.submissionReadiness?.requiredActions && selectedWorkspace.submissionReadiness.requiredActions.length > 0 && (
                    <div className="space-y-2 text-xs pt-2 border-t border-ink-faint">
                      <span className="font-mono text-[9px] text-ink-muted uppercase tracking-widest block">Required action backlog</span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {selectedWorkspace.submissionReadiness.requiredActions.map((act, i) => (
                          <div key={i} className="p-2 bg-bg border border-ink-faint rounded-xl text-[11px] leading-normal font-sans font-light">
                            <span className="font-bold text-accent font-mono">[{act.category}]</span> {act.action}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-ink-faint flex justify-between items-center text-[10px] font-mono text-ink-muted">
                    <span>Estimated efforts left:</span>
                    <span className="text-accent font-bold font-mono">{selectedWorkspace.submissionReadiness?.estimatedCompletionTime || 'Scanning required'}</span>
                  </div>
                </div>

                {/* 5. Documents Area & Drag and Drop Upload */}
                <div className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-5 shadow-sm text-left space-y-4">
                  <h3 className="font-display font-extrabold text-sm text-ink">
                    Mapped Documents ({selectedWorkspace.files?.length || 0})
                  </h3>

                  {/* Drag-and-drop file upload container */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer select-none space-y-2 ${
                      dragActive ? 'border-accent bg-accent/5' : 'border-ink-faint hover:border-accent/40 bg-bg/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-7 h-7 mx-auto text-accent animate-bounce" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-ink">Drag & drop files or click to upload</p>
                      <p className="text-[10px] text-ink-muted font-sans font-light">Supports PDF, DOCX, PPTX, TXT, Markdown, TS/JS/PY</p>
                    </div>
                  </div>

                  {/* Upload progress indicator */}
                  {uploadingFile && (
                    <div className="space-y-2 p-3 bg-accent/5 border border-accent/10 rounded-xl">
                      <div className="flex justify-between text-[10px] font-mono text-accent font-bold">
                        <span>Uploading & analyzing via Gemini AI...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                        <div className="bg-accent h-1 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Documents List */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {(!selectedWorkspace.files || selectedWorkspace.files.length === 0) ? (
                      <p className="text-[11px] text-ink-muted font-sans py-4 text-center">No documents uploaded to this workspace yet.</p>
                    ) : (
                      selectedWorkspace.files.map((file) => (
                        <div 
                          key={file.fileId || file.name}
                          onClick={() => setViewingFile(file)}
                          className="p-3 bg-ink-faint hover:bg-ink-faint/80 border border-ink-faint rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {file.category === 'code' ? (
                              <FileCode className="w-4.5 h-4.5 text-accent shrink-0" />
                            ) : (
                              <FileText className="w-4.5 h-4.5 text-ink-muted shrink-0" />
                            )}
                            <div className="text-left min-w-0 space-y-0.5">
                              <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors truncate">{file.name}</h4>
                              <span className="block text-[9px] font-mono text-ink-muted/80">{file.size || '12 KB'} • {file.category || 'unknown'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.fileId || file.name); }}
                              className="p-1.5 text-ink-muted hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-ink-muted/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. CREATION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg border border-ink-faint p-6 rounded-3xl max-w-lg w-full relative z-10 shadow-2xl space-y-5"
            >
              <div className="space-y-1 text-left">
                <h3 className="font-display font-extrabold text-lg text-ink">
                  Build Custom Trusted Workspace™
                </h3>
                <p className="text-ink-muted text-xs font-light font-sans">
                  Define strategic boundaries, project parameters, and priority nodes.
                </p>
              </div>

              <form onSubmit={handleCreateWorkspace} className="space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder="Silicon Valley Submission Build"
                      className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none focus:border-accent/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Workspace Type
                    </label>
                    <select
                      value={newWsType}
                      onChange={(e: any) => setNewWsType(e.target.value)}
                      className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none"
                    >
                      <option value="hackathon">Hackathon Submission</option>
                      <option value="interview">Interview prep</option>
                      <option value="college">College/Academic work</option>
                      <option value="custom">Office/Enterprise Custom</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                    Description & Core Strategy
                  </label>
                  <textarea
                    required
                    value={newWsDescription}
                    onChange={(e) => setNewWsDescription(e.target.value)}
                    placeholder="Provide a high-level corporate objective or target milestones..."
                    rows={3}
                    className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none resize-none"
                  />
                </div>

                {/* Aesthetic Node Customizers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Workspace Icon Avatar
                    </label>
                    <div className="flex gap-2 flex-wrap max-w-xs">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewWsIcon(emoji)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all border ${
                            newWsIcon === emoji ? 'border-accent bg-accent/10 scale-105' : 'border-ink-faint hover:border-ink-faint/80 bg-bg'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Integrity Node Theme
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_OPTIONS.map((col) => (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => setNewWsColor(col.value)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold text-left transition-all flex items-center gap-1.5 ${
                            newWsColor === col.value ? 'border-accent bg-accent/5' : 'border-ink-faint bg-bg'
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${col.value}`} />
                          <span className="truncate">{col.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Target Priority
                    </label>
                    <select
                      value={newWsPriority}
                      onChange={(e: any) => setNewWsPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                      Final Submission Deadline
                    </label>
                    <input
                      type="date"
                      required
                      value={newWsDeadline}
                      onChange={(e) => setNewWsDeadline(e.target.value)}
                      className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block">
                    Strategic Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newWsTags}
                    onChange={(e) => setNewWsTags(e.target.value)}
                    placeholder="e.g. hackathon, stripe, migration, machine-learning"
                    className="w-full px-4 py-3 bg-ink-faint border border-ink-faint rounded-xl text-xs font-light text-ink focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 border border-ink-faint text-ink-muted hover:text-ink rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold uppercase transition-all cursor-pointer shadow-lg"
                  >
                    Build Node
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. AI DOCUMENT ANALYSIS VIEW MODAL */}
      <AnimatePresence>
        {viewingFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingFile(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg border border-ink-faint p-6 rounded-3xl max-w-2xl w-full relative z-10 shadow-2xl space-y-5 text-left max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start border-b border-ink-faint pb-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest block">
                    AI Document Intelligence
                  </span>
                  <h3 className="font-display font-extrabold text-base text-ink truncate max-w-md">
                    {viewingFile.name}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingFile(null)}
                  className="px-3 py-1.5 border border-ink-faint hover:text-accent rounded-xl text-xs transition-all cursor-pointer"
                >
                  Close View
                </button>
              </div>

              {viewingFile.summary ? (
                <div className="space-y-5">
                  
                  {/* Summary Section */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest block">Document Executive Summary</span>
                    <p className="text-xs text-ink-muted leading-relaxed font-sans font-light">
                      {viewingFile.summary}
                    </p>
                  </div>

                  {/* Keywords */}
                  {viewingFile.keywords && viewingFile.keywords.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest block">Synthesized Keywords</span>
                      <div className="flex flex-wrap gap-1">
                        {viewingFile.keywords.map((kw, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-ink-faint border border-ink-faint text-[10px] font-mono text-ink rounded-lg">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Important extracted insights */}
                    {viewingFile.importantInfo && viewingFile.importantInfo.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest block">Extracted Core Insights</span>
                        <ul className="list-disc list-inside text-xs text-ink-muted font-sans font-light space-y-1">
                          {viewingFile.importantInfo.map((info, idx) => (
                            <li key={idx} className="leading-relaxed">{info}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Items */}
                    {viewingFile.actionItems && viewingFile.actionItems.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest block">Action Items & Deliverables</span>
                        <ul className="list-decimal list-inside text-xs text-rose-300 font-sans font-light space-y-1">
                          {viewingFile.actionItems.map((act, idx) => (
                            <li key={idx} className="leading-relaxed">{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-ink-faint">
                    
                    {/* Suggested Backlog Tasks */}
                    {viewingFile.suggestedTasks && viewingFile.suggestedTasks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">Automatically Generated Backlog Tasks</span>
                        <div className="space-y-1.5">
                          {viewingFile.suggestedTasks.map((task, idx) => (
                            <div key={idx} className="p-2.5 bg-emerald-950/15 border border-emerald-900/30 text-emerald-300 rounded-xl text-[11px] leading-relaxed font-sans font-light">
                              <span className="font-bold block text-emerald-400">Task:</span> {task}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Project recommendations based on document */}
                    {viewingFile.recommendations && viewingFile.recommendations.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">Strategic Recommendations</span>
                        <ul className="list-disc list-inside text-xs text-cyan-300 font-sans font-light space-y-1">
                          {viewingFile.recommendations.map((rec, idx) => (
                            <li key={idx} className="leading-relaxed">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-ink-muted animate-spin mx-auto" />
                  <p className="text-xs text-ink-muted font-sans">
                    Waiting on deep analysis values... Click scanning triggers in detail panels.
                  </p>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
