'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK, GRID, SERIES, SERIES_LABELS } from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

export interface QualityPoint {
  label: string;
  attitude: number | null;
  seriousness: number | null;
  involvement: number | null;
}

/**
 * Courbes des trois qualités notées sur 5 (même échelle → même axe).
 * La performance (/10) vit dans son propre graphique : jamais de double axe.
 */
export function QualityLines({
  data,
  height = 240,
}: {
  data: QualityPoint[];
  height?: number;
}) {
  const lines = [
    { key: 'attitude', color: SERIES.attitude },
    { key: 'seriousness', color: SERIES.seriousness },
    { key: 'involvement', color: SERIES.involvement },
  ] as const;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -22 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis domain={[0, 5]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: 'var(--chart-text)' }}
        />
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={SERIES_LABELS[l.key]}
            stroke={l.color}
            strokeWidth={2}
            dot={{ r: 3, fill: l.color, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--chart-grid)' }}
            connectNulls
            animationDuration={500}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
