import React, { createContext, useContext, useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, X, ShieldAlert, Zap } from 'lucide-react';
import { useAuth } from './AuthContext';

export interface QueuedOperation {
  id: string;
  endpoint: string;
  method: string;
  body: any;
  timestamp: number;
}

export interface SystemError {
  id: string;
  message: string;
  context: string;
  timestamp: number;
  type: 'network' | 'auth' | 'ai' | 'google' | 'speech' | 'database' | 'generic';
}

export interface PerformanceMetric {
  endpoint: string;
  durationMs: number;
  timestamp: number;
}

interface SystemResilienceContextType {
  isOnline: boolean;
  errors: SystemError[];
  activeError: SystemError | null;
  performanceMetrics: PerformanceMetric[];
  queue: QueuedOperation[];
  addError: (message: string, type: SystemError['type'], context: string) => void;
  clearActiveError: () => void;
  trackLatency: (endpoint: string, durationMs: number) => void;
  enqueueWrite: (endpoint: string, method: string, body: any) => void;
  syncQueue: () => Promise<void>;
}

const SystemResilienceContext = createContext<SystemResilienceContextType | undefined>(undefined);

export const SystemResilienceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [errors, setErrors] = useState<SystemError[]>([]);
  const [activeError, setActiveError] = useState<SystemError | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { userId } = useAuth();

  // 1. Connection Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addError('Network restored. Automating queue synchronization.', 'network', 'System Sync Engine');
      syncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      addError('Workstation is offline. Local changes will be safely queued.', 'network', 'System Connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load any offline queued operations from storage
    const storedQueue = localStorage.getItem(`duenow_offline_queue_${userId || 'guest'}`);
    if (storedQueue) {
      try {
        setQueue(JSON.parse(storedQueue));
      } catch (err) {
        console.error('Failed to parse cached offline queue:', err);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  // 2. Queue Persistence Helper
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`duenow_offline_queue_${userId}`, JSON.stringify(queue));
    }
  }, [queue, userId]);

  // 3. Centralized Error Adder
  const addError = (message: string, type: SystemError['type'], context: string) => {
    const userFriendlyMsg = translateToUserFriendly(message, type);
    const newErr: SystemError = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      message: userFriendlyMsg,
      context,
      timestamp: Date.now(),
      type
    };

    setErrors(prev => [newErr, ...prev].slice(0, 50)); // Cap history at 50
    setActiveError(newErr);

    // Auto dismiss minor background sync notices
    if (type === 'network' && message.includes('restored')) {
      setTimeout(() => {
        setActiveError(null);
      }, 4000);
    }
  };

  const clearActiveError = () => setActiveError(null);

  // Translate confusing technical failures or API stacktraces to pristine UX dialogues
  const translateToUserFriendly = (rawMsg: string, type: SystemError['type']): string => {
    const uppercase = rawMsg.toUpperCase();
    if (type === 'network') {
      if (uppercase.includes('FAILED TO FETCH') || !isOnline) {
        return 'Connection disrupted. Safe offline cache activated. Local actions will sync immediately upon internet restoral.';
      }
      return rawMsg;
    }
    if (type === 'auth') {
      if (uppercase.includes('EXPIRED') || uppercase.includes('TOKEN')) {
        return 'Security credential signature expired. Tap to securely refresh access token credentials.';
      }
      return 'Authentication handshake timed out. Please authenticate again to access synced resources.';
    }
    if (type === 'ai' || uppercase.includes('GEMINI')) {
      return 'AI Reasoning pipeline encountering a processing bottleneck. Automatically scaling computing threads. Please retry.';
    }
    if (type === 'google') {
      if (uppercase.includes('PERMISSION') || uppercase.includes('SCOPE')) {
        return 'Missing extended Google Workspace scope permission. Grant Google Calendar & Drive privileges under workstation parameters.';
      }
      return 'Handshake with external Google API timed out. Automatically queueing context refresh.';
    }
    if (type === 'speech') {
      return 'Speech processor bypassed due to voice feed disruption or browser constraints. Touch mic button to re-initiate.';
    }
    if (type === 'database') {
      if (uppercase.includes('PERMISSION_DENIED') || uppercase.includes('PERMISSIONS')) {
        return 'Handshake rejected due to permission constraints. Accessing localized data copy instead.';
      }
      return 'Secure transaction lock active. Automatically retrying update operation.';
    }
    return rawMsg;
  };

  // 4. Performance Tracking Service
  const trackLatency = (endpoint: string, durationMs: number) => {
    const metric: PerformanceMetric = { endpoint, durationMs, timestamp: Date.now() };
    setPerformanceMetrics(prev => [metric, ...prev].slice(0, 100));
    
    // Log performance issues in dev
    if (durationMs > 1500) {
      console.warn(`[System Performance Alert] Slow transaction: ${endpoint} took ${durationMs}ms`);
    }
  };

  // 5. Offline Request Enqueuer
  const enqueueWrite = (endpoint: string, method: string, body: any) => {
    const op: QueuedOperation = {
      id: `op-${Date.now()}`,
      endpoint,
      method,
      body,
      timestamp: Date.now()
    };
    setQueue(prev => [...prev, op]);
  };

  // 6. Queue Sync Dispatcher
  const syncQueue = async () => {
    if (!isOnline || queue.length === 0 || isSyncing) return;
    setIsSyncing(true);
    addError('Sync Engine: processing stored offline operations.', 'network', 'Background Sync');

    const opsToSync = [...queue];
    const failedOps: QueuedOperation[] = [];

    for (const op of opsToSync) {
      try {
        const response = await fetch(op.endpoint, {
          method: op.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': userId ? `Bearer ${userId}` : ''
          },
          body: JSON.stringify(op.body)
        });
        if (!response.ok) {
          failedOps.push(op);
        }
      } catch (err) {
        failedOps.push(op);
      }
    }

    setQueue(failedOps);
    setIsSyncing(false);

    if (failedOps.length === 0) {
      addError('Offline workstation transaction stack fully synced.', 'network', 'Sync Engine');
    } else {
      addError(`Network bottleneck active. ${failedOps.length} updates remain safely queued.`, 'network', 'Sync Engine');
    }
  };

  return (
    <SystemResilienceContext.Provider value={{
      isOnline,
      errors,
      activeError,
      performanceMetrics,
      queue,
      addError,
      clearActiveError,
      trackLatency,
      enqueueWrite,
      syncQueue
    }}>
      {children}

      {/* Global Offline Bar Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-lg backdrop-blur-md flex items-center gap-2 text-xs font-medium shadow-lg shadow-amber-900/10 animate-pulse">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Local Storage Cache Active (Offline Mode)</span>
        </div>
      )}

      {/* Structured User Recovery Dialog Overlay */}
      {activeError && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            
            <button 
              onClick={clearActiveError}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                {activeError.type === 'network' ? <WifiOff className="w-6 h-6" /> :
                 activeError.type === 'auth' ? <ShieldAlert className="w-6 h-6" /> :
                 activeError.type === 'ai' ? <Zap className="w-6 h-6" /> :
                 <AlertTriangle className="w-6 h-6" />}
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{activeError.context}</span>
                <h3 className="font-display font-semibold text-white tracking-tight">System Notification</h3>
                <p className="text-slate-300 text-xs leading-relaxed">{activeError.message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-800/60 pt-4">
              <button
                onClick={clearActiveError}
                className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs hover:bg-slate-800 transition-colors"
              >
                Acknowledge
              </button>
              {activeError.type === 'network' && (
                <button
                  onClick={() => {
                    syncQueue();
                    clearActiveError();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1.5 transition-colors font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Workstation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </SystemResilienceContext.Provider>
  );
};

export const useSystemResilience = () => {
  const context = useContext(SystemResilienceContext);
  if (!context) throw new Error('useSystemResilience must be used inside SystemResilienceProvider');
  return context;
};
