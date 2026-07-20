'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK, GRID, SERIES } from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

export interface BarPoint {
  label: string;
  value: number;
}

/** Histogramme vertical mono-série (présences, répartition des notes…). */
export function SimpleBars({
  data,
  name,
  color = SERIES.performance,
  height = 240,
  domain,
  unit,
}: {
  data: BarPoint[];
  name: string;
  color?: string;
  height?: number;
  domain?: [number, number];
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -22 }} barCategoryGap="28%">
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          domain={domain}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
          unit={unit}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--chart-grid)', opacity: 0.35 }} />
        <Bar
          dataKey="value"
          name={name}
          fill={color}
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
          animationDuration={500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Barres horizontales classées (victoires / points de matchs par joueur). */
export function RankedBars({
  data,
  name,
  color = SERIES.performance,
  highlight,
  height,
}: {
  data: BarPoint[];
  name: string;
  color?: string;
  /** Label à mettre en avant (ex : joueur courant). */
  highlight?: string;
  height?: number;
}) {
  const h = height ?? Math.max(140, data.length * 36 + 30);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 0, left: 8 }}
        barCategoryGap="30%"
      >
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ ...AXIS_TICK, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--chart-grid)', opacity: 0.35 }} />
        <Bar dataKey="value" name={name} radius={[0, 4, 4, 0]} maxBarSize={22} animationDuration={500}>
          {data.map((d) => (
            <Cell
              key={d.label}
              fill={color}
              opacity={highlight && d.label !== highlight ? 0.45 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
