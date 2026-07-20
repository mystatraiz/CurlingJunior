/**
 * Thème partagé des graphiques Recharts.
 * Les couleurs sont des variables CSS (voir globals.css) : elles suivent
 * automatiquement le mode clair/sombre. Affectation fixe par entité :
 * s1 Performance · s2 Attitude · s3 Sérieux · s4 Implication.
 */

export const SERIES = {
  performance: 'var(--chart-s1)',
  attitude: 'var(--chart-s2)',
  seriousness: 'var(--chart-s3)',
  involvement: 'var(--chart-s4)',
} as const;

export const GRID = 'var(--chart-grid)';
export const TEXT = 'var(--chart-text)';

export const AXIS_TICK = { fontSize: 11, fill: 'var(--chart-text)' } as const;

export const SERIES_LABELS: Record<keyof typeof SERIES, string> = {
  performance: 'Performance',
  attitude: 'Attitude',
  seriousness: 'Sérieux',
  involvement: 'Implication',
};
