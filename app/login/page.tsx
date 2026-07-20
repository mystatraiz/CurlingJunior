'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Lock, Mail, Snowflake, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { getSupabaseBrowser, isSupabaseConfigured } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function signInWithPassword(e: FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : err.message
      );
      return;
    }
    router.replace(params.get('next') ?? '/dashboard');
    router.refresh();
  }

  async function sendMagicLink() {
    if (!configured || !email) {
      setError('Saisissez votre adresse email pour recevoir un lien de connexion.');
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo('Lien de connexion envoyé ! Consultez votre boîte mail.');
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-50 via-ice-50 to-ice-100 p-4 pt-[max(1rem,env(safe-area-inset-top))] dark:from-night-900 dark:via-night-900 dark:to-ice-950">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-ice-400 to-ice-700 text-white shadow-lg shadow-ice-600/25">
            <Snowflake className="h-8 w-8" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Collectif Junior France
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-ice-600 dark:text-ice-400">
            Curling · Espace entraîneurs
          </p>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-night-700/60 dark:bg-night-800/80">
          {!configured && (
            <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Supabase n&apos;est pas configuré. Copiez <code>.env.example</code>{' '}
              vers <code>.env.local</code> et renseignez vos clés.
            </p>
          )}
          <form onSubmit={signInWithPassword} className="space-y-4">
            <Field label="Adresse email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@ffcurling.fr"
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Mot de passe">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </Field>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {info}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy || !configured}>
              {busy ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <button
            onClick={() => void sendMagicLink()}
            disabled={busy || !configured}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium text-ice-700 transition-colors hover:bg-ice-50 disabled:opacity-60 dark:text-ice-300 dark:hover:bg-night-700"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Recevoir un lien de connexion par email
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Accès réservé aux entraîneurs du Collectif Junior France.
          <br />
          Les comptes sont créés par un administrateur.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
