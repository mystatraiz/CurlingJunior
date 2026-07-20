'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Medal, TrendingDown, TrendingUp } from 'lucide-react';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { RankBadge } from '@/components/shared/top-five';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty-state';
import { usePeriod } from '@/components/providers/period-provider';
import {
  allPlayerStats,
  ranking,
  rankingValue,
  type PlayerStats,
  type RankingKey,
} from '@/lib/stats';
import { formatNote, formatPercent, fullName } from '@/lib/format';
import type { Dataset } from '@/lib/types';

const TABS: Array<{ value: RankingKey; label: string }> = [
  { value: 'general', label: 'Général' },
  { value: 'performance', label: 'Performance' },
  { value: 'attitude', label: 'Attitude' },
  { value: 'seriousness', label: 'Sérieux' },
  { value: 'involvement', label: 'Implication' },
  { value: 'attendance', label: 'Assiduité' },
  { value: 'matches', label: 'Matchs' },
];

function formatValue(s: PlayerStats, key: RankingKey): string {
  const v = rankingValue(s, key);
  if (v === null) return '—';
  switch (key) {
    case 'general':
      return `${formatNote(v, 0)} / 100`;
    case 'performance':
      return `${formatNote(v)} / 10`;
    case 'attendance':
      return formatPercent(v / 100);
    case 'matches':
      return `${v} pts`;
    default:
      return `${formatNote(v)} / 5`;
  }
}

function subLabel(s: PlayerStats, key: RankingKey): string {
  switch (key) {
    case 'general':
      return `${formatNote(s.avgPerformance)} perf · ${formatPercent(s.attendanceRate)} prés. · ${s.matchPoints} pts`;
    case 'attendance':
      return `${s.presences} présences · ${s.excused} excusé${s.excused > 1 ? 's' : ''} · ${s.absences} absence${s.absences > 1 ? 's' : ''}`;
    case 'matches':
      return `${s.matchesWon} V · ${s.matchesLost} D${s.matchesDrawn > 0 ? ` · ${s.matchesDrawn} N` : ''}`;
    default:
      return `${s.presences}/${s.trainingsTotal} entraînements`;
  }
}

function RankingsContent({ data }: { data: Dataset }) {
  const { period } = usePeriod();
  const [tab, setTab] = useState<RankingKey>('general');
  const stats = useMemo(() => allPlayerStats(data, period), [data, period]);
  const ranked = ranking(stats, tab).filter((s) => rankingValue(s, tab) !== null);
  const w = data.settings.weights;

  return (
    <>
      <PageHeader
        title="Classements"
        subtitle={
          tab === 'general'
            ? `Pondération : ${w.performance}% perf · ${w.matches}% matchs · ${w.attendance}% assiduité · ${w.attitude}% attitude · ${w.seriousness}% sérieux · ${w.involvement}% implication`
            : period === 'last3'
              ? 'Forme actuelle — 3 derniers entraînements'
              : 'Saison complète'
        }
      />

      <div className="scrollbar-thin mb-5 overflow-x-auto pb-1">
        <Segmented<RankingKey> options={TABS} value={tab} onChange={setTab} />
      </div>

      {ranked.length === 0 ? (
        <EmptyState
          icon={Medal}
          title="Aucune donnée à classer"
          description="Enregistrez des entraînements, notes ou matchs sur la période sélectionnée."
        />
      ) : (
        <Card className="animate-fade-up divide-y divide-slate-100 dark:divide-night-700">
          {ranked.map((s, i) => (
            <Link
              key={s.player.id}
              href={`/players/${s.player.id}`}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-night-700/50"
            >
              <RankBadge rank={i + 1} />
              <Avatar player={s.player} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {fullName(s.player)}
                </p>
                <p className="truncate text-[11px] text-slate-400">{subLabel(s, tab)}</p>
              </div>
              {s.progression !== null && Math.abs(s.progression) >= 0.05 && (
                <span
                  className={
                    s.progression > 0
                      ? 'text-emerald-500'
                      : 'text-red-400'
                  }
                  title={`Progression : ${s.progression > 0 ? '+' : ''}${s.progression.toFixed(1)}`}
                >
                  {s.progression > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </span>
              )}
              <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {formatValue(s, tab)}
              </span>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}

export default function RankingsPage() {
  return <DataGate>{(data) => <RankingsContent data={data} />}</DataGate>;
}
