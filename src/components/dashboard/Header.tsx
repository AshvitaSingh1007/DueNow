import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, RefreshCw, Folder, CheckCircle2, Calendar, Cloud, Mail, 
  Clock, Layers, Compass, ShieldCheck 
} from 'lucide-react';
import { ThemeSelector } from '../ThemeSelector';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (val: boolean) => void;
  isSearching: boolean;
  searchResults: any[];
  setActiveSection: (val: any) => void;
  timeStr: string;
  dateStr: string;
  showQuickActions: boolean;
  setShowQuickActions: React.Dispatch<React.SetStateAction<boolean>>;
  speakText: (text: string) => void;
  userProfile: any;
  googleAccessToken: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  showSearchResults,
  setShowSearchResults,
  isSearching,
  searchResults,
  setActiveSection,
  timeStr,
  dateStr,
  showQuickActions,
  setShowQuickActions,
  speakText,
  userProfile,
  googleAccessToken,
}) => {
  return (
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
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="p-2.5 bg-ink-faint border border-ink-faint hover:border-accent/30 rounded-xl text-ink hover:text-ink transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
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
                  className="w-full text-left py-2 px-3 hover:bg-ink-faint rounded-lg text-xs text-ink-muted hover:text-ink transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-accent" />
                  Optimize Milestones
                </button>
                <button 
                  onClick={() => {
                    speakText("Pre-flight checklist initiated for your corporate submission.");
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left py-2 px-3 hover:bg-ink-faint rounded-lg text-xs text-ink-muted hover:text-ink transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Check Submission Health
                </button>
                <button 
                  onClick={() => {
                    speakText("Opening full memory logs.");
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left py-2 px-3 hover:bg-ink-faint rounded-lg text-xs text-ink-muted hover:text-ink transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  Companion Memory Logs
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme appearance toggle */}
        <div className="pl-4 flex items-center border-l border-ink-faint">
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
  );
};
