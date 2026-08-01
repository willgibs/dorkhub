'use client';

import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * U1 round closer — R3 adopted electric-abyss (with the current type) into
 * globals.css on 2026-07-31 (D56), so the unskinned control IS the product.
 * One legacy skin remains for before/after; delete this page plus
 * src/styles/directions.css when the board is done comparing.
 */
type Skin = null | 'legacy';

type Direction = { skin: Skin; label: string; hint: string };

const DIRECTIONS: Direction[] = [
  { skin: null, label: 'abyss', hint: 'the adopted look — what dorkhub ships today' },
  { skin: 'legacy', label: 'legacy', hint: 'quiet dev-native as it launched (pre-U1)' },
];

export function DirectionSwitcher({ children }: { children: ReactNode }) {
  const [skin, setSkin] = useState<Skin>(null);
  const active = DIRECTIONS.find((d) => d.skin === skin) ?? DIRECTIONS[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <div role="tablist" aria-label="Look" className="flex flex-wrap gap-2">
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
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          <span aria-hidden="true">{'// '}</span>
          {active.hint}
        </p>
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
