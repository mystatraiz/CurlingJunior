'use client';

import { cn } from '@/lib/cn';

/** Sélecteur segmenté façon iOS (période, onglets de classement…). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-night-850',
        className
      )}
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'whitespace-nowrap rounded-lg font-medium transition-all duration-150',
            size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs',
            value === o.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-night-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
