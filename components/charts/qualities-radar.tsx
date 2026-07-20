'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { GRID, SERIES } from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

export interface RadarPoint {
  axis: string;
  /** Valeur normalisée 0..100 (% du maximum de l'échelle). */
  value: number;
}

/** Radar des qualités (toutes les composantes normalisées sur 100). */
export function QualitiesRadar({
  data,
  name,
  height = 260,
}: {
  data: RadarPoint[];
  name: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 11, fill: 'var(--chart-text)' }}
        />
        <Tooltip
          content={<ChartTooltip formatter={(v) => `${Math.round(v)} %`} />}
        />
        <Radar
          name={name}
          dataKey="value"
          stroke={SERIES.performance}
          strokeWidth={2}
          fill={SERIES.performance}
          fillOpacity={0.18}
          dot={{ r: 3, fill: SERIES.performance, strokeWidth: 0 }}
          animationDuration={500}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
