import { describe, expect, it } from 'vitest';
import {
  allPlayerStats,
  collectiveEvolution,
  matchesForPeriod,
  matchWinner,
  performanceDistribution,
  playerEvolution,
  rankOf,
  ranking,
  trainingsForPeriod,
} from './stats';
import {
  DEFAULT_SETTINGS,
  type Attendance,
  type Dataset,
  type Match,
  type MatchPlayer,
  type Player,
  type Season,
  type Training,
  type TrainingScore,
} from './types';

/* ------------------------------------------------------------------ */
/* Fabrique de données de test                                         */
/* ------------------------------------------------------------------ */

const season: Season = {
  id: 'S1',
  name: 'Saison test',
  start_date: '2026-01-01',
  end_date: null,
  is_active: true,
  created_at: '',
};

function player(id: string, lastName: string): Player {
  return {
    id,
    first_name: 'Test',
    last_name: lastName,
    birth_date: null,
    sex: 'M',
    category: 'U18',
    dominant_hand: 'droite',
    photo_url: null,
    joined_at: null,
    is_active: true,
    created_at: '',
  };
}

function training(id: string, date: string): Training {
  return {
    id,
    season_id: 'S1',
    date,
    location: null,
    comments: null,
    created_by: null,
    created_at: '',
  };
}

const players = [player('P1', 'Alpha'), player('P2', 'Bravo')];
const inactive = { ...player('P3', 'Inactif'), is_active: false };

const trainings = [
  training('T1', '2026-01-01'),
  training('T2', '2026-01-02'),
  training('T3', '2026-01-03'),
  training('T4', '2026-01-04'),
  training('T5', '2026-01-05'),
];

const attendance: Attendance[] = [
  // P1 présent partout
  ...trainings.map((t, i) => ({
    id: `A1${i}`,
    training_id: t.id,
    player_id: 'P1',
    status: 'present' as const,
  })),
  // P2 : présent T1 T2 T5, absent T3, excusé T4
  { id: 'A21', training_id: 'T1', player_id: 'P2', status: 'present' },
  { id: 'A22', training_id: 'T2', player_id: 'P2', status: 'present' },
  { id: 'A23', training_id: 'T3', player_id: 'P2', status: 'absent' },
  { id: 'A24', training_id: 'T4', player_id: 'P2', status: 'excused' },
  { id: 'A25', training_id: 'T5', player_id: 'P2', status: 'present' },
];

// P1 noté à chaque entraînement : perf 5..9, attitude 4, sérieux 3, implication 5
const scores: TrainingScore[] = trainings.map((t, i) => ({
  id: `SC${i}`,
  training_id: t.id,
  player_id: 'P1',
  performance: 5 + i,
  attitude: 4,
  seriousness: 3,
  involvement: 5,
  comments: null,
}));

const matches: Match[] = [
  {
    id: 'M1',
    season_id: 'S1',
    date: '2026-01-01',
    team_a_name: 'A',
    team_b_name: 'B',
    score_a: 5,
    score_b: 5, // égalité
    comments: null,
    created_at: '',
  },
  {
    id: 'M2',
    season_id: 'S1',
    date: '2026-01-04',
    team_a_name: 'A',
    team_b_name: 'B',
    score_a: 6,
    score_b: 4, // victoire A
    comments: null,
    created_at: '',
  },
];

const matchPlayers: MatchPlayer[] = [
  { id: 'MP1', match_id: 'M1', player_id: 'P1', team: 'A' },
  { id: 'MP2', match_id: 'M2', player_id: 'P1', team: 'A' },
  { id: 'MP3', match_id: 'M2', player_id: 'P2', team: 'B' },
];

const ds: Dataset = {
  players: [...players, inactive],
  trainings,
  attendance,
  scores,
  matches,
  matchPlayers,
  settings: DEFAULT_SETTINGS,
  seasons: [season],
  activeSeason: season,
};

const statsSeason = allPlayerStats(ds, 'season');
const statsLast3 = allPlayerStats(ds, 'last3');
const p1 = statsSeason.find((s) => s.player.id === 'P1')!;
const p2 = statsSeason.find((s) => s.player.id === 'P2')!;

/* ------------------------------------------------------------------ */

describe('périodes', () => {
  it('saison complète = tous les entraînements de la saison active', () => {
    expect(trainingsForPeriod(ds, 'season').map((t) => t.id)).toEqual([
      'T1',
      'T2',
      'T3',
      'T4',
      'T5',
    ]);
  });

  it('« 3 derniers » = les 3 entraînements les plus récents', () => {
    expect(trainingsForPeriod(ds, 'last3').map((t) => t.id)).toEqual([
      'T3',
      'T4',
      'T5',
    ]);
  });

  it('les matchs de la période « 3 derniers » démarrent au 1er des 3 entraînements', () => {
    // T3 = 2026-01-03 → seul M2 (2026-01-04) est retenu
    expect(matchesForPeriod(ds, 'last3').map((m) => m.id)).toEqual(['M2']);
    expect(matchesForPeriod(ds, 'season').map((m) => m.id)).toEqual(['M1', 'M2']);
  });
});

