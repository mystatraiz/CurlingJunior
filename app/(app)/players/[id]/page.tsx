'use client';

import { useRouter, useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Medal,
  Pencil,
  Swords,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { DataGate } from '@/components/shared/data-gate';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { PlayerForm } from '@/components/players/player-form';
import { TrendLine } from '@/components/charts/trend-line';
import { QualityLines } from '@/components/charts/quality-lines';
import { QualitiesRadar } from '@/components/charts/qualities-radar';
import { SimpleBars } from '@/components/charts/simple-bars';
import { usePeriod } from '@/components/providers/period-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { useData } from '@/components/providers/data-provider';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import {
  allPlayerStats,
  matchesForPeriod,
  matchWinner,
  playerEvolution,
  rankOf,
  trainingsForPeriod,
} from '@/lib/stats';
import {
  ageOf,
  formatDate,
  formatDateShort,
  formatDelta,
  formatNote,
  formatPercent,
  fullName,
} from '@/lib/format';
import { MATCH_CATEGORY_LABELS, type Dataset } from '@/lib/types';

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-center dark:border-night-700 dark:bg-night-850/50">
      <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p> : null}
    </div>
  );
}

function PlayerContent({ data, playerId }: { data: Dataset; playerId: string }) {
  const router = useRouter();
  const { period } = usePeriod();
  const { isAdmin } = useAuth();
  const { refresh } = useData();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const player = data.players.find((p) => p.id === playerId);
  const stats = useMemo(() => allPlayerStats(data, period), [data, period]);
  const s = stats.find((x) => x.player.id === playerId);

  if (!player || !s) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        Joueur introuvable.{' '}
        <Link href="/players" className="text-ice-600 underline">
          Retour aux joueurs
        </Link>
      </div>
    );
  }

  const evolution = playerEvolution(data, playerId, period);
  const generalRank = rankOf(stats, 'general', playerId);
  const age = ageOf(player.birth_date);

  const radarData = [
    { axis: 'Performance', value: s.avgPerformance !== null ? (s.avgPerformance / 10) * 100 : 0 },
    { axis: 'Attitude', value: s.avgAttitude !== null ? (s.avgAttitude / 5) * 100 : 0 },
    { axis: 'Sérieux', value: s.avgSeriousness !== null ? (s.avgSeriousness / 5) * 100 : 0 },
    { axis: 'Implication', value: s.avgInvolvement !== null ? (s.avgInvolvement / 5) * 100 : 0 },
    { axis: 'Assiduité', value: s.attendanceRate * 100 },
  ];

  // Historique des notes du joueur (récent d'abord).
  const trainings = trainingsForPeriod(data, period);
  const noteHistory = [...trainings]
    .reverse()
    .map((t) => ({
      training: t,
      score: data.scores.find((x) => x.training_id === t.id && x.player_id === playerId),
      attendance: data.attendance.find(
        (x) => x.training_id === t.id && x.player_id === playerId
      ),
    }));

  // Matchs du joueur sur la période.
  const playerMatches = matchesForPeriod(data, period)
    .filter((m) =>
      data.matchPlayers.some((mp) => mp.match_id === m.id && mp.player_id === playerId)
    )
    .reverse();

  async function deletePlayer() {
    setBusy(true);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('players').delete().eq('id', playerId);
    setBusy(false);
    if (!error) {
      await refresh();
      router.push('/players');
    }
  }

  return (
    <>
      <Link
        href="/players"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Joueurs
      </Link>

      {/* En-tête fiche */}
      <Card className="animate-fade-up overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-ice-600 via-ice-500 to-ice-400 dark:from-ice-900 dark:via-ice-800 dark:to-ice-700" />
        <CardBody className="-mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-4">
              <Avatar player={player} size="xl" className="ring-4 ring-white dark:ring-night-800" />
              <div className="pb-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {fullName(player)}
                </h1>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {player.category && <Badge tone="ice">{player.category}</Badge>}
                  <Badge tone="slate">{player.sex === 'F' ? 'Féminin' : 'Masculin'}</Badge>
                  {age !== null && <Badge tone="slate">{age} ans</Badge>}
                  {player.dominant_hand && (
                    <Badge tone="slate">Main {player.dominant_hand}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </Button>
              {isAdmin && (
                <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
            {player.birth_date && <span>Né{player.sex === 'F' ? 'e' : ''} le {formatDate(player.birth_date)}</span>}
            {player.joined_at && <span>Au collectif depuis le {formatDate(player.joined_at)}</span>}
          </div>
        </CardBody>
      </Card>

      {/* Statistiques clés */}
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <StatTile
          label="Classement gén."
          value={generalRank !== null ? `#${generalRank}` : '—'}
          sub={s.generalScore !== null ? `${formatNote(s.generalScore, 0)} pts` : undefined}
        />
        <StatTile label="Performance" value={formatNote(s.avgPerformance)} sub="/ 10" />
        <StatTile
          label="Présence"
          value={s.trainingsTotal > 0 ? formatPercent(s.attendanceRate) : '—'}
          sub={`${s.presences}/${s.trainingsTotal} entr.`}
        />
        <StatTile label="Attitude" value={formatNote(s.avgAttitude)} sub="/ 5" />
        <StatTile
          label="Matchs"
          value={`${s.matchesWon}V · ${s.matchesLost}D`}
          sub={`${s.matchPoints} pts`}
        />
        <StatTile
          label="Progression"
          value={formatDelta(s.progression)}
          sub="vs 3 précédents"
        />
      </div>

      {/* Graphiques */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader
            title="Performance"
            subtitle="Note sur 10 par entraînement"
            action={<Medal className="h-4 w-4 text-slate-300" />}
          />
          <CardBody>
            <TrendLine
              data={evolution.map((p) => ({
                label: formatDateShort(p.date),
                value: p.performance,
              }))}
              domain={[0, 10]}
              name="Performance"
            />
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            title="Attitude · Sérieux · Implication"
            subtitle="Notes sur 5 par entraînement"
          />
          <CardBody>
            <QualityLines
              data={evolution.map((p) => ({
                label: formatDateShort(p.date),
                attitude: p.attitude,
                seriousness: p.seriousness,
                involvement: p.involvement,
              }))}
            />
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            title="Profil du joueur"
            subtitle="Qualités en % du maximum"
            action={<Activity className="h-4 w-4 text-slate-300" />}
          />
          <CardBody>
            <QualitiesRadar data={radarData} name={fullName(player)} />
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader title="Présence" subtitle="1 = présent, 0 = absent / excusé" />
          <CardBody>
            <SimpleBars
              data={evolution.map((p) => ({
                label: formatDateShort(p.date),
                value: p.present ? 1 : 0,
              }))}
              name="Présence"
              domain={[0, 1]}
            />
          </CardBody>
        </Card>
      </div>

      {/* Historique */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader
            title="Historique des entraînements"
            action={<CalendarDays className="h-4 w-4 text-slate-300" />}
          />
          <CardBody className="pt-3">
            {noteHistory.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Aucun entraînement.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-night-700">
                {noteHistory.map(({ training, score, attendance }) => (
                  <li key={training.id} className="py-3">
                    <Link
                      href={`/trainings/${training.id}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {formatDate(training.date)}
                        </p>
                        {score?.comments && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                            {score.comments}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {attendance?.status === 'present' ? (
                          <Badge tone="green">Présent</Badge>
                        ) : attendance?.status === 'excused' ? (
                          <Badge tone="amber">Excusé</Badge>
                        ) : (
                          <Badge tone="red">Absent</Badge>
                        )}
                        {score?.performance !== null && score?.performance !== undefined && (
                          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatNote(score.performance)}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            title="Historique des matchs"
            action={<Swords className="h-4 w-4 text-slate-300" />}
          />
          <CardBody className="pt-3">
            {playerMatches.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Aucun match.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-night-700">
                {playerMatches.map((m) => {
                  const side = data.matchPlayers.find(
                    (mp) => mp.match_id === m.id && mp.player_id === playerId
                  )?.team;
                  const winner = matchWinner(m);
                  const won = winner !== null && winner === side;
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {m.team_a_name} <span className="text-slate-400">vs</span>{' '}
                          {m.team_b_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(m.date)} · {MATCH_CATEGORY_LABELS[m.category]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                          {m.score_a}–{m.score_b}
                        </span>
                        {winner === null ? (
                          <Badge tone="slate">Égalité</Badge>
                        ) : won ? (
                          <Badge tone="green">Victoire</Badge>
                        ) : (
                          <Badge tone="red">Défaite</Badge>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le joueur">
        <PlayerForm player={player} onDone={() => setEditOpen(false)} />
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer le joueur">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Supprimer <strong>{fullName(player)}</strong> effacera aussi ses présences,
          notes et participations aux matchs. Cette action est irréversible.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => void deletePlayer()}>
            <Trash2 className="h-4 w-4" /> Supprimer définitivement
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function PlayerPage() {
  const params = useParams<{ id: string }>();
  return (
    <DataGate>
      {(data) => <PlayerContent data={data} playerId={params.id} />}
    </DataGate>
  );
}
