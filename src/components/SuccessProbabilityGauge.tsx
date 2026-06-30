import React from 'react';
import { SuccessProbability } from '../types';
import { AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';

interface SuccessProbabilityGaugeProps {
  successProbability: SuccessProbability;
}

export const SuccessProbabilityGauge: React.FC<SuccessProbabilityGaugeProps> = ({ successProbability }) => {
  const { current, factors, recommendations } = successProbability;

  // Visual styling color map
  const getGaugeColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-500';
    if (pct >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getGaugeBg = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (pct >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-display font-extrabold text-ink tracking-tight">Success Probability™</h3>
        <span className="text-xs text-ink-muted font-mono">Explainable Math Engine</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Visual Gauge */}
        <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-ink-faint"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className={getGaugeColor(current)}
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * (1 - current / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-display font-black text-ink">{current}%</span>
            <span className="text-[9px] uppercase font-mono text-ink-muted tracking-wider">ODDS</span>
          </div>
        </div>

        {/* Factors list with weighted scores */}
        <div className="flex-1 w-full space-y-3">
          {factors.map((factor) => (
            <div key={factor.name} className="space-y-1 text-left">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-medium text-ink-muted">{factor.name}</span>
                <span className="text-ink font-mono text-[10px]">
                  {factor.score}/100 <span className="text-ink-muted/50">({Math.round(factor.weight * 100)}%)</span>
                </span>
              </div>
              <div className="h-1.5 bg-ink-faint rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Actionable Recommendations */}
      {recommendations.length > 0 && (
        <div className={`mt-6 p-4 rounded-2xl border ${getGaugeBg(current)} space-y-3`}>
          <div className="flex items-center gap-2 text-ink font-bold text-xs text-left">
            <AlertCircle className="w-4 h-4 text-accent" />
            <span>AI Recommendations to Boost Probability</span>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div key={rec.action} className="flex items-center justify-between text-xs text-left">
                <span className="text-ink-muted font-sans font-light">{rec.action}</span>
                <span className="font-semibold text-emerald-400 font-mono shrink-0 ml-4">
                  +{rec.expectedImprovement}% success odds
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
