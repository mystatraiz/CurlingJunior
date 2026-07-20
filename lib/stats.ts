/**
 * Moteur de statistiques du Collectif Junior France – Curling.
 *
 * Toutes les fonctions sont pures : elles reçoivent le jeu de données complet
 * (Dataset) et calculent moyennes, assiduité, points de matchs, progression et
 * classement général pondéré. Le filtrage « 3 derniers entraînements » vs
 * « saison complète » est appliqué en amont via trainingsForPeriod /
 * matchesForPeriod, ce qui rend le moteur trivialement testable.
 */

import type {
  Attendance,
  Dataset,
  Match,
  MatchPlayer,
  Period,
  Player,
  Training,
  TrainingScore,
  Weights,
} from './types';

/** Nombre d'entraînements pris en compte pour la « forme actuelle ». */
export const RECENT_WINDOW = 3;

export interface PlayerStats {
  player: Player;
  /** Entraînements de la période (référence pour le taux de présence). */
  trainingsTotal: number;
  presences: number;
  absences: number;
  excused: number;
  /** Taux de présence 0..1 (présent / entraînements de la période). */
  attendanceRate: number;
  /** Moyenne sur 10, null si aucune note. */
  avgPerformance: number | null;
  /** Moyennes sur 5, null si aucune note. */
  avgAttitude: number | null;
  avgSeriousness: number | null;
  avgInvolvement: number | null;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  matchPoints: number;
  /** Score général pondéré 0..100 (null si aucune donnée exploitable). */
  generalScore: number | null;
  /** Δ de performance : moyenne des 3 derniers vs les 3 précédents. */
  progression: number | null;
}

export interface EvolutionPoint {
  trainingId: string;
  date: string;
  performance: number | null;
  attitude: number | null;
  seriousness: number | null;
  involvement: number | null;
  present: boolean;
}

export interface CollectivePoint {
  trainingId: string;
  date: string;
  /** Moyenne de performance du groupe sur cet entraînement (sur 10). */
  avgPerformance: number | null;
  /** Taux de présence du groupe sur cet entraînement (0..1). */
  attendanceRate: number | null;
  presences: number;
}

/* ------------------------------------------------------------------ */
/* Périodes                                                            */
/* ------------------------------------------------------------------ */

function byDateAsc<T extends { date: string }>(a: T, b: T): number {
  return a.date.localeCompare(b.date) || 0;
}

/** Entraînements de la saison active, triés par date croissante. */
export function seasonTrainings(ds: Dataset): Training[] {
  const list = ds.activeSeason
    ? ds.trainings.filter(
        (t) => t.season_id === ds.activeSeason!.id || t.season_id === null
      )
    : ds.trainings;
  return [...list].sort(byDateAsc);
}

/** Entraînements de la période demandée, triés par date croissante. */
export function trainingsForPeriod(ds: Dataset, period: Period): Training[] {
  const season = seasonTrainings(ds);
  if (period === 'season') return season;
  return season.slice(-RECENT_WINDOW);
}

/** Matchs de la saison active, triés par date croissante. */
export function seasonMatches(ds: Dataset): Match[] {
  const list = ds.activeSeason
    ? ds.matches.filter(
        (m) => m.season_id === ds.activeSeason!.id || m.season_id === null
      )
    : ds.matches;
  return [...list].sort(byDateAsc);
}

/**
 * Matchs de la période. Pour « 3 derniers entraînements », on retient les
 * matchs joués depuis la date du plus ancien des 3 derniers entraînements
 * (à défaut d'entraînement : les 3 derniers matchs).
 */
