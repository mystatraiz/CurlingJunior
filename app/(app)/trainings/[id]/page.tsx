'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { TrainingEditor } from '@/components/trainings/training-editor';
import { formatDate } from '@/lib/format';

export default function TrainingDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <DataGate>
      {(data) => {
        const training = data.trainings.find((t) => t.id === params.id);
        if (!training) {
          return (
            <div className="py-20 text-center text-sm text-slate-400">
              Entraînement introuvable.{' '}
              <Link href="/trainings" className="text-ice-600 underline">
                Retour
              </Link>
            </div>
          );
        }
        return (
          <>
            <Link
              href="/trainings"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" /> Entraînements
            </Link>
            <PageHeader
              title={`Entraînement du ${formatDate(training.date)}`}
              subtitle={training.location ?? undefined}
            />
            <TrainingEditor data={data} training={training} />
          </>
        );
      }}
    </DataGate>
  );
}
