/** Helpers de formatage (dates fr-FR, notes, pourcentages, identité). */

import type { Player } from './types';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatNote(v: number | null, digits = 1): string {
  if (v === null || Number.isNaN(v)) return '—';
  return v.toFixed(digits).replace('.', ',');
}

export function formatPercent(rate: number | null): string {
  if (rate === null || Number.isNaN(rate)) return '—';
  return `${Math.round(rate * 100)} %`;
}

export function formatDelta(v: number | null): string {
  if (v === null || Number.isNaN(v)) return '—';
  const s = v.toFixed(1).replace('.', ',');
  return v > 0 ? `+${s}` : s;
}

export function fullName(p: Player): string {
  return `${p.first_name} ${p.last_name}`;
}

export function initials(p: Player): string {
  return `${p.first_name.charAt(0)}${p.last_name.charAt(0)}`.toUpperCase();
}

export function ageOf(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

/** yyyy-mm-dd du jour, pour les valeurs par défaut des formulaires. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
