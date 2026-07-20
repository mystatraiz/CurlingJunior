'use client';

import type { TooltipProps } from 'recharts';

/** Tooltip maison, cohérent clair/sombre. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: TooltipProps<number, string> & {
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-night-700 dark:bg-night-850/95">
      {label ? (
        <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      ) : null}
      <div className="space-y-0.5">
        {payload.map((entry) => (
          <p key={String(entry.dataKey)} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: entry.color ?? entry.stroke }}
            />
            <span className="text-slate-500 dark:text-slate-400">{entry.name} :</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
              {entry.value === null || entry.value === undefined
                ? '—'
                : formatter
                  ? formatter(Number(entry.value), String(entry.name))
                  : Number(entry.value).toLocaleString('fr-FR', {
                      maximumFractionDigits: 1,
                    })}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
