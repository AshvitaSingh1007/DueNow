import React from 'react';
import { HealthFactors } from '../types';
import { ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

interface WorkspaceHealthAlertProps {
  health: number;
  factors?: HealthFactors;
  missingComponents: string[];
}

export const WorkspaceHealthAlert: React.FC<WorkspaceHealthAlertProps> = ({
  health,
  factors,
  missingComponents
}) => {
  const getStatus = (score: number) => {
    if (score >= 76) return { label: 'Excellent', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' };
    if (score >= 51) return { label: 'Good', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' };
    return { label: 'Needs Attention', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-500' };
  };

  const status = getStatus(health);

  return (
    <div className={`p-5 rounded-2xl border ${status.color} flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-left`}>
      <div className="flex items-start sm:items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-bg border border-ink-faint shadow-sm shrink-0`}>
          <span className={`w-2.5 h-2.5 rounded-full ${status.dot} animate-pulse`} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-display font-bold text-ink text-sm">Workspace Readiness is {status.label}</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-bg border border-ink-faint text-ink">
              {health}% Health
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5 font-light font-sans">
            Calculated from Documentation, organization clarity, and project structure completeness.
          </p>
        </div>
      </div>

      {missingComponents.length > 0 && (
        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="font-semibold text-rose-400 text-xs block">Missing components detected</span>
            <span className="block text-[9px] text-ink-muted font-mono">Scan to recalculate</span>
          </div>
          <div className="flex flex-wrap gap-1.5 bg-bg/80 border border-ink-faint p-2 rounded-xl">
            {missingComponents.map((item) => (
              <span key={item} className="text-[9px] uppercase font-bold text-rose-400 font-mono tracking-wider">
                {item.replace('-', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
