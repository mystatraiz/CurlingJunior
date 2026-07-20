'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Plus, Swords, Trash2, Trophy } from 'lucide-react';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Segmented } from '@/components/ui/segmented';
import { useAuth } from '@/components/providers/auth-provider';
import { useData } from '@/components/providers/data-provider';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { matchWinner, seasonMatches } from '@/lib/stats';
import { formatDate, fullName, todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  MATCH_CATEGORY_LABELS,
  type Dataset,
  type Match,
  type MatchCategory,
  type TeamSide,
} from '@/lib/types';

const CATEGORY_OPTIONS: Array<{ value: MatchCategory; label: string }> = [
  { value: 'hommes', label: 'Hommes' },
  { value: 'femmes', label: 'Femmes' },
  { value: 'mixte', label: 'Mixte' },
];

function CategoryBadge({ category }: { category: MatchCategory }) {
  const tones = { hommes: 'ice', femmes: 'amber', mixte: 'green' } as const;
  return <Badge tone={tones[category]}>{MATCH_CATEGORY_LABELS[category]}</Badge>;
}

function MatchForm({ data, onDone }: { data: Dataset; onDone: () => void }) {
  const { refresh } = useData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: todayISO(),
    category: 'mixte' as MatchCategory,
    team_a_name: 'Équipe A',
    team_b_name: 'Équipe B',
    score_a: 0,
    score_b: 0,
  });
  const [teams, setTeams] = useState<Record<string, TeamSide | null>>({});

  const players = data.players
    .filter((p) => p.is_active)
    .sort((a, b) => a.last_name.localeCompare(b.last_name));

  function toggleTeam(playerId: string, side: TeamSide) {
    setTeams((t) => ({ ...t, [playerId]: t[playerId] === side ? null : side }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = getSupabaseBrowser();
    try {
      const { data: inserted, error: err } = await supabase
        .from('matches')
        .insert({
          date: form.date,
          category: form.category,
          team_a_name: form.team_a_name,
          team_b_name: form.team_b_name,
          score_a: form.score_a,
          score_b: form.score_b,
          season_id: data.activeSeason?.id ?? null,
        })
        .select('id')
        .single();
      if (err) throw new Error(err.message);
      const matchId = (inserted as { id: string }).id;

      const rows = Object.entries(teams)
        .filter((entry): entry is [string, TeamSide] => entry[1] !== null)
        .map(([player_id, team]) => ({ match_id: matchId, player_id, team }));
      if (rows.length > 0) {
        const { error: mpErr } = await supabase.from('match_players').insert(rows);
        if (mpErr) throw new Error(mpErr.message);
      }
      await refresh();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Date">
        <Input
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
      </Field>
      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          Catégorie du match
        </p>
        <Segmented<MatchCategory>
          value={form.category}
          onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          options={CATEGORY_OPTIONS}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Équipe A">
          <Input
            required
            value={form.team_a_name}
            onChange={(e) => setForm((f) => ({ ...f, team_a_name: e.target.value }))}
          />
        </Field>
        <Field label="Équipe B">
          <Input
            required
            value={form.team_b_name}
            onChange={(e) => setForm((f) => ({ ...f, team_b_name: e.target.value }))}
          />
        </Field>
        <Field label={`Score ${form.team_a_name}`}>
          <Input
            type="number"
            min={0}
            required
            value={form.score_a}
            onChange={(e) => setForm((f) => ({ ...f, score_a: Number(e.target.value) }))}
          />
        </Field>
        <Field label={`Score ${form.team_b_name}`}>
          <Input
            type="number"
            min={0}
            required
            value={form.score_b}
            onChange={(e) => setForm((f) => ({ ...f, score_b: Number(e.target.value) }))}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          Composition des équipes
        </p>
        <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100 dark:divide-night-700 dark:border-night-700">
          {players.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar player={p} size="sm" />
                <span className="truncate text-sm text-slate-700 dark:text-slate-200">
                  {fullName(p)}
                </span>
              </div>
              <div className="flex shrink-0 gap-1">
                {(['A', 'B'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => toggleTeam(p.id, side)}
                    className={cn(
                      'rounded-lg border px-3 py-1 text-[11px] font-bold transition-all',
                      teams[p.id] === side
                        ? side === 'A'
                          ? 'border-ice-600 bg-ice-600 text-white'
                          : 'border-violet-600 bg-violet-600 text-white'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-night-700 dark:text-slate-500'
                    )}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer le match'}
        </Button>
      </div>
    </form>
  );
}

function MatchCard({ data, match }: { data: Dataset; match: Match }) {
  const { isAdmin } = useAuth();
  const { refresh } = useData();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const winner = matchWinner(match);

  const roster = (side: TeamSide) =>
    data.matchPlayers
      .filter((mp) => mp.match_id === match.id && mp.team === side)
      .map((mp) => data.players.find((p) => p.id === mp.player_id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

  async function remove() {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('matches').delete().eq('id', match.id);
    if (!error) await refresh();
    setConfirmOpen(false);
  }

  const TeamCol = ({ side }: { side: TeamSide }) => {
    const name = side === 'A' ? match.team_a_name : match.team_b_name;
    const won = winner === side;
    return (
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'flex items-center gap-1.5 truncate text-sm font-semibold',
            won ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {won && <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
          {name}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {roster(side).map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-night-700 dark:text-slate-300"
            >
              {p.first_name} {p.last_name.charAt(0)}.
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="animate-fade-up p-4">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          {formatDate(match.date)}
          <CategoryBadge category={match.category} />
        </span>
        <div className="flex items-center gap-2">
          {winner === null ? (
            <Badge tone="slate">Égalité</Badge>
          ) : (
            <Badge tone="green">
              Vainqueur : {winner === 'A' ? match.team_a_name : match.team_b_name}
            </Badge>
          )}
          {isAdmin && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
              title="Supprimer le match"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-start gap-4">
        <TeamCol side="A" />
        <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-1.5 text-lg font-bold tabular-nums text-slate-900 dark:bg-night-850 dark:text-white">
          {match.score_a}–{match.score_b}
        </div>
        <TeamCol side="B" />
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Supprimer le match">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Le match et les points attribués aux joueurs seront supprimés.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={() => void remove()}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

function MatchesContent({ data }: { data: Dataset }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | MatchCategory>('all');
  const allMatches = useMemo(() => [...seasonMatches(data)].reverse(), [data]);
  const matches =
    filter === 'all' ? allMatches : allMatches.filter((m) => m.category === filter);

  return (
    <>
      <PageHeader
        title="Matchs d'entraînement"
        subtitle={`Victoire = ${data.settings.win_points} pts · Défaite = ${data.settings.loss_points} pt${data.settings.loss_points > 1 ? 's' : ''}`}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Nouveau match
          </Button>
        }
      />

      <div className="mb-4">
        <Segmented<'all' | MatchCategory>
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: 'Tous' }, ...CATEGORY_OPTIONS]}
        />
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="Aucun match"
          description="Créez des matchs d'entraînement : les points et le classement se mettent à jour automatiquement."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Créer un match
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchCard key={m.id} data={data} match={m} />
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouveau match" wide>
        <MatchForm data={data} onDone={() => setCreateOpen(false)} />
      </Modal>
    </>
  );
}

export default function MatchesPage() {
  return <DataGate>{(data) => <MatchesContent data={data} />}</DataGate>;
}
