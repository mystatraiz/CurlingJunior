import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'ice' | 'green' | 'red' | 'amber' | 'slate';

const tones: Record<Tone, string> = {
  ice: 'bg-ice-100 text-ice-800 dark:bg-ice-950 dark:text-ice-300',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-night-700 dark:text-slate-300',
};

export function Badge({
  tone = 'slate',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
