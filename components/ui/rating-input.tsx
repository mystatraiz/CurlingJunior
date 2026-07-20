'use client';

import { cn } from '@/lib/cn';

/**
 * Saisie de note (0..max, pas de 0,5) : slider + valeur affichée.
 * Utilisé pour performance (/10), attitude, sérieux, implication (/5).
 */
export function RatingInput({
  label,
  max,
  value,
  onChange,
  accent = 'ice',
}: {
  label: string;
  max: 5 | 10;
  value: number | null;
  onChange: (v: number | null) => void;
  accent?: 'ice' | 'violet' | 'emerald' | 'amber';
}) {
  const accents = {
    ice: 'accent-ice-600',
    violet: 'accent-violet-600',
    emerald: 'accent-emerald-600',
    amber: 'accent-amber-500',
  } as const;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">
          {value === null ? '—' : value.toLocaleString('fr-FR')}
          <span className="font-normal text-slate-400"> / {max}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={max}
          step={0.5}
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn('h-1.5 w-full cursor-pointer', accents[accent])}
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors',
            value === null
              ? 'bg-slate-200 text-slate-500 dark:bg-night-700 dark:text-slate-400'
              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-night-700'
          )}
          title="Effacer la note"
        >
          ∅
        </button>
      </div>
    </div>
  );
}