describe('assiduité', () => {
  it('compte présences, absences, excusés et taux', () => {
    expect(p1.presences).toBe(5);
    expect(p1.attendanceRate).toBe(1);
    expect(p2.presences).toBe(3);
    expect(p2.absences).toBe(1);
    expect(p2.excused).toBe(1);
    expect(p2.attendanceRate).toBeCloseTo(0.6);
  });

  it('les joueurs inactifs sont exclus des statistiques', () => {
    expect(statsSeason.some((s) => s.player.id === 'P3')).toBe(false);
  });
});

describe('moyennes de notes', () => {
  it('calcule la moyenne saison', () => {
    expect(p1.avgPerformance).toBeCloseTo(7); // (5+6+7+8+9)/5
    expect(p1.avgAttitude).toBeCloseTo(4);
    expect(p1.avgSeriousness).toBeCloseTo(3);
    expect(p1.avgInvolvement).toBeCloseTo(5);
  });

  it('calcule la moyenne sur les 3 derniers entraînements', () => {
    const p1Recent = statsLast3.find((s) => s.player.id === 'P1')!;
    expect(p1Recent.avgPerformance).toBeCloseTo(8); // (7+8+9)/3
  });

  it('renvoie null sans aucune note', () => {
    expect(p2.avgPerformance).toBeNull();
  });
});

describe('matchs', () => {
  it('déduit le vainqueur du score', () => {
    expect(matchWinner(matches[0])).toBeNull(); // 5-5
    expect(matchWinner(matches[1])).toBe('A');
  });

  it('attribue 2 pts par victoire, 1 pt par défaite/égalité', () => {
    // P1 : égalité (1 pt) + victoire (2 pts) = 3 pts
    expect(p1.matchPoints).toBe(3);
    expect(p1.matchesWon).toBe(1);
    expect(p1.matchesDrawn).toBe(1);
    // P2 : défaite = 1 pt
    expect(p2.matchPoints).toBe(1);
    expect(p2.matchesLost).toBe(1);
  });
});

describe('progression', () => {
  it('compare les 3 derniers entraînements notés aux 3 précédents', () => {
    // notes [5,6,7,8,9] → récent (7+8+9)/3 = 8 ; précédent (5+6)/2 = 5,5
    expect(p1.progression).toBeCloseTo(2.5);
  });

  it('renvoie null sans données suffisantes', () => {
    expect(p2.progression).toBeNull();
  });
});

describe('classement général pondéré', () => {
  it('applique les coefficients des paramètres', () => {
    // P1 : perf 7/10 (30) + matchs 3/3 (25) + assiduité 100 % (20)
    //      + attitude 4/5 (10) + sérieux 3/5 (10) + implication 5/5 (5)
    // = 21 + 25 + 20 + 8 + 6 + 5 = 85
    expect(p1.generalScore).toBeCloseTo(85);
  });

  it('re-normalise sur les composantes disponibles', () => {
    // P2 : matchs 1/3 (25) + assiduité 60 % (20) → (25/3 + 12) / 45 × 100
    expect(p2.generalScore).toBeCloseTo(((25 / 3 + 12) / 45) * 100);
  });

  it('classe P1 devant P2 et calcule les rangs', () => {
    const ranked = ranking(statsSeason, 'general');
    expect(ranked[0].player.id).toBe('P1');
    expect(rankOf(statsSeason, 'general', 'P1')).toBe(1);
    expect(rankOf(statsSeason, 'general', 'P2')).toBe(2);
  });

  it('met les joueurs sans valeur en fin de classement', () => {
    const perf = ranking(statsSeason, 'performance');
    expect(perf[perf.length - 1].player.id).toBe('P2'); // aucune note
  });
});

describe('séries pour graphiques', () => {
  it("produit l'évolution d'un joueur", () => {
    const evo = playerEvolution(ds, 'P1', 'last3');
    expect(evo).toHaveLength(3);
    expect(evo.map((p) => p.performance)).toEqual([7, 8, 9]);
    expect(evo.every((p) => p.present)).toBe(true);
  });

  it("produit l'évolution moyenne du collectif", () => {
    const evo = collectiveEvolution(ds, 'season');
    expect(evo).toHaveLength(5);
    expect(evo[0].avgPerformance).toBeCloseTo(5); // seul P1 noté
    expect(evo[0].presences).toBe(2); // P1 + P2 présents à T1
  });

  it('répartit les notes de performance en buckets', () => {
    const dist = performanceDistribution(ds, 'season');
    // notes 5,6,7,8,9 → 4–6 : 1 (5) · 6–8 : 2 (6,7) · 8–10 : 2 (8,9)
    expect(dist.find((d) => d.bucket === '4–6')?.count).toBe(1);
    expect(dist.find((d) => d.bucket === '6–8')?.count).toBe(2);
    expect(dist.find((d) => d.bucket === '8–10')?.count).toBe(2);
  });
});
