'use client';

import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Skin switcher for the U1 refresh round. The children are server-rendered
 * ONCE — switching directions only changes the wrapper's data-skin, and
 * src/styles/directions.css re-resolves every token underneath it. The
 * preview area paints its own bg/fg (the utilities read the overridden
 * vars), so each direction shows as a framed window into that world while
 * the /design chrome around it stays on the incumbent system.
 */
const DIRECTIONS = [
  { skin: null, label: 'current', hint: 'quiet dev-native (control)' },
  { skin: 'warm-terminal', label: 'warm terminal', hint: 'graphite + phosphor' },
  { skin: 'paper-zine', label: 'paper zine', hint: 'cream + ink + coral' },
  { skin: 'electric-depth', label: 'electric depth', hint: 'blue-black + dual glow' },
] as const;

type Skin = (typeof DIRECTIONS)[number]['skin'];

export function DirectionSwitcher({ children }: { children: ReactNode }) {
  const [skin, setSkin] = useState<Skin>(null);
  const active = DIRECTIONS.find((d) => d.skin === skin) ?? DIRECTIONS[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="direction">
        {DIRECTIONS.map((d) => {
          const isActive = d.skin === skin;
          return (
            <button
              key={d.label}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSkin(d.skin)}
              className={cn(
                'rounded-md border px-3 py-1.5 font-mono text-xs transition-colors',
                'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isActive
                  ? 'border-primary bg-primary-soft text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {d.label}
            </button>
          );
        })}
        <span className="font-mono text-xs text-muted-foreground">
          <span aria-hidden="true">{'// '}</span>
          {active.hint}
        </span>
      </div>

      <div
        data-skin={skin ?? undefined}
        className="overflow-hidden rounded-xl border bg-background text-foreground"
      >
        <div className="bg-bloom flex flex-col gap-12 px-5 py-10 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
