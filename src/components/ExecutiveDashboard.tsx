import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { motion, AnimatePresence } from 'motion/react';
import { PresentationMode } from './PresentationMode';
import { ProductTour } from './ProductTour';
import { 
  Sparkles, 
  Power, 
  Cpu, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  Clock, 
  Volume2, 
  Palette, 
  Compass, 
  Activity, 
  Mic, 
  MicOff, 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  FolderGit2, 
  MessageSquare, 
  Bell, 
  Settings, 
  ArrowRight, 
  ChevronRight, 
  Play, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw, 
  Heart, 
  Menu, 
  X, 
  Layers, 
  HelpCircle,
  FileCode,
  FileText,
  VolumeX,
  Folder,
  Cloud,
  Mail
} from 'lucide-react';
import { VoicePersonality } from '../types';
import { MarkdownViewer } from './MarkdownViewer';
import { ThemeSelector } from './ThemeSelector';
import { WorkspaceSection } from './WorkspaceSection';
import { TaskSection } from './TaskSection';
import { ExecutionTimeline } from './ExecutionTimeline';
import { AvatarCustomizer } from './AvatarCustomizer';

import { ExecutiveBriefing } from './ExecutiveBriefing';
import { FocusSession } from './FocusSession';
import { ReminderCenter } from './ReminderCenter';
import { ExecutionAnalytics } from './ExecutionAnalytics';
import { ExecutiveInsightsTab } from './ExecutiveInsightsTab';
import { GoalsAutomationsTab } from './GoalsAutomationsTab';

