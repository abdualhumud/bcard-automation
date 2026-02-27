'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Render a placeholder during SSR to prevent layout shift
  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative h-9 w-9 rounded-xl',
        'border border-slate-200 dark:border-slate-700',
        'bg-white dark:bg-slate-900',
        'text-slate-500 dark:text-slate-400',
        'hover:text-slate-900 dark:hover:text-white',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        'hover:border-slate-300 dark:hover:border-slate-600',
        'transition-all duration-200',
        'flex items-center justify-center',
        'shadow-sm'
      )}
    >
      <span
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        )}
      >
        <Moon className="h-4 w-4" />
      </span>
      <span
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        )}
      >
        <Sun className="h-4 w-4" />
      </span>
    </button>
  );
}
