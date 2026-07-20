import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './card';
import { cn } from '@/lib/cn';

/** Carte de statistique du tableau de bord (grand chiffre + icône). */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'ice',
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'ice' | 'green' | 'amber' | 'violet';
}) {
  const tones = {
    ice: 'bg-ice-50 text-ice-600 dark:bg-ice-950/70 dark:text-ice-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400',
  } as const;
  return (
    <Card className="p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            tones[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {value}
          </p>
          {sub ? (
            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{sub}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
