import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDb,
} from '../firestoreAdminCompat.js';
import { Task, Workspace, ConversationMessage, Reminder, UserProfile, UserPreferences, TimelineBlock, ExecutionScore, Goal, AutomationRule, AdaptivePreferences, AIReasoningLog } from '../../src/types.js';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

// Global error handler mandated by the firebase-integration skill
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId?: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isNotFoundError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || String(error)).toUpperCase();
  return (
    msg.includes('NOT_FOUND') ||
    msg.includes('NOT-FOUND') ||
    error.code === 5 ||
    error.code === 'not-found'
  );
}

const initializationPromises = new Map<string, Promise<void>>();

export class DataService {
  static async ensureUserInitialized(userId: string): Promise<void> {
    let promise = initializationPromises.get(userId);
    if (!promise) {
      promise = (async () => {
        const db = getDb();
        const now = Date.now();

        // STEP 1: Check whether users/{userId} exists. If not, create it immediately.
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          const defaultUserData = {
            uid: userId,
            email: 'alex.executive@example.com',
            displayName: 'Alex',
            photoURL: '',
            createdAt: now,
            lastLogin: now,
            appVersion: '1.0.0',
            version: '1.0.0'
          };
          await setDoc(userDocRef, defaultUserData);
          console.log(`[InitEngine] Created user root document for ${userId}`);
        }

        // STEP 2: Check default singleton documents and create missing ones in a single Batch
        const singletonRefs = [
          {
            path: `users/${userId}/profile/info`,
            ref: doc(db, 'users', userId, 'profile', 'info'),
            default: {
              email: 'alex.executive@example.com',
              name: 'Alex',
              personality: 'mentor',
              workingHours: { start: '09:00', end: '17:00', timezone: 'America/New_York' }
            }
          },
          {
            path: `users/${userId}/preferences/settings`,
            ref: doc(db, 'users', userId, 'preferences', 'settings'),
            default: {
              voicePreference: 'Zephyr',
              theme: 'light',
              reminderStyle: 'professional'
            }
          },
          {
            path: `users/${userId}/preferences/adaptive`,
            ref: doc(db, 'users', userId, 'preferences', 'adaptive'),
            default: {
              preferredWorkStart: '09:00',
              preferredWorkEnd: '17:00',
              preferredFocusDuration: 45,
              preferredReminderTiming: 30,
              preferredMeetingBuffer: 15,
              communicationStyle: 'analytical',
              aiProactivity: 'high'
            }
          },
          {
            path: `users/${userId}/analytics/current`,
            ref: doc(db, 'users', userId, 'analytics', 'current'),
            default: {
              workspaceScansCount: 1,
              focusSessionsCompleted: 0,
              averageTaskScore: 85,
              lastCalculated: now
            }
          },
          {
            path: `users/${userId}/workspace_health/current`,
            ref: doc(db, 'users', userId, 'workspace_health', 'current'),
            default: {
              overallHealth: 85,
              criticalWarningsCount: 0,
              complianceScore: 90,
              lastUpdated: now
            }
          },
          {
            path: `users/${userId}/submission_readiness/current`,
            ref: doc(db, 'users', userId, 'submission_readiness', 'current'),
            default: {
              readinessScore: 80,
              missingComponents: [],
              estimatedDelivery: '7 days',
              verified: true,
              lastCalculated: now
            }
          },
          {
            path: `users/${userId}/timeline/today`,
            ref: doc(db, 'users', userId, 'timeline', 'today'),
            default: {
              blocks: [
                {
                  id: 'init-block-1',
                  time: '09:00 AM',
                  period: 'morning',
                  title: 'Review executive workspace diagnostics',
                  type: 'focus',
                  duration: '30m',
                  priority: 'high',
                  workspaceId: 'default',
                  voiceText: 'Welcome to DueNow. Let us review the cockpit setup.',
                  progress: 100,
                  completed: true
                }
              ]
            }
          },
          {
            path: `users/${userId}/recommendations/active`,
            ref: doc(db, 'users', userId, 'recommendations', 'active'),
            default: {
              recs: [
                { action: 'Upload project instructions to automatically scan workspace health.', expectedImprovement: 15 }
              ]
            }
          },
          {
            path: `users/${userId}/execution_history/current`,
            ref: doc(db, 'users', userId, 'execution_history', 'current'),
            default: {
              score: 85,
              tasksCompletedToday: 0,
              focusSessions: 0,
              consistency: 85,
              deadlinesMet: 90,
              dailyProductivity: 85
            }
          },
          {
            path: `users/${userId}/conversation_settings/current`,
            ref: doc(db, 'users', userId, 'conversation_settings', 'current'),
            default: {
              autoSummarize: true,
              proactivity: 'high',
              maxHistoryTurns: 50,
              updatedAt: now
            }
          },
          {
            path: `users/${userId}/notifications/settings`,
            ref: doc(db, 'users', userId, 'notifications', 'settings'),
            default: {
              emailEnabled: true,
              pushEnabled: true,
              dailyDigest: true,
              reminderThresholdMinutes: 30,
              updatedAt: now
            }
          }
        ];

        // Fetch all singletons in parallel
        const snaps = await Promise.all(singletonRefs.map(item => getDoc(item.ref)));
        
        // Filter out only the missing ones
        const missingSingletons = singletonRefs.filter((item, idx) => !snaps[idx].exists());

        if (missingSingletons.length > 0) {
          // Use batch to create them atomically
          const adminDb = getDb();
          const batch = adminDb.batch();

          for (const item of missingSingletons) {
            batch.set(item.ref.adminRef, item.default);
            console.log(`[InitEngine] Batch queue missing singleton: ${item.path}`);
          }

          // Commit batch
          try {
            await batch.commit();
            console.log(`[InitEngine] Atomic singleton batch committed successfully (${missingSingletons.length} documents)`);
          } catch (batchErr) {
            console.warn(`[InitEngine] Batch commit failed, falling back to individual resilient setDoc writes:`, batchErr);
            for (const item of missingSingletons) {
              await setDoc(item.ref, item.default);
              console.log(`[InitEngine] Resilient individual fallback setDoc completed for: ${item.path}`);
            }
          }
        } else {
          console.log(`[InitEngine] All singletons already present for user ${userId}`);
        }
      })();
      initializationPromises.set(userId, promise);
    }
    try {
      await promise;
    } catch (err) {
      initializationPromises.delete(userId); // clear from cache to allow retry
      throw err;
    }
  }

  static async executeWithRetry<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isNotFoundError(error)) {
        console.warn(`[DataService] NOT_FOUND error caught. Triggering emergency bootstrap for user ${userId}...`);
        try {
          await DataService.ensureUserInitialized(userId);
          // Retry the operation once
          return await operation();
        } catch (retryErr) {
          console.error(`[DataService] Retry failed after emergency bootstrap for user ${userId}:`, retryErr);
          throw retryErr;
        }
      }
      throw error;
    }
  }

  // --- Profile Operations ---
  static async getUserProfile(userId: string): Promise<UserProfile> {
    const db = getDb();
    const docPath = `users/${userId}/profile/info`;
    return this.executeWithRetry(userId, async () => {
      const docSnap = await getDoc(doc(db, 'users', userId, 'profile', 'info'));
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      const defaultProfile: UserProfile = {
        email: 'alex.executive@example.com',
        name: 'Alex',
        personality: 'mentor',
        workingHours: { start: '09:00', end: '17:00', timezone: 'America/New_York' }
      };
      await setDoc(doc(db, 'users', userId, 'profile', 'info'), defaultProfile);
      return defaultProfile;
    });
  }

  static async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const db = getDb();
    const docPath = `users/${userId}/profile/info`;
    try {
      await setDoc(doc(db, 'users', userId, 'profile', 'info'), profile, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath, userId);
    }
  }

  // --- Preference Operations ---
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    const db = getDb();
    const docPath = `users/${userId}/preferences/settings`;
    return this.executeWithRetry(userId, async () => {
      const docSnap = await getDoc(doc(db, 'users', userId, 'preferences', 'settings'));
      if (docSnap.exists()) {
        return docSnap.data() as UserPreferences;
      }
      const defaultPrefs: UserPreferences = {
        voicePreference: 'Zephyr',
        theme: 'light',
        reminderStyle: 'professional'
      };
      await setDoc(doc(db, 'users', userId, 'preferences', 'settings'), defaultPrefs);
      return defaultPrefs;
    });
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const db = getDb();
    const docPath = `users/${userId}/preferences/settings`;
    try {
      await setDoc(doc(db, 'users', userId, 'preferences', 'settings'), preferences, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath, userId);
    }
  }

  // --- Task Operations ---
  static async createTask(userId: string, taskData: Partial<Task>): Promise<Task> {
    const db = getDb();
    const taskId = taskData.taskId || doc(collection(db, 'dummy')).id;
    const taskPath = `users/${userId}/tasks/${taskId}`;
    
    const fullTask: Task = {
      taskId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      deadline: taskData.deadline || Date.now() + 24 * 60 * 60 * 1000,
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      estimatedDuration: taskData.estimatedDuration || 60,
      workspaceId: taskData.workspaceId || 'default',
      successProbability: {
        current: 75,
        factors: [],
        recommendations: [],
      },
      createdAt: Date.now(),
      completedAt: null,
      category: taskData.category || 'other',
      notes: taskData.notes || '',
      checklist: taskData.checklist || [],
      tags: taskData.tags || [],
      attachments: taskData.attachments || [],
      isArchived: taskData.isArchived || false,
    };

    try {
      // Lazy import AIOrchestrator to avoid circular dependency
      const { AIOrchestrator } = await import('./aiOrchestrator.js');
      const workspaces = await DataService.getWorkspaces(userId);
      const wsHealth = workspaces[0]?.health ?? 78;
      const allTasks = await DataService.getTasks(userId);
      fullTask.successProbability = AIOrchestrator.calculateSuccessProbability(fullTask, allTasks, wsHealth);
    } catch (calcError) {
      console.warn("Failed to dynamically compute success probability on creation:", calcError);
    }

    try {
      await setDoc(doc(db, 'users', userId, 'tasks', taskId), fullTask);
      return fullTask;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, taskPath, userId);
    }
  }

  static async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<Task> {
    const db = getDb();
    const taskPath = `users/${userId}/tasks/${taskId}`;
    try {
      const docRef = doc(db, 'users', userId, 'tasks', taskId);
      await setDoc(docRef, updates, { merge: true });
      const docSnap = await getDoc(docRef);
      return docSnap.data() as Task;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, taskPath, userId);
    }
  }

  static async deleteTask(userId: string, taskId: string): Promise<void> {
    const db = getDb();
    const taskPath = `users/${userId}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, taskPath, userId);
    }
  }

  static async getTask(userId: string, taskId: string): Promise<Task | null> {
    const db = getDb();
    const taskPath = `users/${userId}/tasks/${taskId}`;
    try {
      const docSnap = await getDoc(doc(db, 'users', userId, 'tasks', taskId));
      if (docSnap.exists()) {
        return docSnap.data() as Task;
      }
      return null;
    } catch (error) {
      if (isNotFoundError(error)) return null;
      handleFirestoreError(error, OperationType.GET, taskPath, userId);
    }
  }

  static async getTasks(userId: string, filters?: { status?: string; workspaceId?: string }): Promise<Task[]> {
    const db = getDb();
    const colPath = `users/${userId}/tasks`;
    return this.executeWithRetry(userId, async () => {
      let q = query(collection(db, 'users', userId, 'tasks'), orderBy('deadline', 'asc'));
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.workspaceId) {
        q = query(q, where('workspaceId', '==', filters.workspaceId));
      }
      const querySnap = await getDocs(q);
      const tasks: Task[] = [];
      querySnap.forEach((docSnap) => {
        tasks.push(docSnap.data() as Task);
      });

      // Lazy initialization of tasks collection
      if (tasks.length === 0 && !filters?.status && !filters?.workspaceId) {
        const defaultTask: Task = {
          taskId: 'welcome-task',
          title: 'Explore DueNow Cockpit',
          description: 'Review your personalized daily briefings, explore workspaces, and check the Success Probability analytics.',
          deadline: Date.now() + 24 * 60 * 60 * 1000,
          status: 'pending',
          priority: 'medium',
          estimatedDuration: 15,
          workspaceId: 'default',
          successProbability: { current: 95, factors: [], recommendations: [] },
          createdAt: Date.now(),
          completedAt: null,
          category: 'other',
          notes: 'Initial welcome task',
          checklist: [],
          tags: ['Onboarding'],
          isArchived: false
        };
        await setDoc(doc(db, 'users', userId, 'tasks', 'welcome-task'), defaultTask);
        tasks.push(defaultTask);
      }

      return tasks;
    });
  }

  // --- Workspace Operations ---
  static async createWorkspace(userId: string, workspaceData: Partial<Workspace>): Promise<Workspace> {
    const db = getDb();
    const workspaceId = workspaceData.workspaceId || doc(collection(db, 'dummy')).id;
    const wsPath = `users/${userId}/workspaces/${workspaceId}`;
    const fullWorkspace: Workspace = {
      workspaceId,
      name: workspaceData.name || 'Untitled Workspace',
      description: workspaceData.description || workspaceData.projectSummary || '',
      type: workspaceData.type || 'hackathon',
      health: workspaceData.health || 0,
      healthFactors: workspaceData.healthFactors || {
        documentation: 0,
        organization: 0,
        submissionFiles: 0,
        projectStructure: 0,
      },
      folderPath: workspaceData.folderPath || '',
      files: workspaceData.files || [],
      lastScanned: Date.now(),
      submissionReady: workspaceData.submissionReady || false,
      missingComponents: workspaceData.missingComponents || [],
      projectSummary: workspaceData.projectSummary || workspaceData.description || '',
      icon: workspaceData.icon || '💼',
      color: workspaceData.color || 'from-indigo-600 to-violet-600',
      deadline: workspaceData.deadline || Date.now() + 7 * 24 * 3600 * 1000,
      status: workspaceData.status || 'active',
      priority: workspaceData.priority || 'medium',
      progress: workspaceData.progress || 0,
      successProbability: workspaceData.successProbability || 75,
      createdAt: workspaceData.createdAt || Date.now(),
      updatedAt: workspaceData.updatedAt || Date.now(),
      owner: userId,
      tags: workspaceData.tags || [],
      submissionReadiness: workspaceData.submissionReadiness || {
        score: 0,
        requiredActions: [],
        estimatedCompletionTime: 'Unknown',
        checklist: []
      },
      recommendations: workspaceData.recommendations || [],
      aiProjectSummary: workspaceData.aiProjectSummary || {
        executiveSummary: '',
        currentProgress: '',
        topRisks: [],
        nextActions: [],
        deadlines: [],
        completionEstimate: ''
      }
    };

    try {
      await setDoc(doc(db, 'users', userId, 'workspaces', workspaceId), fullWorkspace);
      return fullWorkspace;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, wsPath, userId);
    }
  }

  static async getWorkspace(userId: string, workspaceId: string): Promise<Workspace | null> {
    const db = getDb();
    const wsPath = `users/${userId}/workspaces/${workspaceId}`;
    try {
      const docSnap = await getDoc(doc(db, 'users', userId, 'workspaces', workspaceId));
      if (docSnap.exists()) {
        return docSnap.data() as Workspace;
      }
      return null;
    } catch (error) {
      if (isNotFoundError(error)) return null;
      handleFirestoreError(error, OperationType.GET, wsPath, userId);
    }
  }

  static async getWorkspaces(userId: string): Promise<Workspace[]> {
    const db = getDb();
    const colPath = `users/${userId}/workspaces`;
    return this.executeWithRetry(userId, async () => {
      const querySnap = await getDocs(collection(db, 'users', userId, 'workspaces'));
      const workspaces: Workspace[] = [];
      querySnap.forEach((docSnap) => {
        workspaces.push(docSnap.data() as Workspace);
      });

      // Lazy initialization of workspaces collection
      if (workspaces.length === 0) {
        const defaultWorkspace: Workspace = {
          workspaceId: 'default',
          name: '🚀 Launch Workspace',
          description: 'Your default high-performance workstation for managing deliverables.',
          type: 'hackathon',
          health: 85,
          healthFactors: { documentation: 20, organization: 20, submissionFiles: 20, projectStructure: 25 },
          folderPath: '/src',
          files: [],
          lastScanned: Date.now(),
          submissionReady: false,
          missingComponents: [],
          projectSummary: 'Strategic incubator workspace for deliverables organization.',
          icon: 'Briefcase',
          color: '#3B82F6',
          progress: 65,
          successProbability: 82,
          createdAt: Date.now() - 24 * 60 * 60 * 1000,
          updatedAt: Date.now()
        };
        await setDoc(doc(db, 'users', userId, 'workspaces', 'default'), defaultWorkspace);
        workspaces.push(defaultWorkspace);
      }

      return workspaces;
    });
  }

  static async updateWorkspace(userId: string, workspaceId: string, updates: Partial<Workspace>): Promise<Workspace> {
    const db = getDb();
    const wsPath = `users/${userId}/workspaces/${workspaceId}`;
    try {
      const docRef = doc(db, 'users', userId, 'workspaces', workspaceId);
      await setDoc(docRef, updates, { merge: true });
      const docSnap = await getDoc(docRef);
      return docSnap.data() as Workspace;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, wsPath, userId);
    }
  }

  static async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
    const db = getDb();
    const wsPath = `users/${userId}/workspaces/${workspaceId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'workspaces', workspaceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, wsPath, userId);
    }
  }

  // --- Conversation Operations ---
  static async getConversationHistory(userId: string, limitVal = 50): Promise<ConversationMessage[]> {
    const db = getDb();
    const colPath = `users/${userId}/conversations`;
    return this.executeWithRetry(userId, async () => {
      const q = query(
        collection(db, 'users', userId, 'conversations'),
        orderBy('timestamp', 'desc'),
        limit(limitVal)
      );
      const querySnap = await getDocs(q);
      const history: ConversationMessage[] = [];
      querySnap.forEach((docSnap) => {
        history.push(docSnap.data() as ConversationMessage);
      });

      // Lazy initialization of conversations collection
      if (history.length === 0) {
        const defaultMsg: ConversationMessage = {
          conversationId: 'welcome-msg',
          timestamp: Date.now(),
          userInput: 'Initialize workspace',
          aiResponse: 'Welcome Alex, I am your AI Chief of Staff. I have initialized your workspaces, calendars, and deliverables. How can I assist you today?',
          intent: 'welcome',
          confidence: 1.0,
          reasoning: 'Initial greetings and system status briefing.'
        };
        await setDoc(doc(db, 'users', userId, 'conversations', 'welcome-msg'), defaultMsg);
        history.push(defaultMsg);
      }

      return history.reverse(); // Chronological order for prompt context
    });
  }

  static async saveConversation(userId: string, conversation: Partial<ConversationMessage>): Promise<ConversationMessage> {
    const db = getDb();
    const conversationId = conversation.conversationId || doc(collection(db, 'dummy')).id;
    const path = `users/${userId}/conversations/${conversationId}`;
    const fullMessage: ConversationMessage = {
      conversationId,
      timestamp: conversation.timestamp || Date.now(),
      userInput: conversation.userInput || '',
      aiResponse: conversation.aiResponse || '',
      intent: conversation.intent || 'unknown',
      confidence: conversation.confidence || 0.0,
      reasoning: conversation.reasoning || '',
    };

    try {
      await setDoc(doc(db, 'users', userId, 'conversations', conversationId), fullMessage);
      return fullMessage;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  // --- Reminder Operations ---
  static async storeReminder(userId: string, reminderData: Partial<Reminder>): Promise<Reminder> {
    const db = getDb();
    const reminderId = reminderData.reminderId || doc(collection(db, 'dummy')).id;
    const path = `users/${userId}/reminders/${reminderId}`;
    const fullReminder: Reminder = {
      reminderId,
      taskId: reminderData.taskId || '',
      scheduledTime: reminderData.scheduledTime || Date.now() + 60 * 60 * 1000,
      reminderType: reminderData.reminderType || 'professional',
      message: reminderData.message || '',
      sent: reminderData.sent || false,
      personality: reminderData.personality || 'mentor',
    };

    try {
      await setDoc(doc(db, 'users', userId, 'reminders', reminderId), fullReminder);
      return fullReminder;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  static async getReminders(userId: string): Promise<Reminder[]> {
    const db = getDb();
    const colPath = `users/${userId}/reminders`;
    return this.executeWithRetry(userId, async () => {
      const q = query(
        collection(db, 'users', userId, 'reminders'),
        orderBy('scheduledTime', 'asc')
      );
      const querySnap = await getDocs(q);
      const reminders: Reminder[] = [];
      querySnap.forEach((docSnap) => {
        reminders.push(docSnap.data() as Reminder);
      });

      // Lazy initialization of reminders collection
      if (reminders.length === 0) {
        const defaultReminder: Reminder = {
          reminderId: 'rem-welcome',
          taskId: 'welcome-task',
          scheduledTime: Date.now() + 4 * 60 * 60 * 1000,
          reminderType: 'professional',
          message: 'Welcome to your Executive Companion. Maintain high readiness score.',
          sent: false,
          personality: 'mentor'
        };
        await setDoc(doc(db, 'users', userId, 'reminders', 'rem-welcome'), defaultReminder);
        reminders.push(defaultReminder);
      }

      return reminders;
    });
  }

  // Enhanced Timeline Management
  static async saveTimeline(userId: string, blocks: TimelineBlock[]): Promise<void> {
    const db = getDb();
    const path = `users/${userId}/timeline/today`;
    try {
      await setDoc(doc(db, 'users', userId, 'timeline', 'today'), { blocks });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  static async getTimeline(userId: string): Promise<TimelineBlock[]> {
    const db = getDb();
    const path = `users/${userId}/timeline/today`;
    return this.executeWithRetry(userId, async () => {
      const docSnap = await getDoc(doc(db, 'users', userId, 'timeline', 'today'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.blocks || [];
      }
      const defaultBlocks = [
        {
          id: 'init-block-1',
          time: '09:00 AM',
          period: 'morning',
          title: 'Review executive workspace diagnostics',
          type: 'focus',
          duration: '30m',
          priority: 'high',
          workspaceId: 'default',
          voiceText: 'Welcome to DueNow. Let us review the cockpit setup.',
          progress: 100,
          completed: true
        }
      ];
      await setDoc(doc(db, 'users', userId, 'timeline', 'today'), { blocks: defaultBlocks });
      return defaultBlocks;
    });
  }

  // Enhanced Execution Score Management
  static async saveExecutionScore(userId: string, score: ExecutionScore): Promise<void> {
    const db = getDb();
    const path = `users/${userId}/execution_history/current`;
    try {
      await setDoc(doc(db, 'users', userId, 'execution_history', 'current'), score);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  static async getExecutionScore(userId: string): Promise<ExecutionScore> {
    const db = getDb();
    const path = `users/${userId}/execution_history/current`;
    return this.executeWithRetry(userId, async () => {
      const docSnap = await getDoc(doc(db, 'users', userId, 'execution_history', 'current'));
      if (docSnap.exists()) {
        return docSnap.data() as ExecutionScore;
      }
      const defaultScore: ExecutionScore = {
        score: 85,
        tasksCompletedToday: 0,
        focusSessions: 0,
        consistency: 85,
        deadlinesMet: 90,
        dailyProductivity: 85
      };
      await setDoc(doc(db, 'users', userId, 'execution_history', 'current'), defaultScore);
      return defaultScore;
    });
  }

  // Enhanced Recommendations Management
  static async saveRecommendations(userId: string, recs: any[]): Promise<void> {
    const db = getDb();
    const path = `users/${userId}/recommendations/active`;
    try {
      await setDoc(doc(db, 'users', userId, 'recommendations', 'active'), { recs });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  static async getRecommendations(userId: string): Promise<any[]> {
    const db = getDb();
    const path = `users/${userId}/recommendations/active`;
    return this.executeWithRetry(userId, async () => {
      const docSnap = await getDoc(doc(db, 'users', userId, 'recommendations', 'active'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.recs || [];
      }
      const defaultRecs = [
        { action: 'Upload project instructions to automatically scan workspace health.', expectedImprovement: 15 }
      ];
      await setDoc(doc(db, 'users', userId, 'recommendations', 'active'), { recs: defaultRecs });
      return defaultRecs;
    });
  }

  // --- Focus Session Operations ---
  static async saveFocusSession(userId: string, session: { sessionId: string; taskId: string; taskTitle: string; duration: number; completed: boolean; timestamp: number; scoreAwarded: number }): Promise<void> {
    const db = getDb();
    const path = `users/${userId}/focus_sessions/${session.sessionId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'focus_sessions', session.sessionId), session);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  static async getFocusSessions(userId: string): Promise<any[]> {
    const db = getDb();
    const colPath = `users/${userId}/focus_sessions`;
    try {
      const q = query(
        collection(db, 'users', userId, 'focus_sessions'),
        orderBy('timestamp', 'desc')
      );
      const querySnap = await getDocs(q);
      const sessions: any[] = [];
      querySnap.forEach((doc) => {
        sessions.push(doc.data());
      });
      return sessions;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath, userId);
    }
  }

  // --- Keep Notes Operations ---
  static async createKeepNote(userId: string, title: string, content: string): Promise<any> {
    const db = getDb();
    const noteId = doc(collection(db, 'dummy')).id;
    const path = `users/${userId}/keep_notes/${noteId}`;
    const fullNote = {
      noteId,
      title: title || 'Quick Note',
      content: content || '',
      timestamp: Date.now()
    };
    try {
      await setDoc(doc(db, 'users', userId, 'keep_notes', noteId), fullNote);
      return fullNote;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  static async getKeepNotes(userId: string): Promise<any[]> {
    const db = getDb();
    const colPath = `users/${userId}/keep_notes`;
    try {
      const q = query(
        collection(db, 'users', userId, 'keep_notes'),
        orderBy('timestamp', 'desc')
      );
      const querySnap = await getDocs(q);
      const notes: any[] = [];
      querySnap.forEach((doc) => {
        notes.push(doc.data());
      });
      return notes;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath, userId);
      return [];
    }
  }

  // --- Goal Operations ---
  static async getGoals(userId: string): Promise<Goal[]> {
    const db = getDb();
    const colPath = `users/${userId}/goals`;
    try {
      const q = query(
        collection(db, 'users', userId, 'goals'),
        orderBy('createdAt', 'desc')
      );
      const querySnap = await getDocs(q);
      const goals: Goal[] = [];
      querySnap.forEach((doc) => {
        goals.push(doc.data() as Goal);
      });
      return goals;
    } catch (error) {
      if (isNotFoundError(error)) return [];
      handleFirestoreError(error, OperationType.LIST, colPath, userId);
    }
  }

  static async saveGoal(userId: string, goal: Goal): Promise<void> {
    const db = getDb();
    const path = `users/${userId}/goals/${goal.goalId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'goals', goal.goalId), goal);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  static async deleteGoal(userId: string, goalId: string): Promise<void> {
    const db = getDb();
    const path = `users/${userId}/goals/${goalId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path, userId);
    }
  }

  // --- Automation Rules Operations ---
  static async getAutomationRules(userId: string): Promise<AutomationRule[]> {
    const db = getDb();
    const colPath = `users/${userId}/automations`;
    try {
      const q = collection(db, 'users', userId, 'automations');
      const querySnap = await getDocs(q);
      const rules: AutomationRule[] = [];
      querySnap.forEach((doc) => {
        rules.push(doc.data() as AutomationRule);
      });
      return rules;
    } catch (error) {
      if (isNotFoundError(error)) return [];
      handleFirestoreError(error, OperationType.LIST, colPath, userId);
    }
  }

  static async saveAutomationRule(userId: string, rule: AutomationRule): Promise<void> {
    const db = getDb();
    const path = `users/${userId}/automations/${rule.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'automations', rule.id), rule);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  // --- Adaptive Preferences Operations ---
  static async getAdaptivePreferences(userId: string): Promise<AdaptivePreferences | null> {
    const db = getDb();
    const path = `users/${userId}/preferences/adaptive`;
    try {
      const docSnap = await getDoc(doc(db, 'users', userId, 'preferences', 'adaptive'));
      if (docSnap.exists()) {
        return docSnap.data() as AdaptivePreferences;
      }
      return null;
    } catch (error) {
      if (isNotFoundError(error)) return null;
      handleFirestoreError(error, OperationType.GET, path, userId);
    }
  }

  static async saveAdaptivePreferences(userId: string, prefs: AdaptivePreferences): Promise<void> {
    const db = getDb();
    const path = `users/${userId}/preferences/adaptive`;
    try {
      await setDoc(doc(db, 'users', userId, 'preferences', 'adaptive'), prefs);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  // --- AI Reasoning Logs Operations ---
  static async getReasoningLogs(userId: string): Promise<AIReasoningLog[]> {
    const db = getDb();
    const colPath = `users/${userId}/reasoning_logs`;
    try {
      const q = query(
        collection(db, 'users', userId, 'reasoning_logs'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const querySnap = await getDocs(q);
      const logs: AIReasoningLog[] = [];
      querySnap.forEach((doc) => {
        logs.push(doc.data() as AIReasoningLog);
      });
      return logs;
    } catch (error) {
      if (isNotFoundError(error)) return [];
      handleFirestoreError(error, OperationType.LIST, colPath, userId);
    }
  }

  static async addReasoningLog(userId: string, log: AIReasoningLog): Promise<void> {
    const db = getDb();
    const path = `users/${userId}/reasoning_logs/${log.decisionId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'reasoning_logs', log.decisionId), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, userId);
    }
  }

  // --- Demo Mode Operations ---
  static async seedDemoData(userId: string): Promise<void> {
    const db = getDb();
    
    // 1. Create Workspaces
    const ws1: Workspace = {
      workspaceId: 'demo-ws-startup',
      name: '🚀 Startup Capital Venture',
      description: 'Strategic planning, deck building, and financial modeling for Series Seed.',
      type: 'startup',
      health: 84,
      healthFactors: { documentation: 21, organization: 19, submissionFiles: 22, projectStructure: 22 },
      folderPath: '/src/startup',
      files: [
        { name: 'Pitch_Deck_v2.gslide', category: 'presentation', summary: 'Investors deck presenting market sizing and unit economics.' },
        { name: 'Financial_Projections_3Yr.gdoc', category: 'documentation', summary: 'SaaS metrics, growth rate projections, and breakdown.' }
      ],
      lastScanned: Date.now(),
      submissionReady: false,
      missingComponents: ['Term Sheet draft', 'Cap Table analysis'],
      projectSummary: 'Series Seed funding preparation and due diligence materials.',
      icon: 'Briefcase',
      color: '#3B82F6',
      progress: 65,
      successProbability: 82,
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000
    };

    const ws2: Workspace = {
      workspaceId: 'demo-ws-interview',
      name: '👨‍💻 FAANG Prep Workspace',
      description: 'System design mastering and algorithms drills.',
      type: 'interview',
      health: 92,
      healthFactors: { documentation: 24, organization: 22, submissionFiles: 23, projectStructure: 23 },
      folderPath: '/src/interviews',
      files: [
        { name: 'System_Design_Blueprint.gdoc', category: 'documentation', summary: 'Distributed cache, horizontal scaling, and consistency.' }
      ],
      lastScanned: Date.now(),
      submissionReady: true,
      missingComponents: [],
      projectSummary: 'Systematic drills covering databases, caching, and rate limiting.',
      icon: 'Code',
      color: '#10B981',
      progress: 85,
      successProbability: 93,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000
    };

    await setDoc(doc(db, 'users', userId, 'workspaces', 'demo-ws-startup'), ws1);
    await setDoc(doc(db, 'users', userId, 'workspaces', 'demo-ws-interview'), ws2);

    // 2. Create Goals
    const goal1: Goal = {
      goalId: 'demo-goal-seed',
      title: 'Startup Series Seed Capital',
      objective: 'Pitch to 3 prospective venture funds and refine financial prospectus.',
      targetDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
      relatedTasks: ['demo-task-1', 'demo-task-2'],
      relatedWorkspaces: ['demo-ws-startup'],
      relatedDocuments: ['Pitch_Deck_v2.gslide'],
      milestones: [
        { id: 'm1', title: 'Draft investor pitch slides', targetDate: Date.now() + 2 * 24 * 60 * 60 * 1000, completed: true },
        { id: 'm2', title: 'Complete Cap Table and financial math', targetDate: Date.now() + 5 * 24 * 60 * 60 * 1000, completed: false }
      ],
      completionPercentage: 50,
      currentRisks: ['Investor calendar constraints', 'Slightly complex Cap Table scenario calculations'],
      successProbability: 84,
      executiveSummary: 'Positive initial interest. Readying materials for technical due diligence next week.',
      createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
      status: 'active'
    };

    const goal2: Goal = {
      goalId: 'demo-goal-interview',
      title: 'Elite FAANG Offer Mastery',
      objective: 'Strong pass on Distributed Cache design and behavioral leadership loop.',
      targetDate: Date.now() + 6 * 24 * 60 * 60 * 1000,
      relatedTasks: ['demo-task-3'],
      relatedWorkspaces: ['demo-ws-interview'],
      relatedDocuments: ['System_Design_Blueprint.gdoc'],
      milestones: [
        { id: 'm3', title: 'Perform horizontal scale walkthroughs', targetDate: Date.now() + 1 * 24 * 60 * 60 * 1000, completed: true },
        { id: 'm4', title: 'Refine 5 mock behavioral STAR responses', targetDate: Date.now() + 3 * 24 * 60 * 60 * 1000, completed: true }
      ],
      completionPercentage: 100,
      currentRisks: [],
      successProbability: 95,
      executiveSummary: 'Demonstrated outstanding distributed system mock scores. Minor review of consistency rules remains.',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      status: 'active'
    };

    await setDoc(doc(db, 'users', userId, 'goals', 'demo-goal-seed'), goal1);
    await setDoc(doc(db, 'users', userId, 'goals', 'demo-goal-interview'), goal2);

    // 3. Create Tasks
    const t1: Task = {
      taskId: 'demo-task-1',
      title: 'Polish Series Seed projection models',
      description: 'Detail three revenue pathways based on customer acquisition cost trends.',
      deadline: Date.now() + 24 * 60 * 60 * 1000,
      status: 'pending',
      priority: 'critical',
      estimatedDuration: 60,
      workspaceId: 'demo-ws-startup',
      successProbability: {
        current: 82,
        factors: [
          { name: 'Calendar Buffer', score: 85, weight: 0.4 },
          { name: 'Workspace Preparedness', score: 80, weight: 0.6 }
        ],
        recommendations: [
          { action: 'Review Financial_Projections_3Yr.gdoc before finalizing calculations', expectedImprovement: 10 }
        ]
      },
      createdAt: Date.now(),
      completedAt: null,
      category: 'documentation'
    };

    const t2: Task = {
      taskId: 'demo-task-2',
      title: 'Draft elevator pitch Executive Summary',
      description: 'Compile core values proposition into one scannable pager for VCs.',
      deadline: Date.now() + 2 * 24 * 60 * 60 * 1000,
      status: 'in_progress',
      priority: 'high',
      estimatedDuration: 45,
      workspaceId: 'demo-ws-startup',
      successProbability: {
        current: 78,
        factors: [
          { name: 'Available Hours', score: 70, weight: 0.5 },
          { name: 'Historical consistency', score: 86, weight: 0.5 }
        ],
        recommendations: [
          { action: 'Dedicate 45m distraction-free focus block', expectedImprovement: 8 }
        ]
      },
      createdAt: Date.now(),
      completedAt: null,
      category: 'research'
    };

    const t3: Task = {
      taskId: 'demo-task-3',
      title: 'Practice Horizontal Caching and consistency rules',
      description: 'Revise cache eviction strategies (LRU, LFU) and scaling trade-offs.',
      deadline: Date.now() + 3 * 24 * 60 * 60 * 1000,
      status: 'completed',
      priority: 'medium',
      estimatedDuration: 90,
      workspaceId: 'demo-ws-interview',
      successProbability: {
        current: 95,
        factors: [],
        recommendations: []
      },
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      completedAt: Date.now() - 4 * 60 * 60 * 1000,
      category: 'coding'
    };

    await setDoc(doc(db, 'users', userId, 'tasks', 'demo-task-1'), t1);
    await setDoc(doc(db, 'users', userId, 'tasks', 'demo-task-2'), t2);
    await setDoc(doc(db, 'users', userId, 'tasks', 'demo-task-3'), t3);

    // 4. Create timeline blocks
    const timelineBlocks: TimelineBlock[] = [
      {
        id: 'block-1',
        time: '09:00 AM',
        period: 'morning',
        title: 'Standup with partners',
        type: 'meeting',
        duration: '30m',
        priority: 'high',
        workspaceId: 'demo-ws-startup',
        voiceText: 'Align deliverables blueprint.',
        progress: 100,
        completed: true
      },
      {
        id: 'block-2',
        time: '10:00 AM',
        period: 'morning',
        title: 'Series Seed deck polishing focus session',
        type: 'focus',
        duration: '90m',
        priority: 'critical',
        workspaceId: 'demo-ws-startup',
        voiceText: 'Review pitch Eviction slide deck and unit economics.',
        progress: 25,
        completed: false
      }
    ];
    await setDoc(doc(db, 'users', userId, 'timeline', 'today'), { blocks: timelineBlocks });

    // 5. Create some Keep Notes
    const note1 = {
      noteId: 'demo-note-1',
      title: 'VC Initial Feedback',
      content: 'Likes SaaS pricing and strong gross margins. Wants term sheet review next week.',
      timestamp: Date.now()
    };
    await setDoc(doc(db, 'users', userId, 'keep_notes', 'demo-note-1'), note1);

    // 6. Seed default Automation Rules
    const r1: AutomationRule = {
      id: 'demo-rule-1',
      name: 'Alert when Success Probability drops < 60%',
      triggerCondition: 'success_probability_drop',
      thresholdValue: 60,
      actionType: 'notify',
      actionDescription: 'Success probability of primary Series Seed deliverables has dropped. Recommending scheduling buffer sessions.',
      enabled: true
    };
    const r2: AutomationRule = {
      id: 'demo-rule-2',
      name: 'Suggest Deliverables for low Submission Readiness (< 75%)',
      triggerCondition: 'submission_readiness_drop',
      thresholdValue: 75,
      actionType: 'recommend_deliverables',
      actionDescription: 'Submission Readiness is low. Recommend creating missing elevator pitch checklists.',
      enabled: true
    };
    const r3: AutomationRule = {
      id: 'demo-rule-3',
      name: 'Create Prep sessions for upcoming Calendar Meets',
      triggerCondition: 'meeting_tomorrow',
      actionType: 'schedule_prep',
      actionDescription: 'Auto scheduling strategic preparation slot 18 hours before meeting.',
      enabled: true
    };

    await setDoc(doc(db, 'users', userId, 'automations', 'demo-rule-1'), r1);
    await setDoc(doc(db, 'users', userId, 'automations', 'demo-rule-2'), r2);
    await setDoc(doc(db, 'users', userId, 'automations', 'demo-rule-3'), r3);

    // 7. Seed Adaptive Preferences
    const adaptive: AdaptivePreferences = {
      preferredWorkStart: '08:30',
      preferredWorkEnd: '18:30',
      preferredFocusDuration: 50,
      preferredReminderTiming: 45,
      preferredMeetingBuffer: 20,
      communicationStyle: 'analytical',
      aiProactivity: 'high'
    };
    await setDoc(doc(db, 'users', userId, 'preferences', 'adaptive'), adaptive);
  }

  static async clearDemoData(userId: string): Promise<void> {
    const db = getDb();
    
    // List and delete seeded demo elements
    try {
      await deleteDoc(doc(db, 'users', userId, 'workspaces', 'demo-ws-startup'));
      await deleteDoc(doc(db, 'users', userId, 'workspaces', 'demo-ws-interview'));
      await deleteDoc(doc(db, 'users', userId, 'goals', 'demo-goal-seed'));
      await deleteDoc(doc(db, 'users', userId, 'goals', 'demo-goal-interview'));
      await deleteDoc(doc(db, 'users', userId, 'tasks', 'demo-task-1'));
      await deleteDoc(doc(db, 'users', userId, 'tasks', 'demo-task-2'));
      await deleteDoc(doc(db, 'users', userId, 'tasks', 'demo-task-3'));
      await deleteDoc(doc(db, 'users', userId, 'keep_notes', 'demo-note-1'));
      await deleteDoc(doc(db, 'users', userId, 'automations', 'demo-rule-1'));
      await deleteDoc(doc(db, 'users', userId, 'automations', 'demo-rule-2'));
      await deleteDoc(doc(db, 'users', userId, 'automations', 'demo-rule-3'));
    } catch (e) {
      console.warn('Silent issue while purging demo references:', e);
    }
  }

  static async getWorkspaceHealth(userId: string): Promise<any> {
    const db = getDb();
    return this.executeWithRetry(userId, async () => {
      const docSnap = await getDoc(doc(db, 'users', userId, 'workspace_health', 'current'));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      const defaultHealth = {
        overallHealth: 85,
        criticalWarningsCount: 0,
        complianceScore: 90,
        lastUpdated: Date.now()
      };
      await setDoc(doc(db, 'users', userId, 'workspace_health', 'current'), defaultHealth);
      return defaultHealth;
    });
  }

  static async getSubmissionReadiness(userId: string): Promise<any> {
    const db = getDb();
    return this.executeWithRetry(userId, async () => {
      const docSnap = await getDoc(doc(db, 'users', userId, 'submission_readiness', 'current'));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      const defaultReadiness = {
        readinessScore: 80,
        missingComponents: [],
        estimatedDelivery: '7 days',
        verified: true,
        lastCalculated: Date.now()
      };
      await setDoc(doc(db, 'users', userId, 'submission_readiness', 'current'), defaultReadiness);
      return defaultReadiness;
    });
  }

  static async getAnalytics(userId: string): Promise<any> {
    const db = getDb();
    return this.executeWithRetry(userId, async () => {
      const docSnap = await getDoc(doc(db, 'users', userId, 'analytics', 'current'));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      const defaultAnalytics = {
        workspaceScansCount: 1,
        focusSessionsCompleted: 0,
        averageTaskScore: 85,
        lastCalculated: Date.now()
      };
      await setDoc(doc(db, 'users', userId, 'analytics', 'current'), defaultAnalytics);
      return defaultAnalytics;
    });
  }

  static async getDocuments(userId: string): Promise<any[]> {
    const db = getDb();
    return this.executeWithRetry(userId, async () => {
      const querySnap = await getDocs(collection(db, 'users', userId, 'documents'));
      const documents: any[] = [];
      querySnap.forEach((docSnap) => {
        documents.push(docSnap.data());
      });
      if (documents.length === 0) {
        const defaultDoc = {
          id: 'doc-welcome',
          title: 'DueNow Workspace Architecture',
          content: 'DueNow provides hands-free voice operations and AI executive insights to ensure pitch-perfect delivery.',
          category: 'documentation',
          timestamp: Date.now()
        };
        await setDoc(doc(db, 'users', userId, 'documents', 'doc-welcome'), defaultDoc);
        documents.push(defaultDoc);
      }
      return documents;
    });
  }

  static async getNotifications(userId: string): Promise<any[]> {
    const db = getDb();
    return this.executeWithRetry(userId, async () => {
      const querySnap = await getDocs(collection(db, 'users', userId, 'notifications'));
      const notifications: any[] = [];
      querySnap.forEach((docSnap) => {
        notifications.push(docSnap.data());
      });
      if (notifications.length === 0) {
        const defaultNotif = {
          id: 'notif-1',
          title: 'System Initialized',
          message: 'Your AI Executive Companion is fully operational.',
          timestamp: Date.now(),
          read: false
        };
        await setDoc(doc(db, 'users', userId, 'notifications', 'notif-1'), defaultNotif);
        notifications.push(defaultNotif);
      }
      return notifications;
    });
  }

  static async getExecutionLogs(userId: string): Promise<any[]> {
    const db = getDb();
    return this.executeWithRetry(userId, async () => {
      const querySnap = await getDocs(collection(db, 'users', userId, 'execution_logs'));
      const logs: any[] = [];
      querySnap.forEach((docSnap) => {
        logs.push(docSnap.data());
      });
      if (logs.length === 0) {
        const defaultLog = {
          logId: 'log-welcome',
          timestamp: Date.now(),
          action: 'Database Bootstrapped',
          status: 'success',
          details: 'All core micro-services successfully initialized.'
        };
        await setDoc(doc(db, 'users', userId, 'execution_logs', 'log-welcome'), defaultLog);
        logs.push(defaultLog);
      }
      return logs;
    });
  }
}

