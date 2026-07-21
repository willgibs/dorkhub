'use client';

import type * as React from 'react';
import { useState } from 'react';
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

/** Degrees around the button center each burst particle flies out toward. */
const BURST_ANGLES = [-70, -25, 10, 45, 80];

/**
 * Like/save pill (exploration `.stat-btn`). Like verb is copy.like ("++");
 * liked state uses primary-soft/primary (cyan), saved state uses positive (green).
 *
 * Motion (docs/motion.md): a one-shot scale pop plays only when the "++"
 * (like) action activates the button, paired with a restrained 5-particle
 * primary-tinted micro-burst — never on save, never on un-liking. Both are
 * CSS keyframes, so the global reduced-motion kill switch skips them entirely
 * rather than just shortening them.
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
  const [popping, setPopping] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  function handleClick() {
    if (kind === 'like' && !active) {
      setPopping(true);
      setBurstKey((k) => k + 1);
    }
    onToggle?.();
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={handleClick}
      onAnimationEnd={(event) => {
        if (event.animationName === 'stat-pop') setPopping(false);
      }}
      data-pop={popping ? '' : undefined}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-lg border bg-transparent px-[11px] py-[5px]',
        'font-mono text-[12.5px] leading-[1.4] text-muted-foreground tabular-nums',
        'transition-colors hover:bg-accent hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
        'data-[pop]:animate-stat-pop',
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
      {kind === 'like' && burstKey > 0 && (
        <span
          key={burstKey}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-visible"
        >
          {BURST_ANGLES.map((angle, i) => (
            <span
              key={angle}
              className="absolute top-1/2 left-1/2 size-1 animate-stat-burst rounded-full bg-primary"
              style={
                {
                  '--burst-angle': `${angle}deg`,
                  animationDelay: `${i * 12}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}
    </button>
  );
}
