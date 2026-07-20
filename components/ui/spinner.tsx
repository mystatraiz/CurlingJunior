import { cn } from '@/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-ice-200 border-t-ice-600',
        className
      )}
      role="status"
      aria-label="Chargement"
    />
  );
}

export function PageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-slate-400">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
