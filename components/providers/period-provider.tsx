'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Period } from '@/lib/types';

interface PeriodContextValue {
  period: Period;
  setPeriod: (p: Period) => void;
}

const PeriodContext = createContext<PeriodContextValue>({
  period: 'season',
  setPeriod: () => {},
});

/** Sélecteur global « 3 derniers entraînements » / « Saison complète ». */
export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>('season');
  return (
    <PeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  return useContext(PeriodContext);
}
