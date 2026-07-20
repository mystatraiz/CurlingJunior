'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronRight, Plus, Search, Users } from 'lucide-react';
import { DataGate } from '@/components/shared/data-gate';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PlayerForm } from '@/components/players/player-form';
import { usePeriod } from '@/components/providers/period-provider';
import { allPlayerStats } from '@/lib/stats';
import { formatNote, formatPercent, fullName } from '@/lib/format';
import type { Dataset } from '@/lib/types';

function PlayersContent({ data }: { data: Dataset }) {
  const { period } = usePeriod();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sex, setSex] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const stats = useMemo(() => allPlayerStats(data, period), [data, period]);

  const filtered = stats.filter((s) => {
    const name = fullName(s.player).toLowerCase();
    if (query && !name.includes(query.toLowerCase())) return false;
    if (category && s.player.category !== category) return false;
    if (sex && s.player.sex !== sex) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Joueurs"
        subtitle={`${stats.length} joueur${stats.length > 1 ? 's' : ''} dans le collectif`}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau joueur
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher un joueur…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-40"
        >
          <option value="">Toutes catégories</option>
          {data.settings.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={sex} onChange={(e) => setSex(e.target.value)} className="w-32">
          <option value="">Tous</option>
          <option value="M">Hommes</option>
          <option value="F">Femmes</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun joueur"
          description="Ajoutez les joueurs du collectif pour commencer le suivi."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Ajouter un joueur
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Link key={s.player.id} href={`/players/${s.player.id}`}>
              <Card className="group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <Avatar player={s.player} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {fullName(s.player)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {s.player.category && <Badge tone="ice">{s.player.category}</Badge>}
                      <Badge tone="slate">
                        {s.player.sex === 'F' ? 'Féminin' : 'Masculin'}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center dark:border-night-700">
                  <div>
                    <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatNote(s.avgPerformance)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Perf. /10</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {s.trainingsTotal > 0 ? formatPercent(s.attendanceRate) : '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Présence</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {s.matchPoints}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Pts matchs</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouveau joueur">
        <PlayerForm onDone={() => setCreateOpen(false)} />
      </Modal>
    </>
  );
}

export default function PlayersPage() {
  return <DataGate>{(data) => <PlayersContent data={data} />}</DataGate>;
}