export const ExecutiveDashboard: React.FC = () => {
  const { userProfile, preferences, logout, currentUser, googleAccessToken } = useAuth();
  const { 
    isListening, 
    isProcessing, 
    isSpeaking, 
    transcript, 
    aiResponse, 
    audioLevel, 
    startListening, 
    stopListening,
    speakText 
  } = useVoice();

  // Active view routing state
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tasks' | 'calendar' | 'workspaces' | 'ai_chat' | 'notifications' | 'settings' | 'briefing' | 'focus_mode' | 'reminders' | 'analytics' | 'goals' | 'insights' | 'presentation'>('dashboard');

  // Product Tour state & auto-trigger
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('duenow_tour_completed');
    if (completed !== 'true') {
      setIsTourOpen(true);
    }
  }, []);


  // UI state managers
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [workspaceHealth, setWorkspaceHealth] = useState(78);
  const [missingFiles, setMissingFiles] = useState(['README.md', 'Vite Config', 'Drizzle Schema']);
  const [currentProbability, setCurrentProbability] = useState(87);
  const [completedRecommendations, setCompletedRecommendations] = useState<string[]>([]);
  const [timelineChecked, setTimelineChecked] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // AI Chat & Conversation Memory States
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSessionId] = useState(`session-${Date.now()}`);

  // --- GOOGLE WORKSPACE DYNAMIC INTEGRATION STATES ---
  const [googleMeetings, setGoogleMeetings] = useState<any[]>([]);
  const [gmailBriefing, setGmailBriefing] = useState<any>(null);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<any[]>([]);
  const [googleTasksList, setGoogleTasksList] = useState<any[]>([]);
  const [googleContactsList, setGoogleContactsList] = useState<any[]>([]);
  const [isLoadingWorkspaceData, setIsLoadingWorkspaceData] = useState(false);

  // Active Workspace intelligence detail models
  const [analyzedDoc, setAnalyzedDoc] = useState<any>(null);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [analyzedSlide, setAnalyzedSlide] = useState<any>(null);
  const [analyzingSlideId, setAnalyzingSlideId] = useState<string | null>(null);

  const fetchAllWorkspaceData = async () => {
    if (!googleAccessToken) return;
    setIsLoadingWorkspaceData(true);
    try {
      const headers = { 'Authorization': `Bearer ${googleAccessToken}` };

      // Fetch meet preps
      const meetRes = await fetch('/api/google/meet/prep', { headers });
      if (meetRes.ok) {
        const data = await meetRes.json();
        setGoogleMeetings(data.meetings || []);
      }

      // Fetch gmail digests
      const gmailRes = await fetch('/api/google/gmail/summary', { headers });
      if (gmailRes.ok) {
        const data = await gmailRes.json();
        setGmailBriefing(data);
      }

      // Fetch files
      const driveRes = await fetch('/api/google/drive/files', { headers });
      if (driveRes.ok) {
        const data = await driveRes.json();
        setGoogleDriveFiles(data.files || []);
      }

      // Fetch tasks
      const tasksRes = await fetch('/api/google/tasks', { headers });
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setGoogleTasksList(data.tasks || []);
      }

      // Fetch contacts
      const contactsRes = await fetch('/api/google/contacts', { headers });
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setGoogleContactsList(data.contacts || []);
      }
    } catch (err) {
      console.error('Error fetching integrated workspace data:', err);
    } finally {
      setIsLoadingWorkspaceData(false);
    }
  };

  useEffect(() => {
    if (googleAccessToken && activeSection === 'dashboard') {
      fetchAllWorkspaceData();
    }
  }, [googleAccessToken, activeSection]);

  const handleAnalyzeDoc = async (fileId: string, fileName: string) => {
    setAnalyzingDocId(fileId);
    setAnalyzedDoc(null);
    try {
      const res = await fetch('/api/google/docs/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId, fileName })
      });
      if (res.ok) {
        const analysis = await res.json();
        setAnalyzedDoc({ ...analysis, fileName });
      }
    } catch (e) {
      console.error('Error analyzing document:', e);
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const handleAnalyzeSlides = async (fileId: string, fileName: string) => {
    setAnalyzingSlideId(fileId);
    setAnalyzedSlide(null);
    try {
      const res = await fetch('/api/google/slides/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId, fileName })
      });
      if (res.ok) {
        const analysis = await res.json();
        setAnalyzedSlide({ ...analysis, fileName });
      }
    } catch (e) {
      console.error('Error analyzing slides:', e);
    } finally {
      setAnalyzingSlideId(null);
    }
  };

  // Fetch Conversation history on activeSection === 'ai_chat'
  useEffect(() => {
    if (activeSection === 'ai_chat') {
      const fetchHistory = async () => {
        try {
          const response = await fetch('/api/ai/history', {
            headers: {
              'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`
            }
          });
          const data = await response.json();
          if (data.history && data.history.length > 0) {
            const formatted = [];
            for (const item of data.history) {
              if (item.userInput) {
                formatted.push({ id: item.conversationId + '-user', sender: 'user', text: item.userInput, timestamp: item.timestamp });
              }
              if (item.aiResponse) {
                formatted.push({
                  id: item.conversationId + '-ai',
                  sender: 'ai',
                  text: item.aiResponse,
                  timestamp: item.timestamp,
                  intent: item.intent,
                  suggestedActions: item.suggestedActions || []
                });
              }
            }
            setChatMessages(formatted);
          } else {
            // Put an initial greeting if history is empty
            setChatMessages([
              {
                id: 'welcome',
                sender: 'ai',
                text: persona.greeting,
                timestamp: Date.now(),
                suggestedActions: [
                  { action: 'create_task', title: 'Register Next Task', requiresConfirmation: true, taskData: { title: 'Review presentation draft', priority: 'high', estimatedDuration: 30 } },
                  { action: 'analyze_workspace', title: 'Deep-Scan Workspace Health', requiresConfirmation: false }
                ]
              }
            ]);
          }
        } catch (error) {
          console.error("Failed to load chat history:", error);
          setChatMessages([
            {
              id: 'welcome-err',
              sender: 'ai',
              text: persona.greeting,
              timestamp: Date.now(),
              suggestedActions: [
                { action: 'create_task', title: 'Register Next Task', requiresConfirmation: true, taskData: { title: 'Review presentation draft', priority: 'high', estimatedDuration: 30 } },
                { action: 'analyze_workspace', title: 'Deep-Scan Workspace Health', requiresConfirmation: false }
              ]
            }
          ]);
        }
      };
      fetchHistory();
    }
  }, [activeSection, userProfile]);

  // Fetch real-time analytical metrics & probability indices
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/ai/metrics', {
          headers: {
            'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`
          }
        });
        const data = await res.json();
        if (data.successProbability) {
          setCurrentProbability(data.successProbability.current);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic dashboard metrics:", err);
      }
    };
    fetchMetrics();
  }, [activeSection, currentUser]);

  // Debounced Unified Search effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      setShowSearchResults(true);
      try {
        const token = googleAccessToken || sessionStorage.getItem('google_access_token');
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, {
          headers: {
            'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`,
            'x-google-access-token': token || ''
          }
        });
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error('Unified search trigger failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, googleAccessToken, currentUser]);

  // Sync vocal transcription & responses dynamically
  useEffect(() => {
    if (activeSection === 'ai_chat' && aiResponse && !isProcessing) {
      const alreadyHas = chatMessages.some(m => m.text === aiResponse);
      if (!alreadyHas) {
        const userMsgText = transcript || "Voice instruction";
        const hasUserMsg = chatMessages.some(m => m.text === userMsgText);
        
        const newMsgs = [];
        if (!hasUserMsg) {
          newMsgs.push({
            id: `user-voice-${Date.now()}`,
            sender: 'user',
            text: userMsgText,
            timestamp: Date.now()
          });
        }
        newMsgs.push({
          id: `ai-voice-${Date.now()}`,
          sender: 'ai',
          text: aiResponse,
          timestamp: Date.now(),
          intent: 'voice_command'
        });
        setChatMessages(prev => [...prev, ...newMsgs]);
      }
    }
  }, [aiResponse, isProcessing]);

  // Send a text or suggested prompt
  const handleSendChatMessage = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    // Append user message immediately
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMsg]);
    if (!overrideText) setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`,
          'x-google-access-token': googleAccessToken || sessionStorage.getItem('google_access_token') || ''
        },
        body: JSON.stringify({
          input: textToSend,
          sessionId: chatSessionId
        })
      });

      const data = await response.json();
      
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.aiResponse,
        timestamp: Date.now(),
        intent: data.intent,
        suggestedActions: data.suggestedActions || []
      };

      setChatMessages(prev => [...prev, aiMsg]);
      
      // Programmatic vocal response back
      speakText(data.aiResponse);
    } catch (err) {
      console.error("Failed to send chat message:", err);
      const errorMsg = {
        id: `ai-${Date.now()}-err`,
        sender: 'ai',
        text: `I'm having a slight sync lag, but let's keep going. Your ${currentProbability}% Success Probability is our primary target.`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Execute Action from Suggestion Card
  const handleExecuteAction = async (actionItem: any) => {
    try {
      if (actionItem.action === 'create_task') {
        const response = await fetch('/api/ai/confirm-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser?.uid || 'default-user-id'}`
          },
          body: JSON.stringify({
            action: 'create_task',
            taskData: actionItem.taskData
          })
        });
        const result = await response.json();
        if (result.executed) {
          speakText(`Action executed successfully. Task "${actionItem.taskData?.title || 'New Task'}" is now registered. Success Probability updated.`);
          setCurrentProbability(prev => Math.min(prev + 4, 100));
          
          // Append success notification bubble
          setChatMessages(prev => [
            ...prev,
            {
              id: `action-success-${Date.now()}`,
              sender: 'ai',
              text: `✅ **Operational Directive Synced**\n\nRegistered Task: \`${actionItem.taskData?.title || 'New Task'}\`\nPriority: \`${actionItem.taskData?.priority || 'medium'}\`\nEstimated Duration: \`${actionItem.taskData?.estimatedDuration || 30}m\`\n\nYour success probability score has been adjusted.`,
              timestamp: Date.now()
            }
          ]);
        }
      } else if (actionItem.action === 'analyze_workspace') {
        await handleWorkspaceScan();
        // Append scan results in chat too
        setChatMessages(prev => [
          ...prev,
          {
            id: `action-scan-${Date.now()}`,
            sender: 'ai',
            text: `📁 **Directory Integrity Report**\n\nWorkspace Scan Completed.\nHealth Score: \`94%\` (Up from \`78%\`).\nResolution: Synced missing file pointers.`,
            timestamp: Date.now()
          }
        ]);
      }
    } catch (err) {
      console.error("Action execution error:", err);
    }
  };

  // Live Local Clock Updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync personality characteristics
  const getPersonalityContext = (p: string) => {
    const norm = (p || '').toLowerCase();
    switch (norm) {
      case 'mentor':
      case 'zephyr':
        return {
          title: norm === 'zephyr' ? 'Zephyr' : 'Sage Mentor',
          emoji: norm === 'zephyr' ? '🌌' : '🦉',
          description: 'Focuses on structural growth, strategic milestones, and calm execution guidelines.',
          recentDialogue: `"${userProfile?.name || 'Partner'}, we have calibrated three priority workspace objectives. Let's tackle them methodically."`,
          greeting: `Good evening, ${userProfile?.name || 'Partner'}. Focus entirely on the presentation slide sequence to clear your timeline bottleneck.`
        };
      case 'best_friend':
      case 'kai':
        return {
          title: norm === 'kai' ? 'Kai' : 'Hyper Enthusiast',
          emoji: norm === 'kai' ? '⚡' : '⚡',
          description: 'Keeps confidence extremely high with warm, friendly motivational loops.',
          recentDialogue: `"Hey ${userProfile?.name || 'Partner'}! Seriously, you're crushing this prep. Let's knock these items out and grab coffee."`,
          greeting: `Morning ${userProfile?.name || 'Partner'}! Ready to conquer today's workspace runs? Let's get right into it!`
        };
      case 'coach':
      case 'zara':
        return {
          title: norm === 'zara' ? 'Zara' : 'Execution Coach',
          emoji: norm === 'zara' ? '🔮' : '🏆',
          description: norm === 'zara' ? 'Calm, low-noise executive presence. Provides ultra-crisp summaries and reduces visual clutter.' : 'Driven by core timelines, accountability constraints, and performance scores.',
          recentDialogue: `"${userProfile?.name || 'Partner'}, focus on architecture first. The timeline permits no delays. Ready to execute?"`,
          greeting: `Workstation online, ${userProfile?.name || 'Partner'}. Your success outlook indicates minor calendar collision risks. Avoid distraction.`
        };
      case 'professional':
      case 'sophia':
        return {
          title: norm === 'sophia' ? 'Sophia' : 'Refined Chief of Staff',
          emoji: norm === 'sophia' ? '⚖️' : '💼',
          description: norm === 'sophia' ? 'Strategic executive management style, milestone analysis, and concise corporate feedback.' : 'Highly analytical, direct, and structured briefing parameters.',
          recentDialogue: `"Establishing secure directory parse. Timeline bottlenecks identified. Presenting structured operational matrix."`,
          greeting: `Good evening, ${userProfile?.name || 'Partner'}. Workspace parameters initialized. Displaying optimal path coordinate metrics.`
        };
      default:
        return {
          title: 'Sage Mentor',
          emoji: '🦉',
          description: 'Focuses on structural growth, strategic milestones, and calm execution guidelines.',
          recentDialogue: `"${userProfile?.name || 'Partner'}, we have calibrated three priority workspace objectives. Let's tackle them methodically."`,
          greeting: `Good evening, ${userProfile?.name || 'Partner'}. Focus entirely on the presentation slide sequence to clear your timeline bottleneck.`
        };
    }
  };

  const persona = getPersonalityContext(userProfile?.personality || 'mentor');

  // Interactive scan simulations
  const handleWorkspaceScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    speakText("Initiating workstation file tree analysis. Please hold.");
    
    // Simulate multi-factor processing
    await new Promise((r) => setTimeout(r, 2500));
    
    setWorkspaceHealth(94);
    setMissingFiles(['Drizzle Schema']);
    setIsScanning(false);
    speakText("File tree analysis complete. Workspace health index calibrated at 94%.");
  };

  // Recommendations interactive click (increases probability)
  const toggleRecommendation = (id: string, boost: number) => {
    if (completedRecommendations.includes(id)) {
      setCompletedRecommendations(prev => prev.filter(x => x !== id));
      setCurrentProbability(prev => prev - boost);
    } else {
      setCompletedRecommendations(prev => [...prev, id]);
      setCurrentProbability(prev => Math.min(prev + boost, 100));
      speakText(`Priority factor adjusted. Success probability optimized by ${boost} percent.`);
    }
  };

  // Timeline check interaction
  const toggleTimelineCheck = (id: string) => {
    if (timelineChecked.includes(id)) {
      setTimelineChecked(prev => prev.filter(x => x !== id));
    } else {
      setTimelineChecked(prev => [...prev, id]);
      speakText(`Milestone completed.`);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'briefing', label: 'Executive Briefing', icon: Compass },
    { id: 'insights', label: 'Executive Insights', icon: Activity },
    { id: 'goals', label: 'Goals & Rules', icon: ShieldCheck },
    { id: 'focus_mode', label: 'Focus Zone', icon: Clock },
    { id: 'reminders', label: 'Reminder Center', icon: Bell },
    { id: 'analytics', label: 'Productivity Shelf', icon: TrendingUp },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'workspaces', label: 'Workspaces', icon: FolderGit2 },
    { id: 'ai_chat', label: 'AI Chat & Memory', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'presentation', label: 'Demo Presentation', icon: Play },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-bg text-ink font-sans flex flex-col relative overflow-hidden selection:bg-accent selection:text-white">
      
      {/* Volumetric ambient background aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-accent/5 blur-[150px] animate-aurora" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/3 blur-[150px] animate-aurora" style={{ animationDelay: '-6s' }} />
        <div className="absolute top-[30%] left-[25%] w-[400px] h-[400px] rounded-full bg-accent/1 blur-[120px] animate-float" />
      </div>

      {/* Persistent Voice Dock Overlay at the very bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 border-t border-ink-faint bg-bg/80 backdrop-blur-md flex justify-center items-center">
        <div className="max-w-4xl w-full flex items-center justify-between gap-6 px-4">
          
          {/* Status & Transcript details */}
          <div className="flex items-center gap-3.5 max-w-[60%] overflow-hidden">
            <div className="relative">
              {isListening && (
                <div className="absolute -inset-1 rounded-full bg-accent/30 animate-ping" />
              )}
              <div className={`w-3.5 h-3.5 rounded-full ${
                isListening ? 'bg-accent animate-pulse' : isSpeaking ? 'bg-emerald-500' : isProcessing ? 'bg-amber-500 animate-spin' : 'bg-ink-muted'
              }`} />
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold tracking-widest text-ink-muted uppercase leading-none">
                {isListening ? 'LISTENING TO MICROPHONE NODE' : isSpeaking ? 'COMPANION SPEAKING' : isProcessing ? 'COMPUTING NLP INTELLIGENCE' : 'DUE-NOW EXECUTIVE OS IDLE'}
              </span>
              <p className="text-xs text-ink-muted font-light truncate mt-1">
                {isListening ? (transcript || 'Listening for speech input...') : isSpeaking ? (aiResponse || 'Synthesizing voice guidelines...') : isProcessing ? 'Parsing intent structures...' : 'Ready to parse. Click the mic node to converse.'}
              </p>
            </div>
          </div>

          {/* Glowing waveform feedback block */}
          <div className="hidden sm:flex items-center gap-1.5 h-8 px-4 bg-ink-faint rounded-full border border-ink-faint">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
              const activeHeight = isListening ? audioLevel * ([1, 1.4, 0.8, 1.8, 1.2, 1.5, 0.9, 1.6, 1.1, 1.3][i - 1] / 1.5) : isSpeaking ? Math.random() * 20 + 8 : 4;
              return (
                <motion.div 
                  key={i} 
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isListening ? 'bg-accent' : isSpeaking ? 'bg-emerald-400' : 'bg-ink-muted'
                  }`}
                  style={{ height: `${Math.max(4, Math.min(32, activeHeight))}px` }}
                />
              );
            })}
          </div>

          {/* Large bottom interactive vocal trigger button */}
          <div className="flex items-center gap-3">
            {isSpeaking && (
              <motion.button
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  speakText(""); // Stop speaking state
                }}
                className="p-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-ink-faint text-xs font-semibold flex items-center gap-1.5 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                title="Silence TTS playback"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mute AI</span>
              </motion.button>
            )}

            <motion.button
              onClick={isListening ? stopListening : startListening}
              className={`px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2.5 shadow-lg relative cursor-pointer ${
                isListening 
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                  : isSpeaking 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                  : 'bg-accent hover:bg-accent/95 text-white shadow-[0_4px_15px_rgba(255,77,0,0.35)]'
              }`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-white animate-pulse" />
                  <span>Talk to {userProfile?.personality ? persona.title.split(' ')[0] : 'Companion'}</span>
                </>
              )}
            </motion.button>
          </div>

        </div>
      </div>

      {/* Main OS Shell Layout */}
      <div className="flex-1 flex relative z-10 overflow-hidden h-full pb-24">
        
        {/* LEFT SIDEBAR: Navigation Rail */}
        <aside className={`border-r border-ink-faint bg-bg/60 backdrop-blur-lg flex flex-col justify-between transition-all duration-300 shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } hidden md:flex`}>
          <div>
            {/* Upper Logo Node */}
            <div className="p-6 flex items-center justify-between border-b border-ink-faint">
              <div className="flex items-center gap-3 overflow-hidden">
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(255,77,0,0.4)] border border-accent/20 shrink-0"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                {!isSidebarCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="flex flex-col"
                  >
                    <span className="font-display font-extrabold text-base tracking-tight leading-none text-ink">DueNow</span>
                    <span className="text-[8px] uppercase tracking-widest font-mono font-bold text-accent block mt-1">OS V2.4</span>
                  </motion.div>
                )}
              </div>

              <button 
                onClick={() => setIsSidebarCollapsed(prev => !prev)}
                className="p-1.5 rounded-lg hover:bg-ink-faint text-ink-muted hover:text-ink transition-all"
                title={isSidebarCollapsed ? 'Expand Panel' : 'Collapse Panel'}
              >
                <Compass className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Navigation item lists */}
            <nav className="p-4 space-y-2.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3.5 py-3 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-accent text-white shadow-[0_0_15px_rgba(255,77,0,0.3),_inset_0_1px_1px_rgba(255,255,255,0.1)] border border-accent/20' 
                        : 'text-ink-muted hover:bg-ink-faint hover:text-ink border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {!isSidebarCollapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{item.label}</motion.span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Lower session manager panel */}
          <div className="p-4 border-t border-ink-faint space-y-4">
            {!isSidebarCollapsed && (
              <div className="p-3 bg-ink-faint border border-ink-faint rounded-xl text-center space-y-1">
                <span className="text-[9px] font-mono font-bold text-ink-muted uppercase tracking-widest">PERSONALITY CODES</span>
                <span className="block text-xs font-bold text-accent capitalize">{userProfile?.personality || 'Mentor'} Mode</span>
              </div>
            )}
            
            <motion.button 
              onClick={logout}
              className={`w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-ink-faint text-rose-500 dark:text-rose-400 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold tracking-wide cursor-pointer ${
                isSidebarCollapsed ? 'px-0' : 'px-4'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Lock Workstation"
            >
              <Power className="w-3.5 h-3.5" />
              {!isSidebarCollapsed && <span>Lock Console</span>}
            </motion.button>
          </div>
        </aside>

        {/* CENTER EXECUTIVE MAIN CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* HEADER BAR */}
          <header className="px-6 py-4 border-b border-ink-faint bg-bg/40 backdrop-blur-md flex items-center justify-between z-20 sticky top-0">
            
            {/* Search Input Filter & Mobile triggers */}
            <div className="flex items-center gap-3.5 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/60" />
                <input
                  type="text"
                  placeholder="Ask DueNow or filter tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-ink-faint border border-ink-faint rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent/50 text-ink placeholder:text-ink-muted/50"
                />

                {/* Unified Search Dropdown Overlay */}
                {showSearchResults && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-850 rounded-2xl shadow-2xl p-4 max-h-96 overflow-y-auto z-50 space-y-3 text-left">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
                      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">Unified Intel Search</span>
                      <button 
                        onClick={() => { setShowSearchResults(false); setSearchTerm(''); }}
                        className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer font-bold uppercase"
                      >
                        Clear
                      </button>
                    </div>

                    {isSearching ? (
                      <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                        <span>Scanning databases and workspace integrations...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">
                        No matches found for "{searchTerm}"
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {searchResults.map((result) => (
                          <div 
                            key={`${result.type}-${result.id}`}
                            onClick={() => {
                              setShowSearchResults(false);
                              if (result.type === 'task') {
                                setActiveSection('tasks');
                              } else if (result.type === 'workspace') {
                                setActiveSection('workspaces');
                              } else if (result.type === 'calendar') {
                                setActiveSection('calendar');
                              } else if (result.type === 'gmail') {
                                setActiveSection('briefings');
                              } else if (result.type === 'drive') {
                                window.open(result.link, '_blank');
                              }
                            }}
                            className="p-3 bg-gray-50 hover:bg-slate-100 dark:bg-zinc-850/60 dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition-all flex items-start gap-3 border border-transparent hover:border-accent/10"
                          >
                            <div className="p-2 bg-white dark:bg-zinc-800 border border-gray-150 dark:border-zinc-700 rounded-lg shrink-0 text-slate-500 dark:text-zinc-400">
                              {result.type === 'workspace' && <Folder className="w-3.5 h-3.5 text-blue-500" />}
                              {result.type === 'task' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              {result.type === 'calendar' && <Calendar className="w-3.5 h-3.5 text-amber-500" />}
                              {result.type === 'drive' && <Cloud className="w-3.5 h-3.5 text-indigo-500" />}
                              {result.type === 'gmail' && <Mail className="w-3.5 h-3.5 text-purple-500" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-semibold text-gray-900 dark:text-white truncate">{result.title}</h5>
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">{result.subtitle}</p>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-accent shrink-0 self-center">
                              {result.relevance}% relevance
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats, clock, date details */}
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex flex-col text-right font-mono text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                <span className="text-ink flex items-center gap-1.5 justify-end">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  {timeStr || '00:00:00 UTC'}
                </span>
                <span className="text-ink-muted/80 mt-1">{dateStr || 'Calculating date...'}</span>
              </div>

              {/* Mini quick actions trigger */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowQuickActions(prev => !prev)}
                  className="p-2.5 bg-ink-faint border border-ink-faint hover:border-accent/30 rounded-xl text-ink hover:text-ink transition-all flex items-center gap-1.5 text-xs font-bold"
                  whileHover={{ scale: 1.03 }}
                >
                  <Layers className="w-4 h-4 text-accent animate-pulse" />
                  <span>Sprints</span>
                </motion.button>

                {/* Quick actions popup menu */}
                <AnimatePresence>
                  {showQuickActions && (
                    <motion.div 
                      className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-3 space-y-1 z-30 shadow-2xl border border-ink-faint"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    >
                      <span className="text-[9px] font-mono font-bold text-ink-muted block px-3 py-1 uppercase tracking-widest border-b border-ink-faint mb-2">Simulate Sprints</span>
                      <button 
                        onClick={() => {
                          speakText("Simulating day optimization sequence. Running analytics.");
                          setShowQuickActions(false);
                        }}
                        className="w-full text-left py-2 px-3 hover:bg-ink-faint rounded-lg text-xs text-ink-muted hover:text-ink transition-all flex items-center gap-2"
                      >
                        <Compass className="w-3.5 h-3.5 text-accent" />
                        Optimize Milestones
                      </button>
                      <button 
                        onClick={() => {
                          speakText("Pre-flight checklist initiated for your corporate submission.");
                          setShowQuickActions(false);
                        }}
                        className="w-full text-left py-2 px-3 hover:bg-ink-faint rounded-lg text-xs text-ink-muted hover:text-ink transition-all flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Check Submission Health
                      </button>
                      <button 
                        onClick={() => {
                          speakText("Opening full memory logs.");
                          setShowQuickActions(false);
                        }}
                        className="w-full text-left py-2 px-3 hover:bg-ink-faint rounded-lg text-xs text-ink-muted hover:text-ink transition-all flex items-center gap-2"
                      >
                        <Layers className="w-3.5 h-3.5 text-accent" />
                        Companion Memory Logs
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme appearance toggle */}
              <div className="border-l border-ink-faint pl-4 flex items-center">
                <ThemeSelector />
              </div>

              {/* User Mini profile identifier */}
              <div className="flex items-center gap-2.5 border-l border-ink-faint pl-4 shrink-0">
                <div className="w-8.5 h-8.5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs text-accent font-bold">
                  {userProfile?.name?.substring(0, 1).toUpperCase() || 'P'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-ink leading-none">{userProfile?.name || 'Partner'}</span>
                  <span className="text-[9px] font-mono font-bold text-ink-muted mt-1 uppercase tracking-wide">Onboarded</span>
                </div>
              </div>

            </div>
          </header>

          {/* DYNAMIC TAB CONTROLLER */}
          <div className="p-6 flex-1">
            <AnimatePresence mode="wait">

              {/* ACTIVE: VIEW 01 - MAIN EXECUTIVE DASHBOARD */}
              {activeSection === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  
                  {/* HERO AI EXECUTIVE CARD */}
                  <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
                    
                    {/* Volumetric background glow for the hero card */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 max-w-xl">
                      
                      {/* Interactive Animated Orb Centerpiece (Breaths, listens, speaks, glows) */}
                      <div className="relative shrink-0 cursor-pointer" onClick={() => speakText(persona.greeting)}>
                        
                        {/* Interactive floating glowing ambient halos */}
                        <div className={`absolute -inset-6 rounded-full blur-xl opacity-20 transition-all duration-700 ${
                          isListening ? 'bg-accent' : isSpeaking ? 'bg-emerald-500' : 'bg-accent/80'
                        }`} />
                        
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center border border-ink-faint shadow-[0_0_30px_rgba(255,77,0,0.3)] text-white relative ${
                          isListening 
                            ? 'bg-gradient-to-tr from-accent to-accent animate-orb-listening' 
                            : isSpeaking 
                            ? 'bg-gradient-to-tr from-emerald-500 to-emerald-600 animate-orb-listening' 
                            : 'bg-gradient-to-tr from-accent to-accent animate-orb-breathing'
                        }`}>
                          <Compass className="w-7 h-7 text-white/90 filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.3)] animate-spin" style={{ animationDuration: isListening ? '6s' : isSpeaking ? '10s' : '15s' }} />
                        </div>
                        <span className="absolute bottom-[-2px] right-[-2px] bg-bg text-[9px] font-mono border border-ink-faint px-1.5 py-0.5 rounded-md font-bold text-accent">
                          {persona.emoji}
                        </span>
                      </div>

                      {/* Summary details */}
                      <div className="space-y-2 text-center sm:text-left">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[9px] font-mono font-bold tracking-wider text-accent">
                          <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                          COMPANION CO-PILOT: {persona.title.toUpperCase()}
                        </span>
                        
                        <h2 className="font-display font-extrabold text-2xl sm:text-3.5xl tracking-tight text-ink leading-tight">
                          {persona.greeting.split('.')[0]}.
                        </h2>
                        
                        <p className="text-ink-muted text-xs leading-relaxed font-light font-sans">
                          You have <span className="text-accent font-bold">1 milestone</span> expiring today and <span className="text-accent font-bold">2 priority tasks</span> pending. Let's maximize synchronization scores.
                        </p>
                      </div>

                    </div>

                    {/* Left corner CTA shortcut */}
                    <div className="shrink-0 flex flex-col gap-2.5 relative z-10 w-full md:w-auto">
                      <motion.button
                        onClick={() => setActiveSection('briefing')}
                        className="w-full md:w-auto px-5 py-3.5 bg-accent hover:bg-accent/90 border border-accent/25 rounded-2xl text-xs font-bold tracking-wide shadow-[0_4px_15px_rgba(255,77,0,0.3)] transition-all flex items-center justify-center gap-2 group cursor-pointer text-white"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Volume2 className="w-4 h-4 text-white" />
                        <span>Brief Me Now</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
                      </motion.button>

                      <div className="text-center md:text-right">
                        <span className="text-[10px] font-mono text-ink-muted/80 font-semibold block uppercase">PRESET ACCELERATION STYLE:</span>
                        <span className="text-xs text-ink-muted font-bold capitalize">{userProfile?.personality || 'mentor'} Active Mode</span>
                      </div>
                    </div>

                  </div>

                  {/* UNIFIED EXECUTIVE WORKSPACE INTELLIGENCE MODULE */}
                  <div className="glass-panel p-6 sm:p-7 rounded-3xl space-y-6 relative shadow-xl border border-slate-200 dark:border-white/5 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-slate-800 dark:text-slate-150 flex items-center gap-2">
                          <Compass className="w-5 h-5 text-accent animate-pulse" />
                          Executive Workspace Intelligence
                        </h3>
                        <p className="text-slate-400 dark:text-zinc-400 text-xs font-light">
                          AI-orchestrated data aggregated across all connected Google Services
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {googleAccessToken && (
                          <button
                            onClick={fetchAllWorkspaceData}
                            disabled={isLoadingWorkspaceData}
                            className="p-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                            title="Reload Google Workspace Data"
                          >
                            <RefreshCw className={`w-4 h-4 ${isLoadingWorkspaceData ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <button
                          onClick={() => setActiveSection('settings')}
                          className="px-3.5 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Configure Services
                        </button>
                      </div>
                    </div>

                    {!googleAccessToken ? (
                      <div className="p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center space-y-4">
                        <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto text-lg">💡</div>
                        <div className="max-w-md mx-auto space-y-1.5">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Google Workspace Connection Detected</h4>
                          <p className="text-xs text-slate-400 leading-relaxed font-light">
                            Authorize your Google account to enable real-time meetings preparation briefing, email deadline detection, slide deck completeness evaluation, and two-way tasks synchronization.
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveSection('settings')}
                          className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        >
                          Enable Workspace Adapter
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* LEFT HAND PANEL: EMAIL DIGEST & MEETING PREPARATION (8 columns) */}
                        <div className="xl:col-span-8 space-y-6">
                          
                          {/* MEET PREPARATION BRIEFINGS */}
                          <div className="space-y-3.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                              <span>📹</span> Upcoming Meets & Preflight Prep
                            </h4>
                            {googleMeetings.length === 0 ? (
                              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl text-xs text-slate-400 text-center font-light">
                                No upcoming meetings detected on your calendar today.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {googleMeetings.slice(0, 2).map((m: any, idx: number) => (
                                  <div key={idx} className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 text-left">
                                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{m.summary}</h5>
                                        <p className="text-[10px] font-mono text-accent font-bold mt-0.5">{new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                      </div>
                                      <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[8px] font-bold uppercase tracking-wider shrink-0">
                                        Google Meet
                                      </span>
                                    </div>
                                    
                                    {m.prep ? (
                                      <div className="space-y-2 text-[11px] leading-relaxed font-sans font-light">
                                        <div className="p-2 bg-accent/5 rounded-lg border border-accent/10">
                                          <strong className="text-[9px] font-mono text-accent uppercase font-bold tracking-wide block mb-0.5">Strategic Agenda:</strong>
                                          <p className="text-slate-600 dark:text-zinc-300">{m.prep.agenda || 'Align deliverables blueprint.'}</p>
                                        </div>
                                        {m.prep.preflightReminders && m.prep.preflightReminders.length > 0 && (
                                          <div className="text-slate-500 dark:text-zinc-400 space-y-1">
                                            <strong className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wide block">Preflight Reminders:</strong>
                                            <ul className="list-disc pl-3.5 space-y-0.5 text-[10px]">
                                              {m.prep.preflightReminders.slice(0, 2).map((rem: string, rIdx: number) => (
                                                <li key={rIdx}>{rem}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-400">Loading preflight briefing details...</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* EMAIL DELIVERABLES & ACTION ITEMS SUMMARY */}
                          <div className="space-y-3.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                              <span>✉️</span> Active Gmail Executive Briefing
                            </h4>
                            {gmailBriefing ? (
                              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl space-y-3 text-left">
                                <div className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300 font-sans font-light bg-white dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-white/5 shadow-xs">
                                  {gmailBriefing.executiveSummary}
                                </div>
                                {gmailBriefing.emails && gmailBriefing.emails.length > 0 && (
                                  <div className="space-y-2">
                                    <strong className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wide block">Detected Deadline Alerts & Action Prompts:</strong>
                                    <div className="space-y-2">
                                      {gmailBriefing.emails.slice(0, 2).map((mail: any, mIdx: number) => (
                                        <div key={mIdx} className="p-2.5 bg-white dark:bg-zinc-950 rounded-lg border border-slate-150 dark:border-zinc-800 flex items-center justify-between gap-3">
                                          <div className="min-w-0 text-left font-sans text-xs">
                                            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">{mail.subject}</p>
                                            <p className="text-[10px] text-slate-400 truncate">From: {mail.from}</p>
                                          </div>
                                          {mail.date && (
                                            <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[8px] font-bold font-mono tracking-wider shrink-0">
                                              Urgent
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl text-xs text-slate-400 text-center font-light">
                                Syncing executive email digests...
                              </div>
                            )}
                          </div>

                        </div>

                        {/* RIGHT HAND PANEL: SMART DOCUMENTS & RECENT SLIDES ANALYSIS (4 columns) */}
                        <div className="xl:col-span-4 space-y-6">
                          
                          {/* FILE & PRESENTATION READINESS ANALYZER */}
                          <div className="space-y-3.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                              <span>💾</span> Workspace Documents & Slides
                            </h4>
                            <div className="space-y-3">
                              {googleDriveFiles.length === 0 ? (
                                <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl text-xs text-slate-400 text-center font-light">
                                  No workspace assets found on connected Drive.
                                </div>
                              ) : (
                                googleDriveFiles.slice(0, 4).map((file: any) => {
                                  const isDoc = file.mimeType.includes('document');
                                  const isSlide = file.mimeType.includes('presentation');
                                  const fileEmoji = isDoc ? '📄' : isSlide ? '📊' : '💾';
                                  
                                  const isDocAnalyzing = analyzingDocId === file.id;
                                  const isSlideAnalyzing = analyzingSlideId === file.id;

                                  return (
                                    <div key={file.id} className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                                      <div className="min-w-0 text-left">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs shrink-0">{fileEmoji}</span>
                                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={file.name}>
                                            {file.name}
                                          </p>
                                        </div>
                                        <p className="text-[9px] text-slate-400 truncate mt-0.5 font-sans font-light">
                                          Modified {new Date(file.modifiedTime).toLocaleDateString()}
                                        </p>
                                      </div>

                                      <div className="shrink-0">
                                        {isDoc && (
                                          <button
                                            onClick={() => handleAnalyzeDoc(file.id, file.name)}
                                            disabled={!!analyzingDocId}
                                            className="px-2 py-1 bg-accent/10 hover:bg-accent hover:text-white border border-accent/15 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                                          >
                                            {isDocAnalyzing ? 'Working...' : 'Analyze'}
                                          </button>
                                        )}
                                        {isSlide && (
                                          <button
                                            onClick={() => handleAnalyzeSlides(file.id, file.name)}
                                            disabled={!!analyzingSlideId}
                                            className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500 hover:text-white border border-purple-500/15 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer text-purple-500 disabled:opacity-40"
                                          >
                                            {isSlideAnalyzing ? 'Working...' : 'Review'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* PROFESSIONAL CONTACTS RECOGNITION */}
                          <div className="space-y-3.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                              <span>👥</span> Professional Network Alerts
                            </h4>
                            {googleContactsList.length === 0 ? (
                              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl text-xs text-slate-400 text-center font-light">
                                Synchronizing executive contacts catalog...
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Identified Context:</span>
                                  <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 rounded text-[8px] font-bold uppercase tracking-wider font-mono">
                                    Secure Sync
                                  </span>
                                </div>
                                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                  {googleContactsList.slice(0, 3).map((contact: any, idx: number) => (
                                    <div key={idx} className="p-2 bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-between gap-2.5">
                                      <div className="text-left font-sans text-xs">
                                        <p className="font-bold text-slate-700 dark:text-slate-200">{contact.name}</p>
                                        <p className="text-[9px] text-slate-400">{contact.email || 'Workspace partner'}</p>
                                      </div>
                                      <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[8px] font-mono font-bold tracking-wider capitalize">
                                        {contact.role || 'Partner'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {/* DYNAMIC DOCUMENT ANALYSIS OUTPUT OVERLAY MODALS */}
                    <AnimatePresence>
                      {analyzedDoc && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs text-left"
                        >
                          <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: -15 }}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                          >
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-150 dark:border-zinc-800 pb-3">
                                <div className="space-y-0.5">
                                  <h4 className="font-display font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">
                                    Workspace Intelligence Document Report
                                  </h4>
                                  <p className="text-[11px] text-accent font-bold font-mono truncate max-w-[400px]">
                                    {analyzedDoc.fileName}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setAnalyzedDoc(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer text-lg"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 font-sans font-light text-xs leading-relaxed">
                                <div className="space-y-1 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-150 dark:border-zinc-800">
                                  <strong className="text-[9px] font-mono text-accent uppercase font-bold tracking-wide">Executive Summary:</strong>
                                  <p className="text-slate-600 dark:text-zinc-300">{analyzedDoc.summary}</p>
                                </div>

                                {analyzedDoc.actionItems && analyzedDoc.actionItems.length > 0 && (
                                  <div className="space-y-1">
                                    <strong className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wide">Action Deliverables:</strong>
                                    <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-zinc-400">
                                      {analyzedDoc.actionItems.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                                    </ul>
                                  </div>
                                )}

                                {analyzedDoc.deadlines && analyzedDoc.deadlines.length > 0 && (
                                  <div className="space-y-1">
                                    <strong className="text-[9px] font-mono text-rose-500 uppercase font-bold tracking-wide">Deadlines Detected:</strong>
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                      {analyzedDoc.deadlines.map((dl: string, idx: number) => (
                                        <span key={idx} className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[9px] font-mono font-bold tracking-wide border border-rose-500/15">
                                          {dl}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {analyzedDoc.relatedTasks && analyzedDoc.relatedTasks.length > 0 && (
                                  <div className="space-y-1">
                                    <strong className="text-[9px] font-mono text-accent uppercase font-bold tracking-wide">Suggested DueNow Smart Tasks:</strong>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-0.5">
                                      {analyzedDoc.relatedTasks.map((t: string, idx: number) => (
                                        <div key={idx} className="p-2 bg-accent/5 rounded-lg border border-accent/10 flex items-center justify-between text-[10px]">
                                          <span className="truncate pr-2 font-bold text-slate-700 dark:text-slate-350">{t}</span>
                                          <span className="text-accent shrink-0 font-bold font-mono">Suggested</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}

                      {analyzedSlide && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs text-left"
                        >
                          <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: -15 }}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                          >
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-150 dark:border-zinc-800 pb-3">
                                <div className="space-y-0.5">
                                  <h4 className="font-display font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">
                                    Submission Readiness™ Slides Report
                                  </h4>
                                  <p className="text-[11px] text-purple-500 font-bold font-mono truncate max-w-[400px]">
                                    {analyzedSlide.fileName}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setAnalyzedSlide(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer text-lg"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 font-sans font-light text-xs leading-relaxed">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-center space-y-1">
                                    <span className="text-[10px] font-mono uppercase font-bold tracking-wide text-purple-500 block">Completeness Index:</span>
                                    <span className="text-3xl font-extrabold text-purple-500 font-display">{analyzedSlide.completenessScore}%</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl text-center space-y-1 flex flex-col justify-center">
                                    <span className="text-[10px] font-mono uppercase font-bold tracking-wide text-slate-400 block">Readiness:</span>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                      analyzedSlide.readinessEvaluation?.toLowerCase().includes('ready') ? 'text-emerald-500' : 'text-amber-500'
                                    }`}>
                                      {analyzedSlide.readinessEvaluation}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-150 dark:border-zinc-800">
                                  <strong className="text-[9px] font-mono text-purple-500 uppercase font-bold tracking-wide">Slide Summary:</strong>
                                  <p className="text-slate-600 dark:text-zinc-300">{analyzedSlide.summary}</p>
                                </div>

                                {analyzedSlide.missingSections && analyzedSlide.missingSections.length > 0 && (
                                  <div className="space-y-1">
                                    <strong className="text-[9px] font-mono text-amber-500 uppercase font-bold tracking-wide">Detected Missing Sections:</strong>
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                      {analyzedSlide.missingSections.map((sec: string, idx: number) => (
                                        <span key={idx} className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-mono font-bold tracking-wide border border-amber-500/15">
                                          {sec}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {analyzedSlide.improvementRecommendations && analyzedSlide.improvementRecommendations.length > 0 && (
                                  <div className="space-y-1">
                                    <strong className="text-[9px] font-mono text-purple-500 uppercase font-bold tracking-wide">Recommended Slide Improvements:</strong>
                                    <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-zinc-450">
                                      {analyzedSlide.improvementRecommendations.map((rec: string, idx: number) => <li key={idx}>{rec}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* BENTO GRID: STATS, PROGRESS & WORKSPACE INDEXES */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* WIDGET 01: AI SUCCESS PROBABILITY™ (Circular beautiful gauge) */}
                    <div className="glass-panel p-6 sm:p-7 rounded-3xl space-y-5 relative flex flex-col justify-between shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h3 className="font-display font-bold text-base tracking-tight text-ink flex items-center gap-2">
                            <Activity className="w-4 h-4 text-accent" />
                            Success Probability™
                          </h3>
                          <p className="text-ink-muted text-[11px] font-light">Real-time analytical estimation index</p>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-2 py-1 bg-ink-faint border border-ink-faint text-accent rounded-md">
                          EST. EXPLAINABLE COGNITION
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
                        {/* Circular Progress Gauge */}
                        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center cursor-pointer select-none" onClick={() => speakText(`Your probability is estimated at ${currentProbability}% based on early workspace submissions.`)}>
                          {/* Radial Glow Layer */}
                          <div className="absolute inset-4 rounded-full bg-accent/5 blur-lg" />
                          
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="var(--ink-faint)"
                              strokeWidth="7"
                              fill="none"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="url(#probabilityGradient)"
                              strokeWidth="7.5"
                              fill="none"
                              strokeDasharray={2 * Math.PI * 40}
                              strokeDashoffset={2 * Math.PI * 40 * (1 - currentProbability / 100)}
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="probabilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FF7A3B" />
                                <stop offset="100%" stopColor="#FF4D00" />
                              </linearGradient>
                            </defs>
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-3.5xl font-extrabold tracking-tight font-display text-ink">{currentProbability}%</span>
                            <span className="text-[8px] uppercase font-mono font-bold text-ink-muted tracking-wider">ODDS</span>
                          </div>
                        </div>

                        {/* Factors breakdown */}
                        <div className="flex-1 w-full space-y-3 font-mono">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-ink-muted">
                              <span>Timeline Margin:</span>
                              <span className="text-ink font-bold">92/100</span>
                            </div>
                            <div className="h-1 bg-ink-faint rounded-full overflow-hidden">
                              <div className="bg-accent h-full rounded-full" style={{ width: '92%' }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-ink-muted">
                              <span>File Readiness:</span>
                              <span className="text-ink font-bold">{workspaceHealth}/100</span>
                            </div>
                            <div className="h-1 bg-ink-faint rounded-full overflow-hidden">
                              <div className="bg-accent h-full rounded-full transition-all duration-700" style={{ width: `${workspaceHealth}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-ink-muted">
                              <span>Action Execution Speed:</span>
                              <span className="text-ink font-bold">75/100</span>
                            </div>
                            <div className="h-1 bg-ink-faint rounded-full overflow-hidden">
                              <div className="bg-accent h-full rounded-full" style={{ width: '75%' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Recommendations to Boost */}
                      <div className="space-y-3.5 border-t border-ink-faint pt-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                          <AlertCircle className="w-4 h-4 text-accent" />
                          <span>AI Mitigation Actions (Click to apply & optimize odds)</span>
                        </div>
                        
                        <div className="space-y-2">
                          {[
                            { id: 'rec_01', text: 'Review presentation structure draft', boost: 6 },
                            { id: 'rec_02', text: 'Complete Drizzle Schema parameters', boost: 7 }
                          ].map((rec) => {
                             const isDone = completedRecommendations.includes(rec.id);
                             return (
                               <button
                                 key={rec.id}
                                 onClick={() => toggleRecommendation(rec.id, rec.boost)}
                                 className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex justify-between items-center cursor-pointer ${
                                   isDone 
                                     ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                                     : 'bg-ink-faint border-ink-faint text-ink-muted hover:border-accent/20 hover:bg-ink-faint/80'
                                 }`}
                               >
                                 <span className={isDone ? 'line-through opacity-80' : ''}>{rec.text}</span>
                                 <span className={`font-bold font-mono shrink-0 text-[10px] uppercase ml-3 ${isDone ? 'text-emerald-500' : 'text-accent'}`}>
                                   {isDone ? 'applied' : `+${rec.boost}% odds`}
                                 </span>
                               </button>
                             );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* WIDGET 02: ACTIVE WORKSPACE HEALTH™ (Directory scanner simulation) */}
                    <div className="glass-panel p-6 sm:p-7 rounded-3xl space-y-5 relative flex flex-col justify-between shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h3 className="font-display font-bold text-base tracking-tight text-ink flex items-center gap-2">
                            <FolderGit2 className="w-4 h-4 text-accent" />
                            Workspace Health™
                          </h3>
                          <p className="text-ink-muted text-[11px] font-light">Interactive workspace directories sync metrics</p>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-2 py-1 bg-ink-faint border border-ink-faint text-accent rounded-md">
                          DIR: /src/blueprint
                        </span>
                      </div>

                      {/* Diagnostic details */}
                      <div className="p-4 bg-ink-faint border border-ink-faint rounded-2xl flex items-start gap-4">
                        <div className="relative shrink-0 w-12 h-12 flex items-center justify-center bg-accent/10 border border-accent/20 rounded-xl text-accent shadow-inner">
                          {isScanning ? (
                            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                          ) : (
                            <Cpu className="w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-ink uppercase tracking-wide">Workspace Readiness:</span>
                            <span className="text-xs font-bold font-display text-accent">{workspaceHealth}% Health</span>
                          </div>
                          <p className="text-[11px] text-ink-muted leading-normal font-light font-sans">
                            {isScanning ? 'Deep-parsing active document metadata...' : 'Integrity index calculated from documentation completeness and workspace structure.'}
                          </p>
                        </div>
                      </div>

                      {/* Missing items warnings */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-widest block">Missing Target Handshakes:</span>
                        {missingFiles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {missingFiles.map((file) => (
                              <span 
                                key={file} 
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-ink-faint rounded-full text-[10px] font-mono font-bold tracking-wider text-rose-500 dark:text-rose-400"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {file}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Workspace verified complete. Ready for final evaluation parameters.</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons trigger scans */}
                      <div className="flex gap-3 pt-2">
                        <motion.button
                          onClick={handleWorkspaceScan}
                          disabled={isScanning}
                          className="flex-1 py-3 bg-ink-faint border border-ink-faint hover:bg-ink-faint/80 text-ink-muted hover:text-ink rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {isScanning ? 'Scanning Workspace...' : 'Simulate Workspace Scan'}
                        </motion.button>
                        
                        <motion.button
                          onClick={() => {
                            speakText("All active submission checklists have been validated against our guidelines.");
                          }}
                          className="px-4 py-3 bg-accent/15 hover:bg-accent/25 border border-accent/20 text-accent hover:text-accent/90 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          whileHover={{ scale: 1.01 }}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span className="hidden sm:inline">Verify Logs</span>
                        </motion.button>
                      </div>

                    </div>

                  </div>

                  {/* TIMELINE SECTION & QUICK RECOMMENDATIONS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* TODAY'S EXECUTION TIMELINE */}
                    <div className="lg:col-span-2 glass-panel p-6 sm:p-7 rounded-3xl space-y-5 relative shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h3 className="font-display font-bold text-base tracking-tight text-ink flex items-center gap-2">
                            <Clock className="w-4 h-4 text-accent" />
                            Today's Timeline
                          </h3>
                          <p className="text-ink-muted text-[11px] font-light">Structured execution agenda sequences</p>
                        </div>
                        <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest font-bold">5 EVENTS ACTIVATED</span>
                      </div>

                      {/* Timeline cards sequence */}
                      <div className="space-y-4 pt-1">
                        {[
                          { id: 't1', time: '09:00', title: 'Workspace Pre-flight Alignment', duration: '45m', priority: 'medium', icon: Compass },
                          { id: 't2', time: '10:30', title: 'Synchronize Custom DB Schemas', duration: '1h 30m', priority: 'high', icon: Cpu },
                          { id: 't3', time: '13:00', title: 'Calibrate Companion Core NLP Settings', duration: '1h', priority: 'medium', icon: Sparkles },
                          { id: 't4', time: '15:00', title: 'Compile Final Workspace Deliverables', duration: '2h', priority: 'high', icon: ShieldCheck }
                        ].map((item, index) => {
                          const isDone = timelineChecked.includes(item.id);
                          const ItemIcon = item.icon;
                          return (
                            <div key={item.id} className="relative flex gap-4">
                              {/* Left line tracking node */}
                              <div className="flex flex-col items-center">
                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isDone ? 'bg-accent border-accent' : 'bg-bg border-ink-faint'
                                }`}>
                                  {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                </div>
                                {index !== 3 && (
                                  <div className="w-0.5 flex-grow bg-ink-faint my-1" />
                                )}
                              </div>

                              {/* Card detail */}
                              <div className={`flex-1 glass-panel-hover p-4 border rounded-2xl flex items-center justify-between gap-4 transition-all ${
                                isDone ? 'bg-accent/5 border-accent/10 opacity-70' : 'bg-ink-faint border-ink-faint'
                              }`}>
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-2.5 rounded-xl bg-bg border border-ink-faint text-ink-muted shrink-0">
                                    <ItemIcon className="w-4 h-4" />
                                  </div>
                                  <div className="space-y-1 text-left min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono text-accent font-bold">{item.time}</span>
                                      <span className={`text-[8px] font-mono uppercase font-bold tracking-wider px-1.5 rounded-sm ${
                                        item.priority === 'high' ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400' : 'bg-accent/10 text-accent'
                                      }`}>
                                        {item.priority}
                                      </span>
                                    </div>
                                    <h4 className={`text-xs font-bold text-ink truncate ${isDone ? 'line-through opacity-80' : ''}`}>{item.title}</h4>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-[10px] font-mono text-ink-muted font-semibold">{item.duration}</span>
                                  
                                  {/* Interactive toggle */}
                                  <button
                                    onClick={() => toggleTimelineCheck(item.id)}
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center hover:bg-ink-faint cursor-pointer transition-all ${
                                      isDone ? 'border-accent bg-accent text-white' : 'border-ink-faint text-ink-muted'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* QUICK ACTION BUTTONS */}
                    <div className="glass-panel p-6 sm:p-7 rounded-3xl space-y-4 relative flex flex-col justify-between shadow-xl">
                      <div className="space-y-0.5">
                        <h3 className="font-display font-bold text-base tracking-tight text-ink flex items-center gap-2">
                          <Compass className="w-4 h-4 text-accent" />
                          Companion Quick Commands
                        </h3>
                        <p className="text-ink-muted text-[11px] font-light">Deploy NLP triggers on mock services</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { text: 'Optimize My Day', desc: 'Recalibrates schedule times', voice: 'Calibrating optimal execution timelines. Priority margins resolved.' },
                          { text: 'Organize Workspace', desc: 'Syncs missing deliverables', voice: 'Scanning folders for project alignment. Guidelines checked.' },
                          { text: 'Prepare Milestone Submission', desc: 'Fires pre-flight checklist', voice: 'Running pre-flight diagnostics on workspace code. All checks verified green.' },
                          { text: 'Review Calendar Overlaps', desc: 'Flags schedule conflicts', voice: 'Scanning calendar events. No conflict warnings found for the next forty eight hours.' },
                        ].map((btn) => (
                          <motion.button
                            key={btn.text}
                            onClick={() => speakText(btn.voice)}
                            className="w-full p-3.5 bg-ink-faint hover:bg-ink-faint/80 border border-ink-faint hover:border-accent/30 rounded-2xl text-left transition-all flex items-center justify-between gap-3 group cursor-pointer"
                            whileHover={{ x: 3 }}
                          >
                            <div className="text-left min-w-0">
                              <span className="block text-xs font-bold text-ink group-hover:text-accent transition-colors">{btn.text}</span>
                              <span className="block text-[10px] text-ink-muted font-light mt-0.5">{btn.desc}</span>
                            </div>
                            <Play className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform shrink-0" />
                          </motion.button>
                        ))}
                      </div>

                    </div>

                  </div>

                </motion.div>
              )}

              {/* ACTIVE SECTIONS INTERACTIVE ROUTING */}
              {activeSection === 'briefing' && (
                <motion.div
                  key="briefing"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <ExecutiveBriefing />
                </motion.div>
              )}

              {activeSection === 'focus_mode' && (
                <motion.div
                  key="focus_mode"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <FocusSession />
                </motion.div>
              )}

              {activeSection === 'reminders' && (
                <motion.div
                  key="reminders"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <ReminderCenter />
                </motion.div>
              )}

              {activeSection === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <ExecutionAnalytics />
                </motion.div>
              )}

              {activeSection === 'workspaces' && (
                <motion.div
                  key="workspaces"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <WorkspaceSection onScanComplete={(newHealth) => {
                    setWorkspaceHealth(newHealth);
                    speakText(`Workspace diagnostics completed. Integrity Index recalculating. Current index: ${newHealth} percent.`);
                  }} />
                </motion.div>
              )}

              {activeSection === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <TaskSection />
                </motion.div>
              )}

              {activeSection === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <ExecutionTimeline />
                </motion.div>
              )}

              {activeSection === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <ExecutiveInsightsTab />
                </motion.div>
              )}

              {activeSection === 'goals' && (
                <motion.div
                  key="goals"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <GoalsAutomationsTab />
                </motion.div>
              )}

              {activeSection === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <AvatarCustomizer />
                </motion.div>
              )}

              {activeSection === 'presentation' && (
                <motion.div
                  key="presentation"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full"
                >
                  <PresentationMode 
                    activeSection={activeSection} 
                    setActiveSection={setActiveSection} 
                    speakText={speakText} 
                  />
                </motion.div>
              )}

              {activeSection === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="glass-panel p-10 rounded-3xl space-y-8 text-center max-w-xl mx-auto shadow-2xl relative"
                >
                  <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-accent/10 rounded-full blur-[50px] pointer-events-none" />
                  
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-inner">
                      <Bell className="w-7 h-7 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/5 border border-accent/20 rounded-full text-[10px] font-mono font-bold tracking-wider text-accent">
                      SECURED NOTIFICATION HUB
                    </span>
                    <h3 className="font-display font-black text-2xl tracking-tight text-ink uppercase">
                      Notifications Verified Clear
                    </h3>
                    <p className="text-ink-muted text-xs leading-relaxed max-w-xs mx-auto font-sans font-light">
                      All security clearances, build warnings, and timeline reminders are synced silently to your companion logs. No latency alerts active.
                    </p>
                  </div>

                  <div className="pt-4 max-w-xs mx-auto">
                    <motion.button
                      onClick={() => setActiveSection('dashboard')}
                      className="w-full py-3.5 bg-accent hover:opacity-90 rounded-xl font-bold text-bg tracking-wider shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LayoutDashboard className="w-4 h-4 text-bg" />
                      <span>Return To Dashboard</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {activeSection === 'ai_chat' && (
                <motion.div
                  key="ai_chat"
                  initial={{ opacity: 0, scale: 0.99, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.99, y: -10 }}
                  className="w-full flex flex-col gap-6"
                >
                  {/* Executive Header */}
                  <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-xl border border-ink-faint">
                    <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-accent/5 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent text-2xl shadow-inner">
                        {persona.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display font-black text-lg tracking-tight text-ink uppercase">AI Executive Workspace</h2>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider animate-pulse">Sync Active</span>
                        </div>
                        <p className="text-ink-muted text-xs font-light mt-0.5">Converse with your high-performance companion {persona.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-ink-faint px-3.5 py-2 rounded-xl border border-ink-faint">
                      <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                      <span className="text-[10px] font-mono text-ink-muted font-bold uppercase tracking-wide">Mode: Multi-Turn Reasoning (Gemini)</span>
                    </div>
                  </div>

                  {/* Main Conversation Canvas Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    
                    {/* Log View (Columns 1 & 2) */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col h-[520px] relative shadow-xl overflow-hidden border border-ink-faint">
                      
                      {/* Interactive Conversation Logs scroll container */}
                      <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4 select-text">
                        {chatMessages.map((msg) => (
                          <div 
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
                          >
                            {msg.sender === 'ai' && (
                              <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-base shrink-0 select-none">
                                {persona.emoji}
                              </div>
                            )}

                            <div className={`max-w-[85%] rounded-2xl p-4 text-left border ${
                              msg.sender === 'user'
                                ? 'bg-gradient-to-r from-accent/15 to-bg/80 border-accent/20 text-ink rounded-tr-none'
                                : 'bg-ink-faint border-ink-faint text-ink rounded-tl-none'
                            }`}>
                              {msg.sender === 'user' ? (
                                <p className="text-xs font-light leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              ) : (
                                <div className="space-y-4">
                                  <MarkdownViewer text={msg.text} />
                                  
                                  {/* RENDER DYNAMIC ACTION CARDS */}
                                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 pt-3 border-t border-ink-faint mt-3 select-none">
                                      <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest block mb-1">PROPOSED DIRECTIVE DETECTED</span>
                                      {msg.suggestedActions.map((act: any, idx: number) => (
                                        <motion.div
                                          key={idx}
                                          className="p-3.5 rounded-xl bg-accent/5 border border-accent/25 flex items-center justify-between gap-4 hover:border-accent/50 transition-colors shadow-lg"
                                          whileHover={{ scale: 1.01 }}
                                        >
                                          <div className="text-left min-w-0">
                                            <span className="block text-xs font-bold text-ink">{act.title}</span>
                                            {act.taskData && (
                                              <span className="block text-[9px] text-accent/80 font-mono mt-0.5">
                                                Priority: {act.taskData.priority} • Dur: {act.taskData.estimatedDuration}m
                                              </span>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => handleExecuteAction(act)}
                                            className="px-3.5 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
                                          >
                                            Confirm
                                          </button>
                                        </motion.div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="text-[9px] text-ink-muted/60 font-mono text-right mt-1.5 block select-none">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>

                            {msg.sender === 'user' && (
                              <div className="w-8 h-8 rounded-xl bg-ink-faint border border-ink-faint flex items-center justify-center text-xs text-ink-muted font-bold shrink-0 select-none">
                                {userProfile?.name ? userProfile.name.slice(0, 2).toUpperCase() : 'ME'}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Animated Processing Thinking Bubble */}
                        {(isChatLoading || isProcessing) && (
                          <div className="flex justify-start items-start gap-3 select-none">
                            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-base shrink-0">
                              ⚙️
                            </div>
                            <div className="max-w-[85%] rounded-2xl rounded-tl-none p-4 bg-ink-faint border border-ink-faint text-left flex items-center gap-2">
                              <span className="text-xs text-accent font-medium tracking-wide">Computing response parameters</span>
                              <div className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Prompt Starters / Suggestion Chips */}
                      <div className="flex items-center gap-2 overflow-x-auto py-2.5 border-t border-ink-faint select-none scrollbar-none shrink-0">
                        <span className="text-[9px] font-mono font-bold text-ink-muted/60 uppercase tracking-widest mr-1 shrink-0">Prompts:</span>
                        {[
                          { text: 'Add draft task', prompt: 'Add a high priority task for slide deck review with 30m duration' },
                          { text: 'Sync workspace files', prompt: 'Scan my workspace health' },
                          { text: 'Assess Success probability', prompt: 'Tell me how to maximize my success probability index today' },
                          { text: 'Mentor briefing', prompt: 'Give me an overview of outstanding bottlenecks' }
                        ].map((chip) => (
                          <button
                            key={chip.text}
                            onClick={() => handleSendChatMessage(chip.prompt)}
                            className="px-3.5 py-1.5 bg-ink-faint hover:bg-ink-faint/80 border border-ink-faint hover:border-accent/30 rounded-full text-[10px] text-ink-muted hover:text-accent transition-all font-sans font-medium whitespace-nowrap cursor-pointer"
                          >
                            {chip.text}
                          </button>
                        ))}
                      </div>

                      {/* Input Dock */}
                      <div className="flex items-center gap-3.5 pt-3 border-t border-ink-faint shrink-0 select-none">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                          placeholder={`Message ${persona.title.split(' ')[0]} (e.g., "Analyze my presentation draft")...`}
                          disabled={isChatLoading || isProcessing}
                          className="flex-1 px-4.5 py-3.5 rounded-2xl glass-input text-xs font-light text-ink placeholder:text-ink-muted/40 focus:outline-none focus:border-accent/60 disabled:opacity-50"
                        />
                        <button
                          onClick={() => handleSendChatMessage()}
                          disabled={isChatLoading || isProcessing || !chatInput.trim()}
                          className="px-5 py-3.5 bg-accent hover:bg-accent/90 disabled:bg-ink-faint disabled:opacity-40 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                        >
                          Send
                        </button>
                      </div>

                    </div>

                    {/* Left: Interactive 3D AI Orb Stage & Voice Config */}
                    <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between items-center h-[520px] relative shadow-xl overflow-hidden border border-ink-faint text-center">
                      <div className="absolute top-[-20%] left-[-20%] w-[150px] h-[150px] bg-accent/10 rounded-full blur-[40px] pointer-events-none" />
                      
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-mono font-bold tracking-wider text-accent uppercase">
                          Vocal Resonance Core
                        </span>
                        <h3 className="font-display font-bold text-base text-ink mt-1">Interactive AI Orb</h3>
                        <p className="text-ink-muted text-[11px] font-sans font-light max-w-xs leading-relaxed">
                          Click the main node or use the global bottom voice dock to trigger direct acoustic command sequences.
                        </p>
                      </div>

                      {/* Main Center Stage 3D Glowing AI Orb */}
                      <div className="my-6 relative flex items-center justify-center">
                        {/* Glow halo backgrounds */}
                        <div className={`absolute w-36 h-36 rounded-full blur-[35px] transition-all duration-700 ${
                          isListening 
                            ? 'bg-red-500/20' 
                            : isSpeaking 
                            ? 'bg-emerald-500/20' 
                            : isProcessing 
                            ? 'bg-amber-500/20'
                            : 'bg-accent/10'
                        }`} />

                        {/* Ripple echo expanding rings for speaking */}
                        {isSpeaking && (
                          <>
                            <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                            <div className="absolute -inset-4 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDuration: '3s' }} />
                          </>
                        )}

                        <motion.button
                          onClick={isListening ? stopListening : startListening}
                          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border text-white relative shadow-2xl transition-all duration-500 cursor-pointer ${
                            isListening 
                              ? 'bg-gradient-to-tr from-red-600 to-rose-700 border-red-500/30 animate-orb-listening' 
                              : isProcessing 
                              ? 'bg-gradient-to-tr from-amber-500 to-amber-700 border-amber-500/30 animate-orb-thinking'
                              : isSpeaking 
                              ? 'bg-gradient-to-tr from-emerald-500 to-emerald-700 border-emerald-500/30 animate-orb-listening' 
                              : 'bg-gradient-to-tr from-accent to-accent/80 border-accent/20 animate-orb-breathing'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 select-none">
                            {isListening ? (
                              <>
                                <MicOff className="w-7 h-7" />
                                <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold text-white/90">MUTE</span>
                              </>
                            ) : isProcessing ? (
                              <>
                                <RefreshCw className="w-7 h-7 animate-spin" />
                                <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold text-white/90">THINK</span>
                              </>
                            ) : isSpeaking ? (
                              <>
                                <Volume2 className="w-7 h-7" />
                                <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold text-white/90">SPEAK</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-7 h-7 animate-pulse" />
                                <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold text-white/90">SPEAK</span>
                              </>
                            )}
                          </div>
                        </motion.button>
                      </div>

                      {/* Active Profile Info */}
                      <div className="w-full bg-ink-faint border border-ink-faint rounded-2xl p-4 text-left space-y-3.5 select-none">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{persona.emoji}</span>
                          <div>
                            <span className="text-[9px] font-mono text-accent uppercase font-bold tracking-wider">Acoustic Tone Preset</span>
                            <h4 className="text-xs font-bold text-ink">{persona.title} Style</h4>
                          </div>
                        </div>
                        <p className="text-[10px] text-ink-muted leading-relaxed font-light">{persona.description}</p>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

        {/* RIGHT AI COMPANION MEMORY & MEMORY LOGS PANEL */}
        <aside className="w-76 border-l border-ink-faint bg-bg/40 backdrop-blur-lg p-6 hidden xl:flex flex-col justify-between shrink-0 space-y-6">
          
          {/* Section 01: Companion Profile Badge details */}
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest block">ACTIVE COMPANION STATUS</span>
              <div className="p-4 bg-ink-faint border border-ink-faint rounded-2xl flex items-center gap-3.5 shadow-inner">
                <div className="text-2xl">{persona.emoji}</div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-ink font-display truncate">{persona.title}</h4>
                  <span className="text-[9px] font-mono text-emerald-500 font-bold block mt-0.5">ONLINE & INITIATED</span>
                </div>
              </div>
            </div>

            {/* Profile specifications memory logs */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-ink-muted/60 uppercase tracking-widest block">COMPANION MEMORY</span>
              <div className="p-4 bg-ink-faint border border-ink-faint rounded-2xl space-y-4 shadow-inner text-left">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wide">Target Executive:</span>
                  <p className="text-xs text-ink font-bold leading-snug">{userProfile?.name || 'Partner Executive'}</p>
                </div>
                
                <div className="space-y-1.5 border-t border-ink-faint pt-3">
                  <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wide">Workspace Objective:</span>
                  <p className="text-xs text-ink-muted leading-relaxed font-light font-sans">Ashvita is coordinating deep checklist submissions for the Silicon Valley hackathon review.</p>
                </div>

                <div className="space-y-1.5 border-t border-ink-faint pt-3">
                  <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wide">NLP Acoustic Sync:</span>
                  <p className="text-[11px] text-ink-muted font-light font-sans">Currently speech synthesized under <span className="text-accent font-bold font-mono">{preferences?.voicePreference || 'Zephyr'}</span> preset.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Core analytical execution rating */}
          <div className="space-y-5">
            <div className="p-4.5 bg-accent/5 border border-accent/10 rounded-2xl flex items-start gap-3.5 shadow-inner">
              <div className="p-2 bg-accent/15 border border-accent/20 text-accent rounded-xl shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-ink uppercase font-mono tracking-wider">WORKSPACE METRIC RATINGS</h4>
                <p className="text-[10px] text-ink-muted leading-relaxed font-light">
                  All synchronization logs are registered locally on secure Firebase nodes for complete enterprise confidentiality.
                </p>
              </div>
            </div>

            {/* Platform indicators info */}
            <div className="text-[10px] text-ink-muted/50 font-mono text-center pt-2 uppercase tracking-wide border-t border-ink-faint">
              Secure Sandbox Hands-Free RC1
            </div>
          </div>

        </aside>

      </div>

      <ProductTour 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />

    </div>
  );
};
