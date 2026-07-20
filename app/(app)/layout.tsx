'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { DataProvider } from '@/components/providers/data-provider';
import { PeriodProvider } from '@/components/providers/period-provider';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <PeriodProvider>
        <AppShell>{children}</AppShell>
      </PeriodProvider>
    </DataProvider>
  );
}
