'use client';

import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type StatButtonProps = {
  kind: 'like' | 'save';
  active: boolean;
  /** null = zero-social-proof: the count is omitted entirely, never rendered as "0". */
  count: number | null;
  onToggle?: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Like/save pill (exploration `.stat-btn`). Like verb is copy.like ("++");
 * liked state uses primary-soft/primary (cyan), saved state uses positive (green).
 */
export function StatButton({
  kind,
  active,
  count,
  onToggle,
  disabled,
  className,
}: StatButtonProps) {
  const label = kind === 'like' ? copy.like : active ? copy.saved : copy.save;

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border bg-transparent px-[11px] py-[5px]',
        'font-mono text-[12.5px] leading-[1.4] text-muted-foreground tabular-nums',
        'transition-colors hover:bg-accent hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
        active &&
          kind === 'like' &&
          'border-primary bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary',
        active &&
          kind === 'save' &&
          'border-positive bg-positive-soft text-positive hover:bg-positive-soft hover:text-positive',
        className,
      )}
    >
      {label}
      {count !== null && <span>{count}</span>}
    </button>
  );
}
