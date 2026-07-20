'use client';

import Link from 'next/link';
import { CalendarDays, ChevronRight, MapPin, Plus, Users } from 'lucide-react';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { seasonTrainings } from '@/lib/stats';
import { formatDate, formatNote } from '@/lib/format';
import type { Dataset } from '@/lib/types';

function TrainingsContent({ data }: { data: Dataset }) {
  const trainings = [...seasonTrainings(data)].reverse();

  return (
    <>
      <PageHeader
        title="Entraînements"
        subtitle={`${trainings.length} séance${trainings.length > 1 ? 's' : ''} cette saison`}
        action={
          <Link href="/trainings/new">
            <Button>
              <Plus className="h-4 w-4" /> Nouvel entraînement
            </Button>
          </Link>
        }
      />

      {trainings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aucun entraînement"
          description="Créez votre première séance pour commencer à noter les joueurs."
          action={
            <Link href="/trainings/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Créer un entraînement
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {trainings.map((t) => {
            const att = data.attendance.filter((a) => a.training_id === t.id);
            const present = att.filter((a) => a.status === 'present').length;
            const scores = data.scores.filter(
              (s) => s.training_id === t.id && s.performance !== null
            );
            const avg =
              scores.length > 0
                ? scores.reduce((sum, s) => sum + (s.performance ?? 0), 0) / scores.length
                : null;
            return (
              <Link key={t.id} href={`/trainings/${t.id}`} className="block">
                <Card className="group flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-ice-50 text-ice-700 dark:bg-ice-950 dark:text-ice-300">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatDate(t.date)}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      {t.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {t.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {present} présent{present > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {avg !== null && (
                    <Badge tone="ice" className="shrink-0">
                      Moy. {formatNote(avg)} / 10
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function TrainingsPage() {
  return <DataGate>{(data) => <TrainingsContent data={data} />}</DataGate>;
}
