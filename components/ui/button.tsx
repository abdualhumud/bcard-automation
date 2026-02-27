'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium tracking-wide rounded-xl',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-indigo-600 text-white',
          'hover:bg-indigo-500',
          'shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30',
        ].join(' '),

        success: [
          'bg-emerald-600 text-white',
          'hover:bg-emerald-500',
          'shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30',
        ].join(' '),

        outline: [
          'border bg-transparent',
          'border-slate-200 dark:border-slate-700',
          'text-slate-700 dark:text-slate-300',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          'hover:text-slate-900 dark:hover:text-white',
          'hover:border-slate-300 dark:hover:border-slate-600',
        ].join(' '),

        ghost: [
          'bg-transparent',
          'text-slate-500 dark:text-slate-400',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          'hover:text-slate-900 dark:hover:text-white',
        ].join(' '),

        danger: [
          'bg-red-500/10 dark:bg-red-500/10',
          'border border-red-200 dark:border-red-900/50',
          'text-red-600 dark:text-red-400',
          'hover:bg-red-500/20 dark:hover:bg-red-500/20',
          'hover:border-red-300 dark:hover:border-red-800',
        ].join(' '),
      },

      size: {
        sm:      'h-8  px-3  text-xs  rounded-lg',
        default: 'h-10 px-4  text-sm',
        lg:      'h-11 px-5  text-sm',
        xl:      'h-14 px-6  text-base',
        icon:    'h-9  w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
