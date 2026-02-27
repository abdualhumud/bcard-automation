import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: [
          'bg-slate-100 dark:bg-slate-800',
          'text-slate-600 dark:text-slate-400',
          'border border-slate-200 dark:border-slate-700',
        ].join(' '),

        primary: [
          'bg-indigo-50 dark:bg-indigo-500/10',
          'text-indigo-700 dark:text-indigo-400',
          'border border-indigo-200 dark:border-indigo-500/30',
        ].join(' '),

        success: [
          'bg-emerald-50 dark:bg-emerald-500/10',
          'text-emerald-700 dark:text-emerald-400',
          'border border-emerald-200 dark:border-emerald-500/30',
        ].join(' '),

        warning: [
          'bg-amber-50 dark:bg-amber-500/10',
          'text-amber-700 dark:text-amber-400',
          'border border-amber-200 dark:border-amber-500/30',
        ].join(' '),

        danger: [
          'bg-red-50 dark:bg-red-500/10',
          'text-red-700 dark:text-red-400',
          'border border-red-200 dark:border-red-500/30',
        ].join(' '),
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
