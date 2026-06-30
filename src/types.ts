/**
 * DueNow Domain Type Definitions (Single Source of Truth)
 * Aligned with the DueNow Product Bible.
 */

export type VoicePersonality = 'mentor' | 'best_friend' | 'professional' | 'coach';

export interface WorkingHours {
  start: string; // e.g., "09:00"
  end: string;   // e.g., "17:00"
  timezone: string; // e.g., "America/New_York"
}

export interface UserProfile {
  email: string;
  name: string;
  personality: VoicePersonality;
  workingHours: WorkingHours;
  googleConnected?: boolean;
  googleConnectedAt?: number;
  googleScopes?: string[];
}

export interface UserPreferences {
  voicePreference: string; // e.g. "Kore", "Puck", "Zephyr"
  theme: 'light' | 'dark';
  reminderStyle: 'professional' | 'motivational' | 'casual';
}

export interface AssistantMemory {
  assistantName: string;
  conversationSummary: string;
  lastUpdate: number; // timestamp
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical' | 'ai_recommended';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Attachment {
  name: string;
  url: string;
  size: string;
}

export interface SuccessProbabilityFactor {
  name: string;      // "Time Available", "Task Complexity", etc.
  score: number;     // 0-100
  weight: number;    // e.g., 0.30
}

export interface SuccessProbabilityRecommendation {
  action: string;
  expectedImprovement: number; // percentage improvement, e.g., 12
}

export interface SuccessProbability {
  current: number; // 0-100
  factors: SuccessProbabilityFactor[];
  recommendations: SuccessProbabilityRecommendation[];
  confidence?: 'high' | 'medium' | 'low';
  trend?: string; // e.g. "+3%", "-5%", "stable"
  topRisks?: string[];
  whyExplanation?: string;
  howExplanation?: string;
}

export interface Task {
  taskId: string;
  title: string;
  description?: string;
  deadline: number; // timestamp (seconds or milliseconds)
  status: TaskStatus;
  priority: TaskPriority;
  estimatedDuration: number; // in minutes
  workspaceId: string;
  successProbability: SuccessProbability;
  createdAt: number; // timestamp
  completedAt: number | null; // timestamp or null
  category?: string; // e.g. "coding" | "documentation" | "presentation" | "design" | "research" | "other"
  notes?: string;
  checklist?: ChecklistItem[];
  tags?: string[];
  attachments?: Attachment[];
  isArchived?: boolean;
  order?: number; // for drag-and-drop ordering
}

export interface ExecutionScore {
  score: number; // 0-100
  tasksCompletedToday: number;
  focusSessions: number;
  consistency: number; // 0-100
  deadlinesMet: number; // 0-100
  dailyProductivity: number; // 0-100
}

export interface TimelineBlock {
  id: string;
  time: string; // e.g. "09:00 AM"
  period: 'morning' | 'afternoon' | 'evening';
  title: string;
  type: 'task' | 'meeting' | 'preparation' | 'break' | 'focus';
  duration: string; // e.g. "45m"
  priority: TaskPriority;
  workspaceId: string;
  voiceText: string;
  progress: number; // 0-100
  completed: boolean;
  estimatedCompletion?: string;
}

export interface PlanningResult {
  todayPlan: TimelineBlock[];
  weeklyPlan: { day: string; tasksCount: number; focusHours: number }[];
  focusBlocksCount: number;
  bufferTimeMins: number;
  prepSessionsCount: number;
  recommendations: {
    action: string;
    reason: string;
    expectedBenefit: string;
    estimatedTimeSaved: number; // mins
    expectedSuccessProbabilityImprovement: number; // %
  }[];
}

export interface WorkspaceFile {
  fileId?: string;
  name: string;
  category: 'code' | 'documentation' | 'presentation' | 'image' | 'data' | 'unknown';
  mimeType?: string;
  size?: string;
  url?: string;
  uploadedAt?: number;
  summary?: string;
  importantInfo?: string[];
  keywords?: string[];
  deadlines?: string[];
  actionItems?: string[];
  suggestedTasks?: string[];
  recommendations?: string[];
}

export interface HealthFactors {
  documentation: number; // max 25
  organization: number;  // max 25
  submissionFiles: number; // max 25
  projectStructure: number; // max 25
}

export interface SubmissionReadiness {
  score: number;
  requiredActions: { action: string; category: string; completed: boolean }[];
  estimatedCompletionTime: string;
  checklist: { name: string; checked: boolean; type: 'readme' | 'presentation' | 'code' | 'video' | 'architecture' | 'other' }[];
}

export interface WorkspaceRecommendation {
  action: string;
  reason: string;
  expectedImpact: string;
  category: string;
}

