/**
 * Types du domaine — miroir du schéma Supabase (voir supabase/migrations).
 */

export type Role = 'admin' | 'coach';
export type Sex = 'M' | 'F';
export type Hand = 'droite' | 'gauche' | 'ambidextre';
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type TeamSide = 'A' | 'B';

/** Période de consultation des statistiques et classements. */
export type Period = 'last3' | 'season';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  created_at: string;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  sex: Sex | null;
  category: string | null;
  dominant_hand: Hand | null;
  photo_url: string | null;
  joined_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Training {
  id: string;
  season_id: string | null;
  date: string;
  location: string | null;
  comments: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  training_id: string;
  player_id: string;
  status: AttendanceStatus;
}

export interface TrainingScore {
  id: string;
  training_id: string;
  player_id: string;
  /** Note sur 10 */
  performance: number | null;
  /** Note sur 5 */
  attitude: number | null;
  /** Note sur 5 */
  seriousness: number | null;
  /** Note sur 5 */
  involvement: number | null;
  comments: string | null;
}

export interface Match {
  id: string;
  season_id: string | null;
  date: string;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  comments: string | null;
  created_at: string;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  player_id: string;
  team: TeamSide;
}

/** Coefficients (en %) du classement général — modifiables dans Paramètres. */
export interface Weights {
  performance: number;
  matches: number;
  attendance: number;
  attitude: number;
  seriousness: number;
  involvement: number;
}

export interface Settings {
  id: number;
  weights: Weights;
  win_points: number;
  loss_points: number;
  categories: string[];
  updated_at: string;
}

export const DEFAULT_WEIGHTS: Weights = {
  performance: 30,
  matches: 25,
  attendance: 20,
  attitude: 10,
  seriousness: 10,
  involvement: 5,
};

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  weights: DEFAULT_WEIGHTS,
  win_points: 2,
  loss_points: 1,
  categories: ['U15', 'U18', 'U21'],
  updated_at: new Date(0).toISOString(),
};

/** Jeu de données complet chargé depuis Supabase. */
export interface Dataset {
  players: Player[];
  trainings: Training[];
  attendance: Attendance[];
  scores: TrainingScore[];
  matches: Match[];
  matchPlayers: MatchPlayer[];
  settings: Settings;
  seasons: Season[];
  activeSeason: Season | null;
}
