'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { TrainingEditor } from '@/components/trainings/training-editor';

function NewTrainingContent() {
  // ?date=aaaa-mm-jj — pré-remplie quand on vient d'un match.
  const params = useSearchParams();
  const initialDate = params.get('date') ?? undefined;

  return (
    <DataGate>
      {(data) => (
        <>
          <PageHeader
            title="Nouvel entraînement"
            subtitle="Renseignez la séance, pointez les présences puis notez les joueurs."
          />
          <TrainingEditor data={data} initialDate={initialDate} />
        </>
      )}
    </DataGate>
  );
}

export default function NewTrainingPage() {
  return (
    <Suspense>
      <NewTrainingContent />
    </Suspense>
  );
}
