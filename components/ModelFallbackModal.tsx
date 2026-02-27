'use client';

import { Zap, Clock, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onContinueWithFlash: () => void;
  onWait: () => void;
}

export default function ModelFallbackModal({ onContinueWithFlash, onWait }: Props) {
  return (
    /* Full-screen backdrop */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">

      {/* Blurred overlay */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onWait}
      />

      {/* Modal panel */}
      <div className={cn(
        'relative z-10 w-full max-w-sm animate-slide-up',
        'rounded-3xl overflow-hidden',
        'bg-white/92 dark:bg-slate-900/92',
        'backdrop-blur-2xl',
        'border border-amber-200/80 dark:border-amber-800/40',
        'shadow-2xl shadow-amber-500/10 dark:shadow-black/60',
      )}>

        {/* Amber accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        <div className="p-6">

          {/* Icon + Title */}
          <div className="flex items-start gap-3 mb-4">
            <div className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
              'bg-amber-50 dark:bg-amber-950/50',
              'border border-amber-200 dark:border-amber-800/60',
            )}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                Daily Limit Reached
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Gemini 2.0 Flash
              </p>
            </div>
          </div>

          {/* Body */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
            You&apos;ve reached the daily quota for{' '}
            <strong className="text-slate-800 dark:text-slate-100">Gemini 2.0 Flash</strong>.
            Would you like to wait until tomorrow, or continue now using the lighter{' '}
            <strong className="text-amber-600 dark:text-amber-400">Flash‑Lite model</strong>?
          </p>

          {/* Option cards */}
          <div className="flex flex-col gap-2.5 mb-5">

            {/* ── Flash option ── */}
            <button
              onClick={onContinueWithFlash}
              className={cn(
                'w-full text-left rounded-2xl px-4 py-3.5',
                'bg-amber-50 dark:bg-amber-950/30',
                'border border-amber-200 dark:border-amber-800/50',
                'hover:bg-amber-100/80 dark:hover:bg-amber-950/60',
                'hover:border-amber-300 dark:hover:border-amber-700',
                'active:scale-[0.98]',
                'transition-all duration-200',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500 shadow-sm shadow-amber-500/40 flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    Continue with Flash
                  </div>
                  <div className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">
                    Faster · Good accuracy · Available now
                  </div>
                </div>
              </div>
            </button>

            {/* ── Wait option ── */}
            <button
              onClick={onWait}
              className={cn(
                'w-full text-left rounded-2xl px-4 py-3.5',
                'bg-slate-50 dark:bg-slate-800/50',
                'border border-slate-200 dark:border-slate-700/60',
                'hover:bg-slate-100 dark:hover:bg-slate-800',
                'hover:border-slate-300 dark:hover:border-slate-600',
                'active:scale-[0.98]',
                'transition-all duration-200',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-400 dark:bg-slate-600 shadow-sm flex-shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Wait for Tomorrow
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                    Flash resets daily · Full precision
                  </div>
                </div>
              </div>
            </button>

          </div>

          {/* Dismiss link */}
          <button
            onClick={onWait}
            className="flex items-center justify-center gap-1.5 w-full text-xs text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors duration-150 py-1"
          >
            <X className="w-3 h-3" />
            Dismiss
          </button>

        </div>
      </div>
    </div>
  );
}
