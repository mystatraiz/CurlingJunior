import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import type { Player } from '@/lib/types';

const sizes = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
} as const;

export function Avatar({
  player,
  size = 'md',
  className,
}: {
  player: Player;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (player.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={player.photo_url}
        alt={`${player.first_name} ${player.last_name}`}
        className={cn(
          'shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-night-700',
          sizes[size],
          className
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        'bg-gradient-to-br from-ice-400 to-ice-700 text-white',
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials(player)}
    </span>
  );
}
