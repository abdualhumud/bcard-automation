'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
  duration?: number;
}

interface Props {
  messages: ToastMessage[];
  onDismiss: (id: number) => void;
}

const TOAST_CONFIG: Record<ToastType, {
  icon: React.ReactNode;
  base: string;
  border: string;
  iconColor: string;
}> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
    base:      'bg-white dark:bg-slate-900',
    border:    'border-emerald-200 dark:border-emerald-800/60',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  error: {
    icon: <XCircle className="w-4 h-4 flex-shrink-0" />,
    base:      'bg-white dark:bg-slate-900',
    border:    'border-red-200 dark:border-red-800/60',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  info: {
    icon: <Info className="w-4 h-4 flex-shrink-0" />,
    base:      'bg-white dark:bg-slate-900',
    border:    'border-indigo-200 dark:border-indigo-800/60',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
  },
  loading: {
    icon: <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />,
    base:      'bg-white dark:bg-slate-900',
    border:    'border-slate-200 dark:border-slate-700',
    iconColor: 'text-slate-400 dark:text-slate-500',
  },
};

function Toast({ msg, onDismiss }: { msg: ToastMessage; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const cfg = TOAST_CONFIG[msg.type];

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    if (msg.duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, msg.duration);
      return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
    }
    return () => cancelAnimationFrame(raf);
  }, [msg.duration, onDismiss]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 pl-4 pr-3 py-3',
        'rounded-2xl border shadow-lg shadow-black/10 dark:shadow-black/30',
        'text-sm transition-all duration-300',
        cfg.base, cfg.border,
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-3 scale-95'
      )}
    >
      {/* Icon */}
      <span className={cn('mt-0.5', cfg.iconColor)}>
        {cfg.icon}
      </span>

      {/* Text */}
      <span className="flex-1 leading-snug text-slate-700 dark:text-slate-200">
        {msg.text}
      </span>

      {/* Dismiss button */}
      {msg.type !== 'loading' && (
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          aria-label="Dismiss"
          className={cn(
            'flex-shrink-0 -mr-1 -mt-0.5 p-1.5 rounded-lg',
            'text-slate-400 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-300',
            'hover:bg-slate-100 dark:hover:bg-slate-800',
            'transition-colors duration-150'
          )}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function StatusToast({ messages, onDismiss }: Props) {
  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-lg mx-auto">
      {messages.map((msg) => (
        <div key={msg.id} className="pointer-events-auto">
          <Toast msg={msg} onDismiss={() => onDismiss(msg.id)} />
        </div>
      ))}
    </div>
  );
}
