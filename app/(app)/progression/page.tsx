'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Flame, Rocket, TrendingDown, TrendingUp } from 'lucide-react';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { TopFive } from '@/components/shared/top-five';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { usePeriod } from '@/components/providers/period-provider';
import { allPlayerStats, type PlayerStats } from '@/lib/stats';
import { formatDelta, formatNote, fullName } from '@/lib/format';
import type { Dataset } from '@/lib/types';
import { cn } from '@/lib/cn';

function DeltaRow({ s }: { s: PlayerStats }) {
  const up = (s.progression ?? 0) >= 0;
  return (
    <Link
      href={`/players/${s.player.id}`}
      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-night-700/60"
    >
      <Avatar player={s.player} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
          {fullName(s.player)}
        </p>
        <p className="text-[11px] text-slate-400">
          Moyenne actuelle : {formatNote(s.avgPerformance)} / 10
        </p>
      </div>
      <span
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
          up
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
            : 'bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-300'
        )}
      >
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {formatDelta(s.progression)}
      </span>
    </Link>
  );
}

function ProgressionContent({ data }: { data: Dataset }) {
  const { period } = usePeriod();
  const stats = useMemo(() => allPlayerStats(data, period), [data, period]);

  const withProgress = stats.filter((s) => s.progression !== null);
  const rising = [...withProgress]
    .filter((s) => (s.progression as number) > 0)
    .sort((a, b) => (b.progression as number) - (a.progression as number));
  const falling = [...withProgress]
    .filter((s) => (s.progression as number) < 0)
    .sort((a, b) => (a.progression as number) - (b.progression as number));

  return (
    <>
      <PageHeader
        title="Progression"
        subtitle="Comparaison des 3 derniers entraînements notés avec les 3 précédents"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-emerald-500" /> Joueurs en progression
              </span>
            }
            subtitle={`${rising.length} joueur${rising.length > 1 ? 's' : ''} en hausse`}
          />
          <CardBody className="space-y-1 pt-3">
            {rising.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Pas encore assez de données.
              </p>
            ) : (
              rising.map((s) => <DeltaRow key={s.player.id} s={s} />)
            )}
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" /> Joueurs en baisse
              </span>
            }
            subtitle={`${falling.length} joueur${falling.length > 1 ? 's' : ''} en baisse`}
          />
          <CardBody className="space-y-1 pt-3">
            {falling.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Aucun joueur en baisse. 👏
              </p>
            ) : (
              falling.map((s) => <DeltaRow key={s.player.id} s={s} />)
            )}
          </CardBody>
        </Card>

        <TopFive
          title="Meilleurs taux de progression"
          icon={TrendingUp}
          stats={[...withProgress].sort(
            (a, b) => (b.progression as number) - (a.progression as number)
          )}
          value={(s) => (s.progression !== null ? formatDelta(s.progression) : null)}
        />

        <TopFive
          title="Meilleures performances récentes"
          icon={Flame}
          stats={[...stats].sort(
            (a, b) => (b.avgPerformance ?? -1) - (a.avgPerformance ?? -1)
          )}
          value={(s) =>
            s.avgPerformance !== null ? `${formatNote(s.avgPerformance)} / 10` : null
          }
        />
      </div>
    </>
  );
}

export default function ProgressionPage() {
  return <DataGate>{(data) => <ProgressionContent data={data} />}</DataGate>;
}
