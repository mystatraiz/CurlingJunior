'use client';

import { useEffect, useState } from 'react';
import { Check, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { useAuth } from '@/components/providers/auth-provider';
import { useData } from '@/components/providers/data-provider';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Dataset, Profile, Weights } from '@/lib/types';
import { todayISO } from '@/lib/format';

const WEIGHT_LABELS: Array<{ key: keyof Weights; label: string }> = [
  { key: 'performance', label: 'Performance' },
  { key: 'matches', label: 'Matchs' },
  { key: 'attendance', label: 'Assiduité' },
  { key: 'attitude', label: 'Attitude' },
  { key: 'seriousness', label: 'Sérieux' },
  { key: 'involvement', label: 'Implication' },
];

function SettingsContent({ data }: { data: Dataset }) {
  const { isAdmin } = useAuth();
  const { refresh } = useData();
  const [weights, setWeights] = useState<Weights>(data.settings.weights);
  const [winPoints, setWinPoints] = useState(data.settings.win_points);
  const [lossPoints, setLossPoints] = useState(data.settings.loss_points);
  const [categories, setCategories] = useState<string[]>(data.settings.categories);
  const [newCategory, setNewCategory] = useState('');
  const [newSeason, setNewSeason] = useState({ name: '', start_date: todayISO() });
  const [coaches, setCoaches] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalWeight = WEIGHT_LABELS.reduce((s, w) => s + (weights[w.key] || 0), 0);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase
      .from('coaches')
      .select('*')
      .order('created_at')
      .then(({ data: rows }) => setCoaches((rows as Profile[]) ?? []));
  }, []);

  async function saveSettings() {
    if (totalWeight !== 100) {
      setError('Les coefficients doivent totaliser 100 %.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.from('settings').upsert({
      id: 1,
      weights,
      win_points: winPoints,
      loss_points: lossPoints,
      categories,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage('Paramètres enregistrés.');
    await refresh();
  }

  async function addSeason() {
    if (!newSeason.name.trim()) return;
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.from('seasons').insert({
      name: newSeason.name.trim(),
      start_date: newSeason.start_date,
      is_active: data.seasons.length === 0,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setNewSeason({ name: '', start_date: todayISO() });
    await refresh();
  }

  async function activateSeason(id: string) {
    const supabase = getSupabaseBrowser();
    // Une seule saison active à la fois.
    await supabase.from('seasons').update({ is_active: false }).neq('id', id);
    await supabase.from('seasons').update({ is_active: true }).eq('id', id);
    await refresh();
  }

  async function deleteSeason(id: string) {
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.from('seasons').delete().eq('id', id);
    if (err) setError(err.message);
    await refresh();
  }

  async function setCoachRole(id: string, role: 'admin' | 'coach') {
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.from('coaches').update({ role }).eq('id', id);
    if (err) {
      setError(err.message);
      return;
    }
    setCoaches((c) => c.map((x) => (x.id === id ? { ...x, role } : x)));
  }

  return (
    <>
      <PageHeader
        title="Paramètres"
        subtitle="Coefficients, points, saisons et catégories du collectif"
      />

      {!isAdmin && (
        <p className="mb-4 rounded-xl bg-ice-50 p-3 text-xs text-ice-800 dark:bg-ice-950 dark:text-ice-300">
          Consultation seule — la modification des paramètres est réservée aux
          administrateurs.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Coefficients */}
        <Card className="animate-fade-up">
          <CardHeader
            title="Coefficients du classement général"
            subtitle={`Total : ${totalWeight} % ${totalWeight === 100 ? '✓' : '(doit faire 100 %)'}`}
          />
          <CardBody className="grid grid-cols-2 gap-3 pt-3">
            {WEIGHT_LABELS.map(({ key, label }) => (
              <Field key={key} label={`${label} (%)`}>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={weights[key]}
                  onChange={(e) =>
                    setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))
                  }
                />
              </Field>
            ))}
          </CardBody>
        </Card>

        {/* Points de matchs */}
        <Card className="animate-fade-up">
          <CardHeader
            title="Points des matchs"
            subtitle="Attribution automatique à chaque match enregistré"
          />
          <CardBody className="grid grid-cols-2 gap-3 pt-3">
            <Field label="Points par victoire">
              <Input
                type="number"
                min={0}
                value={winPoints}
                onChange={(e) => setWinPoints(Number(e.target.value))}
              />
            </Field>
            <Field label="Points par défaite">
              <Input
                type="number"
                min={0}
                value={lossPoints}
                onChange={(e) => setLossPoints(Number(e.target.value))}
              />
            </Field>
          </CardBody>
        </Card>

        {/* Catégories */}
        <Card className="animate-fade-up">
          <CardHeader title="Catégories" subtitle="Catégories d'âge des joueurs" />
          <CardBody className="pt-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 rounded-full bg-ice-50 px-3 py-1 text-xs font-semibold text-ice-700 dark:bg-ice-950 dark:text-ice-300"
                >
                  {c}
                  <button
                    onClick={() => setCategories((cats) => cats.filter((x) => x !== c))}
                    className="text-ice-400 hover:text-red-500"
                    title={`Supprimer ${c}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nouvelle catégorie (ex : U18)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                      setCategories((c) => [...c, newCategory.trim()]);
                      setNewCategory('');
                    }
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                    setCategories((c) => [...c, newCategory.trim()]);
                    setNewCategory('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Saisons */}
        <Card className="animate-fade-up">
          <CardHeader title="Saisons" subtitle="La saison active définit la période « Saison complète »" />
          <CardBody className="pt-3">
            <ul className="mb-3 space-y-2">
              {data.seasons.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2 dark:border-night-700"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-slate-400">Depuis le {s.start_date}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.is_active ? (
                      <Badge tone="green">Active</Badge>
                    ) : isAdmin ? (
                      <Button size="sm" variant="secondary" onClick={() => void activateSeason(s.id)}>
                        Activer
                      </Button>
                    ) : null}
                    {isAdmin && !s.is_active && (
                      <button
                        onClick={() => void deleteSeason(s.id)}
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                        title="Supprimer la saison"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {data.seasons.length === 0 && (
                <p className="py-2 text-center text-xs text-slate-400">
                  Aucune saison — créez la première ci-dessous.
                </p>
              )}
            </ul>
            {isAdmin && (
              <div className="flex gap-2">
                <Input
                  placeholder="Saison 2026-2027"
                  value={newSeason.name}
                  onChange={(e) => setNewSeason((s) => ({ ...s, name: e.target.value }))}
                />
                <Input
                  type="date"
                  value={newSeason.start_date}
                  onChange={(e) => setNewSeason((s) => ({ ...s, start_date: e.target.value }))}
                  className="w-40"
                />
                <Button variant="secondary" onClick={() => void addSeason()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Entraîneurs (admin) */}
        {isAdmin && (
          <Card className="animate-fade-up lg:col-span-2">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-ice-600 dark:text-ice-400" />
                  Entraîneurs
                </span>
              }
              subtitle="Les comptes sont créés via l'invitation Supabase (voir README) ; gérez ici les rôles."
            />
            <CardBody className="pt-3">
              <ul className="divide-y divide-slate-100 dark:divide-night-700">
                {coaches.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email}
                      </p>
                      <p className="truncate text-xs text-slate-400">{c.email}</p>
                    </div>
                    <Select
                      value={c.role}
                      onChange={(e) => void setCoachRole(c.id, e.target.value as 'admin' | 'coach')}
                      className="w-40"
                    >
                      <option value="coach">Entraîneur</option>
                      <option value="admin">Administrateur</option>
                    </Select>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {message}
        </p>
      )}

      {isAdmin && (
        <div className="mt-5 flex justify-end pb-4">
          <Button onClick={() => void saveSettings()} disabled={busy}>
            <Check className="h-4 w-4" />
            {busy ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </Button>
        </div>
      )}
    </>
  );
}

export default function SettingsPage() {
  return <DataGate>{(data) => <SettingsContent data={data} />}</DataGate>;
}
