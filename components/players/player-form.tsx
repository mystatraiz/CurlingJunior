'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useData } from '@/components/providers/data-provider';
import type { Hand, Player, Sex } from '@/lib/types';
import { todayISO } from '@/lib/format';

/** Formulaire joueur (création si `player` absent, édition sinon). */
export function PlayerForm({
  player,
  onDone,
}: {
  player?: Player;
  onDone: () => void;
}) {
  const { data, refresh } = useData();
  const categories = data?.settings.categories ?? [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    player?.photo_url ?? null
  );

  const [form, setForm] = useState({
    first_name: player?.first_name ?? '',
    last_name: player?.last_name ?? '',
    birth_date: player?.birth_date ?? '',
    sex: (player?.sex ?? 'M') as Sex,
    category: player?.category ?? categories[0] ?? '',
    dominant_hand: (player?.dominant_hand ?? 'droite') as Hand,
    joined_at: player?.joined_at ?? todayISO(),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = getSupabaseBrowser();
    try {
      const payload = {
        ...form,
        birth_date: form.birth_date || null,
        category: form.category || null,
        joined_at: form.joined_at || null,
      };

      let playerId = player?.id;
      if (player) {
        const { error: err } = await supabase
          .from('players')
          .update(payload)
          .eq('id', player.id);
        if (err) throw new Error(err.message);
      } else {
        const { data: inserted, error: err } = await supabase
          .from('players')
          .insert(payload)
          .select('id')
          .single();
        if (err) throw new Error(err.message);
        playerId = (inserted as { id: string }).id;
      }

      // Upload de la photo si une nouvelle a été choisie.
      const file = fileRef.current?.files?.[0];
      if (file && playerId) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${playerId}/photo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('player-photos')
          .upload(path, file, { upsert: true });
        if (upErr) throw new Error(`Photo : ${upErr.message}`);
        const { data: pub } = supabase.storage
          .from('player-photos')
          .getPublicUrl(path);
        const { error: urlErr } = await supabase
          .from('players')
          .update({ photo_url: pub.publicUrl })
          .eq('id', playerId);
        if (urlErr) throw new Error(urlErr.message);
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
      {/* Photo */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 transition-all hover:ring-ice-400 dark:bg-night-700 dark:ring-night-700"
        >
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" className="h-full w-full object-cover" />
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center bg-night-950/0 text-white transition-colors group-hover:bg-night-950/40">
            <Camera className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </button>
        <div className="text-xs text-slate-400">
          <p className="font-medium text-slate-600 dark:text-slate-300">Photo du joueur</p>
          <p>JPG ou PNG. Cliquez pour choisir.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPhotoPreview(URL.createObjectURL(f));
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom">
          <Input
            required
            value={form.first_name}
            onChange={(e) => set('first_name', e.target.value)}
          />
        </Field>
        <Field label="Nom">
          <Input
            required
            value={form.last_name}
            onChange={(e) => set('last_name', e.target.value)}
          />
        </Field>
        <Field label="Date de naissance">
          <Input
            type="date"
            value={form.birth_date}
            onChange={(e) => set('birth_date', e.target.value)}
          />
        </Field>
        <Field label="Sexe">
          <Select value={form.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </Select>
        </Field>
        <Field label="Catégorie">
          <Select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Main dominante">
          <Select
            value={form.dominant_hand}
            onChange={(e) => set('dominant_hand', e.target.value as Hand)}
          >
            <option value="droite">Droite</option>
            <option value="gauche">Gauche</option>
            <option value="ambidextre">Ambidextre</option>
          </Select>
        </Field>
        <Field label="Entrée dans le collectif" className="col-span-2">
          <Input
            type="date"
            value={form.joined_at}
            onChange={(e) => set('joined_at', e.target.value)}
          />
        </Field>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Enregistrement…' : player ? 'Enregistrer' : 'Ajouter le joueur'}
        </Button>
      </div>
    </form>
  );
}
