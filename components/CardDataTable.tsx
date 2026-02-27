'use client';

import {
  Building2, User, Briefcase, Tag,
  Smartphone, Phone, Mail, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardData, CARD_FIELD_LABELS } from '@/types/card';

interface Props {
  data: CardData;
  onChange: (field: keyof CardData, value: string) => void;
  disabled?: boolean;
}

type FieldKey = keyof Omit<CardData, 'imageLink'>;

const FIELD_ORDER: FieldKey[] = [
  'companyName', 'fullName', 'jobTitle', 'sector',
  'mobile', 'officePhone', 'email', 'website',
];

const FIELD_ICONS: Record<FieldKey, React.ReactNode> = {
  companyName: <Building2  className="w-3.5 h-3.5" />,
  fullName:    <User       className="w-3.5 h-3.5" />,
  jobTitle:    <Briefcase  className="w-3.5 h-3.5" />,
  sector:      <Tag        className="w-3.5 h-3.5" />,
  mobile:      <Smartphone className="w-3.5 h-3.5" />,
  officePhone: <Phone      className="w-3.5 h-3.5" />,
  email:       <Mail       className="w-3.5 h-3.5" />,
  website:     <Globe      className="w-3.5 h-3.5" />,
};

export default function CardDataTable({ data, onChange, disabled }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
      {FIELD_ORDER.map((field, idx) => {
        const isNull = data[field] === 'Null';
        const isLast = idx === FIELD_ORDER.length - 1;

        return (
          <div
            key={field}
            className={cn(
              'group flex items-center gap-3 px-4 py-0.5',
              'transition-colors duration-150',
              !isLast && 'border-b border-slate-100 dark:border-slate-800/80',
              idx % 2 === 1 && 'bg-slate-50/70 dark:bg-slate-800/20',
              !disabled && 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
            )}
          >
            {/* Icon + Label column */}
            <div className="flex items-center gap-2 w-32 flex-shrink-0 py-2.5">
              <span className={cn(
                'transition-colors duration-150',
                'text-slate-400 dark:text-slate-500',
                'group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400'
              )}>
                {FIELD_ICONS[field]}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {CARD_FIELD_LABELS[field]}
              </span>
            </div>

            {/* Thin separator */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/60 flex-shrink-0" />

            {/* Editable input */}
            <input
              type={field === 'email' ? 'email' : field === 'website' ? 'url' : 'text'}
              value={data[field]}
              disabled={disabled}
              onChange={(e) => onChange(field, e.target.value)}
              dir="auto"
              placeholder={`Enter ${CARD_FIELD_LABELS[field].toLowerCase()}`}
              className={cn(
                'flex-1 min-w-0 bg-transparent text-sm py-2.5 px-2',
                'rounded-lg border border-transparent',
                'transition-all duration-150',
                'placeholder:text-slate-300 dark:placeholder:text-slate-700',
                isNull
                  ? 'text-slate-300 dark:text-slate-600 italic'
                  : 'text-slate-800 dark:text-slate-100',
                disabled
                  ? 'cursor-not-allowed opacity-50'
                  : [
                      'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                      'focus:bg-white dark:focus:bg-slate-800/90',
                      'focus:border-indigo-300 dark:focus:border-indigo-600/70',
                      'focus:shadow-sm focus:shadow-indigo-500/10',
                    ].join(' ')
              )}
            />
          </div>
        );
      })}

      {/* Drive image link — read-only */}
      {data.imageLink && (
        <div className={cn(
          'px-4 py-3 border-t',
          'border-slate-100 dark:border-slate-800',
          'bg-indigo-50/60 dark:bg-indigo-950/20',
        )}>
          <div className="flex items-center gap-1.5 mb-1">
            <Globe className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
              Drive Image Link
            </span>
          </div>
          <a
            href={data.imageLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'text-xs break-all underline underline-offset-2',
              'text-indigo-500 dark:text-indigo-400',
              'hover:text-indigo-700 dark:hover:text-indigo-300',
              'transition-colors duration-150'
            )}
          >
            {data.imageLink}
          </a>
        </div>
      )}
    </div>
  );
}
