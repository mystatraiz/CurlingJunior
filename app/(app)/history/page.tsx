'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { matchWinner } from '@/lib/stats';
import { formatDate, formatNote, fullName } from '@/lib/format';
import { MATCH_CATEGORY_LABELS, type Dataset, type Player } from '@/lib/types';

type Tab = 'trainings' | 'scores' | 'matches' | 'attendance';

function statusBadge(status: string | undefined) {
  if (status === 'present') return <Badge tone="green">Présent</Badge>;
  if (status === 'excused') return <Badge tone="amber">Excusé</Badge>;
  return <Badge tone="red">Absent</Badge>;
}

function HistoryContent({ data }: { data: Dataset }) {
  const [tab, setTab] = useState<Tab>('trainings');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [category, setCategory] = useState('');

  const playersById = useMemo(() => {
    const m = new Map<string, Player>();
    for (const p of data.players) m.set(p.id, p);
    return m;
  }, [data.players]);

  const inDateRange = (date: string) =>
    (!from || date >= from) && (!to || date <= to);

  const matchesPlayerFilter = (pid: string) => {
    if (playerId && pid !== playerId) return false;
    if (category) {
      const p = playersById.get(pid);
      if (!p || p.category !== category) return false;
    }
    return true;
  };

  const trainingsById = useMemo(() => {
    const m = new Map(data.trainings.map((t) => [t.id, t]));
    return m;
  }, [data.trainings]);

  const filteredTrainings = [...data.trainings]
    .filter((t) => inDateRange(t.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredScores = data.scores
    .map((s) => ({ s, t: trainingsById.get(s.training_id) }))
    .filter(
      ({ s, t }) => t && inDateRange(t.date) && matchesPlayerFilter(s.player_id)
    )
    .sort((a, b) => (b.t!.date ?? '').localeCompare(a.t!.date ?? ''));

  const filteredMatches = [...data.matches]
    .filter(
      (m) =>
        inDateRange(m.date) &&
        (!playerId && !category
          ? true
          : data.matchPlayers.some(
              (mp) => mp.match_id === m.id && matchesPlayerFilter(mp.player_id)
            ))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredAttendance = data.attendance
    .map((a) => ({ a, t: trainingsById.get(a.training_id) }))
    .filter(
      ({ a, t }) => t && inDateRange(t.date) && matchesPlayerFilter(a.player_id)
    )
    .sort((x, y) => (y.t!.date ?? '').localeCompare(x.t!.date ?? ''));

  return (
    <>
      <PageHeader title="Historique" subtitle="Toutes les données de la saison, filtrables" />

      <div className="scrollbar-thin mb-4 overflow-x-auto pb-1">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'trainings', label: 'Entraînements' },
            { value: 'scores', label: 'Notes' },
            { value: 'matches', label: 'Matchs' },
            { value: 'attendance', label: 'Présences' },
          ]}
        />
      </div>

      {/* Filtres */}
      <Card className="mb-4 grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
        <Field label="Du">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Au">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label="Joueur">
          <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="">Tous</option>
            {data.players.map((p) => (
              <option key={p.id} value={p.id}>
                {fullName(p)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Catégorie">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Toutes</option>
            {data.settings.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {tab === 'trainings' &&
        (filteredTrainings.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="Aucun entraînement sur ces critères" />
        ) : (
          <Card className="divide-y divide-slate-100 dark:divide-night-700">
            {filteredTrainings.map((t) => {
              const present = data.attendance.filter(
                (a) => a.training_id === t.id && a.status === 'present'
              ).length;
              return (
                <Link
                  key={t.id}
                  href={`/trainings/${t.id}`}
                  className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-night-700/50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {formatDate(t.date)}
                    </p>
                    <p className="text-xs text-slate-400">{t.location ?? '—'}</p>
                  </div>
                  <Badge tone="ice">{present} présents</Badge>
                </Link>
              );
            })}
          </Card>
        ))}

      {tab === 'scores' &&
        (filteredScores.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="Aucune note sur ces critères" />
        ) : (
          <Card className="divide-y divide-slate-100 dark:divide-night-700">
            {filteredScores.map(({ s, t }) => {
              const p = playersById.get(s.player_id);
              if (!p) return null;
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {fullName(p)}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(t!.date)}</p>
                    {s.comments && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{s.comments}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-3 text-center text-xs tabular-nums">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formatNote(s.performance)}
                      </p>
                      <p className="text-[10px] text-slate-400">Perf</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formatNote(s.attitude)}
                      </p>
                      <p className="text-[10px] text-slate-400">Att</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formatNote(s.seriousness)}
                      </p>
                      <p className="text-[10px] text-slate-400">Sér</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formatNote(s.involvement)}
                      </p>
                      <p className="text-[10px] text-slate-400">Imp</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        ))}

      {tab === 'matches' &&
        (filteredMatches.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="Aucun match sur ces critères" />
        ) : (
          <Card className="divide-y divide-slate-100 dark:divide-night-700">
            {filteredMatches.map((m) => {
              const winner = matchWinner(m);
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {m.team_a_name} <span className="text-slate-400">vs</span> {m.team_b_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(m.date)} · {MATCH_CATEGORY_LABELS[m.category]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                      {m.score_a}–{m.score_b}
                    </span>
                    {winner === null ? (
                      <Badge tone="slate">Égalité</Badge>
                    ) : (
                      <Badge tone="green">
                        {winner === 'A' ? m.team_a_name : m.team_b_name}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        ))}

      {tab === 'attendance' &&
        (filteredAttendance.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="Aucune présence sur ces critères" />
        ) : (
          <Card className="divide-y divide-slate-100 dark:divide-night-700">
            {filteredAttendance.map(({ a, t }) => {
              const p = playersById.get(a.player_id);
              if (!p) return null;
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {fullName(p)}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(t!.date)}</p>
                  </div>
                  {statusBadge(a.status)}
                </div>
              );
            })}
          </Card>
        ))}
    </>
  );
}

export default function HistoryPage() {
  return <DataGate>{(data) => <HistoryContent data={data} />}</DataGate>;
}
