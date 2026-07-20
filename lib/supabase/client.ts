'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/** True si les variables d'environnement Supabase sont renseignées. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let client: SupabaseClient | null = null;

/**
 * Client Supabase côté navigateur (singleton).
 * Lève une erreur explicite si l'environnement n'est pas configuré :
 * les appelants doivent vérifier isSupabaseConfigured() en amont.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local'
    );
  }
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
