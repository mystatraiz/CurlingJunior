import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center dark:border-night-700">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ice-50 text-ice-600 dark:bg-night-700 dark:text-ice-400">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        {description ? (
          <p className="mt-1 max-w-sm text-xs text-slate-400 dark:text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
