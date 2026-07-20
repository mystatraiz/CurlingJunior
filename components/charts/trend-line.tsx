'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK, GRID, SERIES } from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

export interface TrendPoint {
  label: string;
  value: number | null;
}

/**
 * Courbe d'évolution mono-série (le titre de la carte nomme la série —
 * pas de légende nécessaire pour une série unique).
 */
export function TrendLine({
  data,
  domain,
  name,
  color = SERIES.performance,
  height = 240,
  unit,
}: {
  data: TrendPoint[];
  domain: [number, number];
  name: string;
  color?: string;
  height?: number;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          domain={domain}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={46}
          unit={unit}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
        <Line
          type="monotone"
          dataKey="value"
          name={name}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--chart-grid)' }}
          connectNulls
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