export interface Workspace {
  workspaceId: string;
  name: string;
  description?: string;
  type: 'hackathon' | 'interview' | 'college' | 'custom' | 'startup' | 'office' | 'research' | 'personal';
  health: number; // 0-100
  healthFactors?: HealthFactors;
  folderPath: string;
  files: WorkspaceFile[];
  lastScanned: number; // timestamp
  submissionReady: boolean;
  missingComponents: string[];
  projectSummary: string;
  icon?: string;
  color?: string;
  deadline?: number;
  status?: 'active' | 'completed' | 'pending' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'ai_recommended';
  progress?: number;
  successProbability?: number;
  createdAt?: number;
  updatedAt?: number;
  owner?: string;
  tags?: string[];
  submissionReadiness?: SubmissionReadiness;
  recommendations?: WorkspaceRecommendation[];
  aiProjectSummary?: {
    executiveSummary: string;
    currentProgress: string;
    topRisks: string[];
    nextActions: string[];
    deadlines: string[];
    completionEstimate: string;
  };
}

export interface ConversationMessage {
  conversationId: string;
  timestamp: number; // timestamp
  userInput: string;
  aiResponse: string;
  intent: string; // e.g., "create_task", "reschedule_task", "analyze_workspace", "question_probability", etc.
  confidence: number; // 0.0 - 1.0
  reasoning?: string;
}

export interface Reminder {
  reminderId: string;
  taskId: string;
  scheduledTime: number; // timestamp
  reminderType: 'motivational' | 'professional' | 'warning';
  message: string;
  sent: boolean;
  personality: VoicePersonality;
}

export interface CalendarEvent {
  eventId: string;
  title: string;
  startTime: number; // timestamp
  endTime: number;   // timestamp
  description?: string;
  attendees?: string[];
  conflicts?: string[]; // IDs of overlapping events
}

// Service API communication payloads
export interface AIChatRequest {
  input: string;
  inputType: 'text' | 'voice';
  sessionId: string;
}

export interface SuggestedAction {
  action: string; // e.g., "create_task"
  title: string;
  requiresConfirmation: boolean;
  taskData?: Partial<Task>;
}

export interface AIChatResponse {
  sessionId: string;
  aiResponse: string;
  intent: string;
  suggestedActions?: SuggestedAction[];
  confidence: number;
}

export interface AIConfirmActionRequest {
  sessionId: string;
  action: string;
  taskData?: Partial<Task>;
  confirmed: boolean;
}

export interface AIConfirmActionResponse {
  executed: boolean;
  result: {
    taskId?: string;
    successProbability?: number;
  };
}

export interface AIDailyBriefingResponse {
  greeting: string;
  priorities: {
    title: string;
    deadline: string;
    probability: number;
    urgency: 'low' | 'medium' | 'critical';
  }[];
  schedule: {
    time: string;
    event: string;
    duration: number; // in minutes
  }[];
  highestRisk: string;
  recommendation: string;
}

// --- MODULE 10: EXECUTIVE INTELLIGENCE, GOALS, AUTOMATIONS, INSIGHTS ---

export interface GoalMilestone {
  id: string;
  title: string;
  targetDate: number; // timestamp
  completed: boolean;
}

export interface Goal {
  goalId: string;
  title: string;
  objective: string;
  targetDate: number; // timestamp
  relatedTasks: string[]; // taskIds
  relatedWorkspaces: string[]; // workspaceIds
  relatedDocuments: string[]; // file names or IDs
  milestones: GoalMilestone[];
  completionPercentage: number; // 0-100
  currentRisks: string[];
  successProbability: number; // 0-100
  executiveSummary: string;
  createdAt: number;
  status: 'active' | 'completed' | 'on_hold' | 'at_risk';
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerCondition: 'success_probability_drop' | 'submission_readiness_drop' | 'meeting_tomorrow' | 'interview_detected' | 'daily_digest';
  thresholdValue?: number; // e.g. 60 for 60%
  actionType: 'notify' | 'recommend_deliverables' | 'schedule_prep' | 'suggest_review';
  actionDescription: string;
  enabled: boolean;
  lastTriggered?: number;
}

export interface AdaptivePreferences {
  preferredWorkStart: string; // e.g. "08:30"
  preferredWorkEnd: string; // e.g. "18:00"
  preferredFocusDuration: number; // in mins, e.g. 45
  preferredReminderTiming: number; // mins before deadline, e.g. 30
  preferredMeetingBuffer: number; // in mins, e.g. 15
  communicationStyle: 'brief' | 'detailed' | 'analytical' | 'supportive';
  aiProactivity: 'high' | 'medium' | 'low';
}

export interface AIReasoningLog {
  decisionId: string;
  timestamp: number;
  request: string;
  gatheredContext: string[];
  deadlineAnalysis: string;
  calendarAnalysis: string;
  successProbabilityImpact: string;
  preferredOption: string;
  alternativeOptions: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100
  explanation: string;
}

export interface ExecutiveInsights {
  weeklyProductivity: { day: string; score: number; completedCount: number }[];
  workspaceImprovements: { name: string; beforeScore: number; afterScore: number }[];
  executionTrends: { week: string; efficiency: number; consistency: number }[];
  recommendationHistory: { action: string; impact: string; status: 'applied' | 'ignored' }[];
  goalProgress: { title: string; percentage: number }[];
  planningQualityScore: number; // 0-100
  successProbabilityTrend: { date: string; probability: number }[];
  aiConfidenceTrend: { date: string; confidence: number }[];
}

