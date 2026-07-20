'use client';

import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { TrainingEditor } from '@/components/trainings/training-editor';

export default function NewTrainingPage() {
  return (
    <DataGate>
      {(data) => (
        <>
          <PageHeader
            title="Nouvel entraînement"
            subtitle="Renseignez la séance, pointez les présences puis notez les joueurs."
          />
          <TrainingEditor data={data} />
        </>
      )}
    </DataGate>
  );
}
