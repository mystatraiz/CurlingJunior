'use client';

import { usePeriod } from '@/components/providers/period-provider';
import { Segmented } from '@/components/ui/segmented';
import type { Period } from '@/lib/types';

/** Sélecteur global « 3 derniers entraînements » / « Saison complète ». */
export function PeriodSwitch({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { period, setPeriod } = usePeriod();
  return (
    <Segmented<Period>
      size={size}
      value={period}
      onChange={setPeriod}
      options={[
        { value: 'last3', label: '3 derniers' },
        { value: 'season', label: 'Saison complète' },
      ]}
    />
  );
}
