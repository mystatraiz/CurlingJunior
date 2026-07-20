'use client';

import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Heart,
  MapPin,
  Medal,
  Swords,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { TopFive } from '@/components/shared/top-five';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { TrendLine } from '@/components/charts/trend-line';
import { SimpleBars, RankedBars } from '@/components/charts/simple-bars';
import { QualitiesRadar } from '@/components/charts/qualities-radar';
import { usePeriod } from '@/components/providers/period-provider';
import {
  allPlayerStats,
  collectiveEvolution,
  matchesForPeriod,
  performanceDistribution,
  ranking,
  trainingsForPeriod,
} from '@/lib/stats';
import {
  formatDate,
  formatDateShort,
  formatDelta,
  formatNote,
  formatPercent,
  fullName,
} from '@/lib/format';
import type { Dataset } from '@/lib/types';

function DashboardContent({ data }: { data: Dataset }) {
  const { period } = usePeriod();
  const stats = allPlayerStats(data, period);
  const trainings = trainingsForPeriod(data, period);
  const matches = matchesForPeriod(data, period);
  const evolution = collectiveEvolution(data, period);
  const distribution = performanceDistribution(data, period);

  const activePlayers = data.players.filter((p) => p.is_active);
  const rated = stats.filter((s) => s.trainingsTotal > 0);
  const avgAttendance =
    rated.length > 0
      ? rated.reduce((sum, s) => sum + s.attendanceRate, 0) / rated.length
      : null;

  const lastTraining = trainings.length > 0 ? trainings[trainings.length - 1] : null;

  // Radar collectif : moyennes du groupe normalisées sur 100.
  const collect = (f: (s: (typeof stats)[number]) => number | null, scale: number) => {
    const vals = stats.map(f).filter((v): v is number => v !== null);
    if (vals.length === 0) return 0;
    return ((vals.reduce((a, b) => a + b, 0) / vals.length) / scale) * 100;
  };
  const radarData = [
    { axis: 'Performance', value: collect((s) => s.avgPerformance, 10) },
    { axis: 'Attitude', value: collect((s) => s.avgAttitude, 5) },
    { axis: 'Sérieux', value: collect((s) => s.avgSeriousness, 5) },
    { axis: 'Implication', value: collect((s) => s.avgInvolvement, 5) },
    { axis: 'Assiduité', value: collect((s) => (s.trainingsTotal > 0 ? s.attendanceRate : null), 1) },
  ];

  const winsData = ranking(stats, 'matches')
    .filter((s) => s.matchesPlayed > 0)
    .slice(0, 8)
    .map((s) => ({ label: fullName(s.player), value: s.matchPoints }));

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle={
          period === 'last3'
            ? 'Forme actuelle — 3 derniers entraînements'
            : data.activeSeason
              ? `Saison ${data.activeSeason.name}`
              : 'Saison complète'
        }
      />

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={Users} label="Joueurs" value={activePlayers.length} tone="ice" />
        <StatCard
          icon={CalendarDays}
          label="Entraînements"
          value={trainings.length}
          tone="green"
        />
        <StatCard
          icon={Activity}
          label="Présence moyenne"
          value={formatPercent(avgAttendance)}
          tone="amber"
        />
        <StatCard icon={Swords} label="Matchs" value={matches.length} tone="violet" />
      </div>

      {/* Dernier entraînement + évolution générale */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2">
          <CardHeader
            title="Évolution générale du collectif"
            subtitle="Moyenne de performance par entraînement (sur 10)"
          />
          <CardBody>
            {evolution.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-400">
                Aucun entraînement sur la période.
              </p>
            ) : (
              <TrendLine
                data={evolution.map((p) => ({
                  label: formatDateShort(p.date),
                  value: p.avgPerformance,
                }))}
                domain={[0, 10]}
                name="Performance moyenne"
              />
            )}
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader title="Dernier entraînement" />
          <CardBody className="pt-3">
            {lastTraining ? (
              <Link
                href={`/trainings/${lastTraining.id}`}
                className="group block rounded-xl border border-slate-100 p-4 transition-colors hover:border-ice-200 hover:bg-ice-50/50 dark:border-night-700 dark:hover:border-ice-800 dark:hover:bg-ice-950/30"
              >
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatDate(lastTraining.date)}
                </p>
                {lastTraining.location && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {lastTraining.location}
                  </p>
                )}
                {lastTraining.comments && (
                  <p className="mt-2 line-clamp-3 text-xs text-slate-400">
                    {lastTraining.comments}
                  </p>
                )}
                <p className="mt-3 flex items-center gap-1 text-xs font-medium text-ice-600 group-hover:gap-2 dark:text-ice-400 transition-all">
                  Voir le détail <ChevronRight className="h-3.5 w-3.5" />
                </p>
              </Link>
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">
                Aucun entraînement enregistré.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Top 5 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TopFive
          title="Top 5 · Performance"
          icon={Medal}
          stats={ranking(stats, 'performance')}
          value={(s) => (s.avgPerformance !== null ? `${formatNote(s.avgPerformance)} / 10` : null)}
        />
        <TopFive
          title="Top 5 · Assiduité"
          icon={Activity}
          stats={ranking(stats, 'attendance')}
          value={(s) => (s.trainingsTotal > 0 ? formatPercent(s.attendanceRate) : null)}
        />
        <TopFive
          title="Top 5 · Attitude"
          icon={Heart}
          stats={ranking(stats, 'attitude')}
          value={(s) => (s.avgAttitude !== null ? `${formatNote(s.avgAttitude)} / 5` : null)}
        />
        <TopFive
          title="Top 5 · Progression"
          icon={TrendingUp}
          stats={[...stats].sort(
            (a, b) => (b.progression ?? -Infinity) - (a.progression ?? -Infinity)
          )}
          value={(s) => (s.progression !== null ? formatDelta(s.progression) : null)}
        />
      </div>

      {/* Dashboard graphique */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader
            title="Présences par entraînement"
            subtitle="Nombre de joueurs présents"
          />
          <CardBody>
            <SimpleBars
              data={evolution.map((p) => ({
                label: formatDateShort(p.date),
                value: p.presences,
              }))}
              name="Présents"
            />
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            title="Répartition des notes"
            subtitle="Notes de performance sur la période"
          />
          <CardBody>
            <SimpleBars data={distribution.map((d) => ({ label: d.bucket, value: d.count }))} name="Notes" />
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            title="Radar du collectif"
            subtitle="Qualités moyennes du groupe (% du maximum)"
          />
          <CardBody>
            <QualitiesRadar data={radarData} name="Collectif" />
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            title="Répartition des victoires"
            subtitle="Points de matchs par joueur"
          />
          <CardBody>
            {winsData.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-400">
                Aucun match sur la période.
              </p>
            ) : (
              <RankedBars data={winsData} name="Points" />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return <DataGate>{(data) => <DashboardContent data={data} />}</DataGate>;
}
