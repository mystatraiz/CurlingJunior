'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Trash2, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { RatingInput } from '@/components/ui/rating-input';
import { useAuth } from '@/components/providers/auth-provider';
import { useData } from '@/components/providers/data-provider';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { fullName, todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AttendanceStatus, Dataset, Training } from '@/lib/types';

interface ScoreDraft {
  performance: number | null;
  attitude: number | null;
  seriousness: number | null;
  involvement: number | null;
  comments: string;
}

const EMPTY_SCORE: ScoreDraft = {
  performance: null,
  attitude: null,
  seriousness: null,
  involvement: null,
  comments: '',
};

const STATUS_META: Array<{
  value: AttendanceStatus;
  label: string;
  active: string;
}> = [
  { value: 'present', label: 'Présent', active: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'absent', label: 'Absent', active: 'bg-red-500 text-white border-red-500' },
  { value: 'excused', label: 'Excusé', active: 'bg-amber-500 text-white border-amber-500' },
];

/** Éditeur d'entraînement — création (training absent) ou modification. */
export function TrainingEditor({
  data,
  training,
}: {
  data: Dataset;
  training?: Training;
}) {
  const router = useRouter();
  const { refresh } = useData();
  const { session, isAdmin } = useAuth();
  const players = useMemo(
    () =>
      data.players
        .filter((p) => p.is_active)
        .sort((a, b) => a.last_name.localeCompare(b.last_name)),
    [data.players]
  );

  const [date, setDate] = useState(training?.date ?? todayISO());
  const [location, setLocation] = useState(training?.location ?? '');
  const [comments, setComments] = useState(training?.comments ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const p of players) {
      const existing = training
        ? data.attendance.find(
            (a) => a.training_id === training.id && a.player_id === p.id
          )
        : undefined;
      map[p.id] = existing?.status ?? 'absent';
    }
    return map;
  });

  const [scores, setScores] = useState<Record<string, ScoreDraft>>(() => {
    const map: Record<string, ScoreDraft> = {};
    for (const p of players) {
      const existing = training
        ? data.scores.find(
            (s) => s.training_id === training.id && s.player_id === p.id
          )
        : undefined;
      map[p.id] = existing
        ? {
            performance: existing.performance,
            attitude: existing.attitude,
            seriousness: existing.seriousness,
            involvement: existing.involvement,
            comments: existing.comments ?? '',
          }
        : { ...EMPTY_SCORE };
    }
    return map;
  });

  const presentPlayers = players.filter((p) => attendance[p.id] === 'present');

  function setScore(playerId: string, patch: Partial<ScoreDraft>) {
    setScores((s) => ({ ...s, [playerId]: { ...s[playerId], ...patch } }));
  }

  async function save() {
    if (!date) {
      setError('La date est obligatoire.');
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = getSupabaseBrowser();
    try {
      let trainingId = training?.id;
      const payload = {
        date,
        location: location || null,
        comments: comments || null,
        season_id: training?.season_id ?? data.activeSeason?.id ?? null,
      };

      if (training) {
        const { error: err } = await supabase
          .from('trainings')
          .update(payload)
          .eq('id', training.id);
        if (err) throw new Error(err.message);
      } else {
        const { data: inserted, error: err } = await supabase
          .from('trainings')
          .insert({ ...payload, created_by: session?.user.id ?? null })
          .select('id')
          .single();
        if (err) throw new Error(err.message);
        trainingId = (inserted as { id: string }).id;
      }

      // Écriture par upsert : on ne supprime jamais avant d'avoir réécrit,
      // pour qu'une coupure réseau ne fasse perdre aucune donnée.
      const attendanceRows = players.map((p) => ({
        training_id: trainingId!,
        player_id: p.id,
        status: attendance[p.id],
      }));
      const { error: upAtt } = await supabase
        .from('attendance')
        .upsert(attendanceRows, { onConflict: 'training_id,player_id' });
      if (upAtt) throw new Error(upAtt.message);

      const scoreRows = presentPlayers
        .map((p) => ({ p, d: scores[p.id] }))
        .filter(
          ({ d }) =>
            d.performance !== null ||
            d.attitude !== null ||
            d.seriousness !== null ||
            d.involvement !== null ||
            d.comments.trim() !== ''
        )
        .map(({ p, d }) => ({
          training_id: trainingId!,
          player_id: p.id,
          performance: d.performance,
          attitude: d.attitude,
          seriousness: d.seriousness,
          involvement: d.involvement,
          comments: d.comments.trim() || null,
        }));
      if (scoreRows.length > 0) {
        const { error: upScores } = await supabase
          .from('training_scores')
          .upsert(scoreRows, { onConflict: 'training_id,player_id' });
        if (upScores) throw new Error(upScores.message);
      }

      // Purge des notes des joueurs qui ne sont plus présents ou plus notés.
      const keepIds = scoreRows.map((r) => r.player_id);
      let purge = supabase
        .from('training_scores')
        .delete()
        .eq('training_id', trainingId!);
      if (keepIds.length > 0) {
        purge = purge.not('player_id', 'in', `(${keepIds.join(',')})`);
      }
      const { error: delScores } = await purge;
      if (delScores) throw new Error(delScores.message);

      await refresh();
      router.push('/trainings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setBusy(false);
    }
  }

  async function deleteTraining() {
    if (!training) return;
    setBusy(true);
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.from('trainings').delete().eq('id', training.id);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    await refresh();
    router.push('/trainings');
  }

  return (
    <div className="space-y-4">
      {/* Informations */}
      <Card className="animate-fade-up">
        <CardHeader title="Informations" />
        <CardBody className="grid gap-3 pt-3 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Lieu">
            <Input
              placeholder="Patinoire de…"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Field>
          <Field label="Commentaires" className="sm:col-span-2">
            <Textarea
              rows={2}
              placeholder="Objectifs de la séance, conditions de glace…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </Field>
        </CardBody>
      </Card>

      {/* Présences */}
      <Card className="animate-fade-up">
        <CardHeader
          title="Présences"
          subtitle={`${presentPlayers.length} présent${presentPlayers.length > 1 ? 's' : ''} / ${players.length}`}
        />
        <CardBody className="pt-3">
          <ul className="divide-y divide-slate-100 dark:divide-night-700">
            {players.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar player={p} size="sm" />
                  <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {fullName(p)}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  {STATUS_META.map((meta) => (
                    <button
                      key={meta.value}
                      type="button"
                      onClick={() =>
                        setAttendance((a) => ({ ...a, [p.id]: meta.value }))
                      }
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all',
                        attendance[p.id] === meta.value
                          ? meta.active
                          : 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-night-700 dark:text-slate-500'
                      )}
                    >
                      {meta.label.charAt(0)}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-400">
            P = Présent · A = Absent · E = Excusé
          </p>
        </CardBody>
      </Card>

      {/* Notes des présents */}
      <Card className="animate-fade-up">
        <CardHeader
          title="Notes des joueurs présents"
          subtitle="Performance sur 10 · Attitude, Sérieux, Implication sur 5"
        />
        <CardBody className="pt-3">
          {presentPlayers.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              Marquez des joueurs présents pour saisir leurs notes.
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {presentPlayers.map((p) => {
                const d = scores[p.id];
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-100 p-4 dark:border-night-700"
                  >
                    <div className="mb-3 flex items-center gap-2.5">
                      <Avatar player={p} size="sm" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {fullName(p)}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <RatingInput
                        label="Performance"
                        max={10}
                        value={d.performance}
                        onChange={(v) => setScore(p.id, { performance: v })}
                        accent="ice"
                      />
                      <RatingInput
                        label="Attitude"
                        max={5}
                        value={d.attitude}
                        onChange={(v) => setScore(p.id, { attitude: v })}
                        accent="emerald"
                      />
                      <RatingInput
                        label="Sérieux"
                        max={5}
                        value={d.seriousness}
                        onChange={(v) => setScore(p.id, { seriousness: v })}
                        accent="violet"
                      />
                      <RatingInput
                        label="Implication"
                        max={5}
                        value={d.involvement}
                        onChange={(v) => setScore(p.id, { involvement: v })}
                        accent="amber"
                      />
                      <Textarea
                        rows={2}
                        placeholder="Commentaires libres…"
                        value={d.comments}
                        onChange={(e) => setScore(p.id, { comments: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pb-4">
        {training && isAdmin ? (
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" /> Supprimer
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/trainings')}>
            <X className="h-4 w-4" /> Annuler
          </Button>
          <Button onClick={() => void save()} disabled={busy}>
            <Check className="h-4 w-4" />
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer l'entraînement">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Les présences et notes associées seront également supprimées. Action
          irréversible.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => void deleteTraining()}>
            Supprimer définitivement
          </Button>
        </div>
      </Modal>
    </div>
  );
}
