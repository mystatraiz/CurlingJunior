'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from './auth-provider';
import {
  DEFAULT_SETTINGS,
  type Attendance,
  type Dataset,
  type Match,
  type MatchPlayer,
  type Player,
  type Season,
  type Settings,
  type Training,
  type TrainingScore,
} from '@/lib/types';

interface DataContextValue {
  data: Dataset | null;
  loading: boolean;
  error: string | null;
  /** Recharge l'intégralité des données après une mutation. */
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue>({
  data: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

/**
 * Charge l'ensemble du jeu de données en une passe. À l'échelle d'un
 * collectif (quelques dizaines de joueurs, ~100 entraînements/saison), tout
 * charger côté client simplifie énormément le filtrage par période et les
 * calculs croisés, tout en restant instantané.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const { session, configured } = useAuth();
  const [data, setData] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!configured || !session) return;
    const supabase = getSupabaseBrowser();
    setError(null);
    try {
      const [
        players,
        trainings,
        attendance,
        scores,
        matches,
        matchPlayers,
        settings,
        seasons,
      ] = await Promise.all([
        supabase.from('players').select('*').order('last_name'),
        supabase.from('trainings').select('*').order('date'),
        supabase.from('attendance').select('*'),
        supabase.from('training_scores').select('*'),
        supabase.from('matches').select('*').order('date'),
        supabase.from('match_players').select('*'),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('seasons').select('*').order('start_date'),
      ]);

      const firstError =
        players.error ??
        trainings.error ??
        attendance.error ??
        scores.error ??
        matches.error ??
        matchPlayers.error ??
        settings.error ??
        seasons.error;
      if (firstError) throw new Error(firstError.message);

      const seasonList = (seasons.data ?? []) as Season[];
      setData({
        players: (players.data ?? []) as Player[],
        trainings: (trainings.data ?? []) as Training[],
        attendance: (attendance.data ?? []) as Attendance[],
        scores: (scores.data ?? []) as TrainingScore[],
        matches: (matches.data ?? []) as Match[],
        matchPlayers: (matchPlayers.data ?? []) as MatchPlayer[],
        settings: (settings.data as Settings) ?? DEFAULT_SETTINGS,
        seasons: seasonList,
        activeSeason: seasonList.find((s) => s.is_active) ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  }, [configured, session]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const value = useMemo(
    () => ({ data, loading, error, refresh: load }),
    [data, loading, error, load]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
