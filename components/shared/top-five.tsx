'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { fullName } from '@/lib/format';
import type { PlayerStats } from '@/lib/stats';
import { cn } from '@/lib/cn';

const RANK_STYLE = [
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'bg-slate-200 text-slate-600 dark:bg-night-700 dark:text-slate-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
];

export function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
        RANK_STYLE[rank - 1] ?? 'bg-slate-100 text-slate-500 dark:bg-night-850 dark:text-slate-400'
      )}
    >
      {rank}
    </span>
  );
}

/** Carte « Top 5 » réutilisée sur le tableau de bord. */
export function TopFive({
  title,
  icon,
  stats,
  value,
  emptyLabel = 'Aucune donnée sur la période',
}: {
  title: string;
  icon: LucideIcon;
  stats: PlayerStats[];
  /** Valeur formatée affichée à droite (null = joueur exclu). */
  value: (s: PlayerStats) => string | null;
  emptyLabel?: string;
}) {
  const Icon = icon;
  const rows = stats
    .map((s) => ({ s, v: value(s) }))
    .filter((r): r is { s: PlayerStats; v: string } => r.v !== null)
    .slice(0, 5);

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-ice-600 dark:text-ice-400" />
            {title}
          </span>
        }
      />
      <CardBody className="pt-3">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">{emptyLabel}</p>
        ) : (
          <ol className="space-y-2.5">
            {rows.map(({ s, v }, i) => (
              <li key={s.player.id}>
                <Link
                  href={`/players/${s.player.id}`}
                  className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-night-700/60"
                >
                  <RankBadge rank={i + 1} />
                  <Avatar player={s.player} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {fullName(s.player)}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {v}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
