'use client';

import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useData } from '@/components/providers/data-provider';
import { PageLoader } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import type { Dataset } from '@/lib/types';

/**
 * Garde de chargement : affiche loader / erreur, puis rend les enfants avec
 * le jeu de données garanti non nul.
 */
export function DataGate({
  children,
}: {
  children: (data: Dataset) => ReactNode;
}) {
  const { data, loading, error, refresh } = useData();

  if (loading && !data) return <PageLoader />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            Impossible de charger les données
          </p>
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
          <p className="mt-2 text-xs text-red-400 dark:text-red-500">
            Vérifiez que les migrations Supabase ont été appliquées (voir README).
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void refresh()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!data) return <PageLoader />;
  return <>{children(data)}</>;
}
