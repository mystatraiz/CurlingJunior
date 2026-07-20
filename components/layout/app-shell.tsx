'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ChevronRight,
  LogOut,
  Moon,
  MoreHorizontal,
  Snowflake,
  Sun,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav-items';
import { PeriodSwitch } from './period-switch';
import { PageLoader } from '@/components/ui/spinner';

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ice-400 to-ice-700 text-white shadow-sm">
        <Snowflake className="h-5 w-5" />
      </span>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Collectif Junior France
          </p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-ice-600 dark:text-ice-400">
            Curling
          </p>
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { profile, isAdmin, signOut } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl lg:flex dark:border-night-700/60 dark:bg-night-900/80">
      <div className="px-5 py-6">
        <BrandMark />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-ice-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-night-800'
              )}
            >
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] transition-transform duration-150 group-hover:scale-110',
                  active ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                )}
              />
              {item.label}
              {active && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-4 dark:border-night-800">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
              {profile
                ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() ||
                  profile.email
                : '…'}
            </p>
            <p className="text-[11px] text-slate-400">
              {isAdmin ? 'Administrateur' : 'Entraîneur'}
            </p>
          </div>
          <button
            onClick={() => void signOut()}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 dark:hover:bg-night-800"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileTabBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const tabs = NAV_ITEMS.filter((i) => i.mobile);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden dark:border-night-700/60 dark:bg-night-900/85">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                active
                  ? 'text-ice-600 dark:text-ice-400'
                  : 'text-slate-400 dark:text-slate-500'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(' ')[0]}
            </Link>
          );
        })}
        <button
          onClick={onMore}
          className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-slate-400 transition-colors dark:text-slate-500"
        >
          <MoreHorizontal className="h-5 w-5" />
          Plus
        </button>
      </div>
    </nav>
  );
}

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const extras = NAV_ITEMS.filter((i) => !i.mobile);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 animate-fade-in bg-night-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div className="absolute inset-x-0 bottom-0 animate-fade-up rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-night-800">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Plus</p>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-night-700"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {extras.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-4 text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'border-ice-300 bg-ice-50 text-ice-700 dark:border-ice-800 dark:bg-ice-950 dark:text-ice-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-night-700 dark:text-slate-300 dark:hover:bg-night-700'
              )}
            >
              <item.icon className="h-5 w-5 text-ice-600 dark:text-ice-400" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Header() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/75 backdrop-blur-xl dark:border-night-700/60 dark:bg-night-900/75">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="lg:hidden">
          <BrandMark compact />
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-2">
          <PeriodSwitch />
          <button
            onClick={toggle}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-night-800 dark:hover:text-slate-200"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Coquille applicative : redirige vers /login si non connecté, sinon affiche
 * sidebar (desktop) + barre d'onglets (mobile) + en-tête avec sélecteur de
 * période.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { configured, loading, session } = useAuth();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (configured && !loading && !session) router.replace('/login');
  }, [configured, loading, session, router]);

  if (!configured) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-semibold">Configuration requise</p>
          <p className="mt-2">
            Renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code> et{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans <code>.env.local</code>{' '}
            (voir <code>.env.example</code> et le README), puis relancez
            l&apos;application.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <PageLoader label="Connexion…" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>
      <MobileTabBar onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