export function matchesForPeriod(ds: Dataset, period: Period): Match[] {
  const season = seasonMatches(ds);
  if (period === 'season') return season;
  const recent = trainingsForPeriod(ds, 'last3');
  if (recent.length === 0) return season.slice(-RECENT_WINDOW);
  const from = recent[0].date;
  return season.filter((m) => m.date >= from);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function round1(v: number | null): number | null {
  return v === null ? null : Math.round(v * 10) / 10;
}

/** Vainqueur d'un match : 'A', 'B' ou null (égalité). */
export function matchWinner(m: Match): 'A' | 'B' | null {
  if (m.score_a > m.score_b) return 'A';
  if (m.score_b > m.score_a) return 'B';
  return null;
}

/* ------------------------------------------------------------------ */
/* Statistiques par joueur                                             */
/* ------------------------------------------------------------------ */

interface Indexed {
  attendanceByTraining: Map<string, Attendance[]>;
  scoresByTraining: Map<string, TrainingScore[]>;
  playersByMatch: Map<string, MatchPlayer[]>;
}

function indexDataset(ds: Dataset): Indexed {
  const attendanceByTraining = new Map<string, Attendance[]>();
  for (const a of ds.attendance) {
    const list = attendanceByTraining.get(a.training_id) ?? [];
    list.push(a);
    attendanceByTraining.set(a.training_id, list);
  }
  const scoresByTraining = new Map<string, TrainingScore[]>();
  for (const s of ds.scores) {
    const list = scoresByTraining.get(s.training_id) ?? [];
    list.push(s);
    scoresByTraining.set(s.training_id, list);
  }
  const playersByMatch = new Map<string, MatchPlayer[]>();
  for (const mp of ds.matchPlayers) {
    const list = playersByMatch.get(mp.match_id) ?? [];
    list.push(mp);
    playersByMatch.set(mp.match_id, list);
  }
  return { attendanceByTraining, scoresByTraining, playersByMatch };
}

function computePlayerRaw(
  ds: Dataset,
  idx: Indexed,
  player: Player,
  trainings: Training[],
  matches: Match[]
): Omit<PlayerStats, 'generalScore' | 'progression'> {
  let presences = 0;
  let absences = 0;
  let excused = 0;
  const perf: number[] = [];
  const att: number[] = [];
  const ser: number[] = [];
  const inv: number[] = [];

  for (const t of trainings) {
    const a = idx.attendanceByTraining
      .get(t.id)
      ?.find((x) => x.player_id === player.id);
    if (a?.status === 'present') presences += 1;
    else if (a?.status === 'excused') excused += 1;
    else absences += 1; // absent explicite ou non pointé

    const s = idx.scoresByTraining
      .get(t.id)
      ?.find((x) => x.player_id === player.id);
    if (s) {
      if (s.performance !== null) perf.push(s.performance);
      if (s.attitude !== null) att.push(s.attitude);
      if (s.seriousness !== null) ser.push(s.seriousness);
      if (s.involvement !== null) inv.push(s.involvement);
    }
  }

  let played = 0;
  let won = 0;
  let lost = 0;
  let drawn = 0;
  let points = 0;
  for (const m of matches) {
    const mp = idx.playersByMatch
      .get(m.id)
      ?.find((x) => x.player_id === player.id);
    if (!mp) continue;
    played += 1;
    const winner = matchWinner(m);
    if (winner === null) {
      drawn += 1;
      points += ds.settings.loss_points;
    } else if (winner === mp.team) {
      won += 1;
      points += ds.settings.win_points;
    } else {
      lost += 1;
      points += ds.settings.loss_points;
    }
  }

  const total = trainings.length;
  return {
    player,
    trainingsTotal: total,
    presences,
    absences,
    excused,
    attendanceRate: total > 0 ? presences / total : 0,
    avgPerformance: avg(perf),
    avgAttitude: avg(att),
    avgSeriousness: avg(ser),
    avgInvolvement: avg(inv),
    matchesPlayed: played,
    matchesWon: won,
    matchesLost: lost,
    matchesDrawn: drawn,
    matchPoints: points,
  };
}

/**
 * Progression = moyenne de performance sur les 3 derniers entraînements notés
 * moins la moyenne sur les 3 précédents. Null si pas assez de données.
 */
function computeProgression(
  ds: Dataset,
  idx: Indexed,
  playerId: string
): number | null {
  const trainings = seasonTrainings(ds);
  const noted: number[] = [];
  for (const t of trainings) {
    const s = idx.scoresByTraining
      .get(t.id)
      ?.find((x) => x.player_id === playerId);
    if (s && s.performance !== null) noted.push(s.performance);
  }
  if (noted.length < 2) return null;
  const recent = noted.slice(-RECENT_WINDOW);
  const previous = noted.slice(
    Math.max(0, noted.length - RECENT_WINDOW * 2),
    noted.length - RECENT_WINDOW
  );
  const base = previous.length > 0 ? avg(previous) : null;
  if (base === null) {
    // Pas d'historique antérieur : progression au sein de la fenêtre récente.
    if (recent.length < 2) return null;
    return recent[recent.length - 1] - recent[0];
  }
  return (avg(recent) as number) - base;
}

/**
 * Score général pondéré 0..100.
 * Chaque composante est normalisée sur 0..1 puis pondérée par les
 * coefficients (%) des paramètres. Les points de matchs sont normalisés par
 * rapport au maximum de points obtenus dans le groupe sur la période.
 */
export function generalScore(
  s: Omit<PlayerStats, 'generalScore' | 'progression'>,
  weights: Weights,
  maxMatchPoints: number
): number | null {
  const parts: Array<{ weight: number; value: number | null }> = [
    { weight: weights.performance, value: s.avgPerformance !== null ? s.avgPerformance / 10 : null },
    { weight: weights.matches, value: maxMatchPoints > 0 ? s.matchPoints / maxMatchPoints : null },
    { weight: weights.attendance, value: s.trainingsTotal > 0 ? s.attendanceRate : null },
    { weight: weights.attitude, value: s.avgAttitude !== null ? s.avgAttitude / 5 : null },
    { weight: weights.seriousness, value: s.avgSeriousness !== null ? s.avgSeriousness / 5 : null },
    { weight: weights.involvement, value: s.avgInvolvement !== null ? s.avgInvolvement / 5 : null },
  ];
  const usable = parts.filter((p) => p.value !== null && p.weight > 0);
  if (usable.length === 0) return null;
  const totalWeight = usable.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return null;
  const score = usable.reduce((sum, p) => sum + p.weight * (p.value as number), 0);
  return (score / totalWeight) * 100;
}

/** Statistiques complètes de tous les joueurs actifs pour une période. */
export function allPlayerStats(ds: Dataset, period: Period): PlayerStats[] {
  const idx = indexDataset(ds);
  const trainings = trainingsForPeriod(ds, period);
  const matches = matchesForPeriod(ds, period);
  const raw = ds.players
    .filter((p) => p.is_active)
    .map((p) => computePlayerRaw(ds, idx, p, trainings, matches));
  const maxPoints = raw.reduce((m, r) => Math.max(m, r.matchPoints), 0);
  return raw.map((r) => ({
    ...r,
    generalScore: generalScore(r, ds.settings.weights, maxPoints),
    progression: computeProgression(ds, idx, r.player.id),
  }));
}

/* ------------------------------------------------------------------ */
/* Classements                                                         */
/* ------------------------------------------------------------------ */

export type RankingKey =
  | 'general'
  | 'performance'
  | 'attitude'
  | 'seriousness'
  | 'involvement'
  | 'attendance'
  | 'matches';

export function rankingValue(s: PlayerStats, key: RankingKey): number | null {
  switch (key) {
    case 'general':
      return s.generalScore;
    case 'performance':
      return s.avgPerformance;
    case 'attitude':
      return s.avgAttitude;
    case 'seriousness':
      return s.avgSeriousness;
    case 'involvement':
      return s.avgInvolvement;
    case 'attendance':
      return s.trainingsTotal > 0 ? s.attendanceRate * 100 : null;
    case 'matches':
      return s.matchesPlayed > 0 || s.matchPoints > 0 ? s.matchPoints : null;
  }
}

/**
 * Classement décroissant sur la clé donnée. Les joueurs sans valeur sont
 * placés en fin de liste.
 */
export function ranking(stats: PlayerStats[], key: RankingKey): PlayerStats[] {
  return [...stats].sort((a, b) => {
    const va = rankingValue(a, key);
    const vb = rankingValue(b, key);
    if (va === null && vb === null) return a.player.last_name.localeCompare(b.player.last_name);
    if (va === null) return 1;
    if (vb === null) return -1;
    return vb - va;
  });
}

/** Position (1-indexée) d'un joueur dans un classement, null si non classé. */
export function rankOf(
  stats: PlayerStats[],
  key: RankingKey,
  playerId: string
): number | null {
  const ranked = ranking(stats, key).filter((s) => rankingValue(s, key) !== null);
  const i = ranked.findIndex((s) => s.player.id === playerId);
  return i === -1 ? null : i + 1;
}

/* ------------------------------------------------------------------ */
/* Séries pour graphiques                                              */
/* ------------------------------------------------------------------ */

/** Série d'évolution d'un joueur, un point par entraînement de la période. */
export function playerEvolution(
  ds: Dataset,
  playerId: string,
  period: Period
): EvolutionPoint[] {
  const idx = indexDataset(ds);
  return trainingsForPeriod(ds, period).map((t) => {
    const s = idx.scoresByTraining
      .get(t.id)
      ?.find((x) => x.player_id === playerId);
    const a = idx.attendanceByTraining
      .get(t.id)
      ?.find((x) => x.player_id === playerId);
    return {
      trainingId: t.id,
      date: t.date,
      performance: s?.performance ?? null,
      attitude: s?.attitude ?? null,
      seriousness: s?.seriousness ?? null,
      involvement: s?.involvement ?? null,
      present: a?.status === 'present',
    };
  });
}

/** Série d'évolution moyenne du collectif, un point par entraînement. */
export function collectiveEvolution(
  ds: Dataset,
  period: Period
): CollectivePoint[] {
  const idx = indexDataset(ds);
  const activeCount = ds.players.filter((p) => p.is_active).length;
  return trainingsForPeriod(ds, period).map((t) => {
    const scores = (idx.scoresByTraining.get(t.id) ?? [])
      .map((s) => s.performance)
      .filter((v): v is number => v !== null);
    const present = (idx.attendanceByTraining.get(t.id) ?? []).filter(
      (a) => a.status === 'present'
    ).length;
    return {
      trainingId: t.id,
      date: t.date,
      avgPerformance: avg(scores),
      attendanceRate: activeCount > 0 ? present / activeCount : null,
      presences: present,
    };
  });
}

/** Répartition des notes de performance en buckets 0-2, 2-4, 4-6, 6-8, 8-10. */
export function performanceDistribution(
  ds: Dataset,
  period: Period
): Array<{ bucket: string; count: number }> {
  const trainings = new Set(trainingsForPeriod(ds, period).map((t) => t.id));
  const buckets = [0, 0, 0, 0, 0];
  for (const s of ds.scores) {
    if (!trainings.has(s.training_id) || s.performance === null) continue;
    const i = Math.min(4, Math.floor(s.performance / 2));
    buckets[i] += 1;
  }
  return buckets.map((count, i) => ({
    bucket: i === 4 ? '8–10' : `${i * 2}–${i * 2 + 2}`,
    count,
  }));
}
