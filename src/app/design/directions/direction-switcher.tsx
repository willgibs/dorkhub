'use client';

import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Skin switcher for the U1 refresh round — R2.5: two finalist FAMILIES
 * (board verdict 2026-07-31; warm-terminal and paper-zine were hard-no'd
 * and deleted). The children are server-rendered ONCE — switching only
 * changes the wrapper's data-skin, and src/styles/directions.css
 * re-resolves every token underneath it.
 */
type Skin =
  | null
  | 'current-deeper'
  | 'current-sharper'
  | 'electric'
  | 'electric-abyss'
  | 'electric-violet';

type Direction = { skin: Skin; label: string; hint: string };

const FAMILIES: Array<{ label: string; directions: Direction[] }> = [
  {
    label: 'current family',
    directions: [
      { skin: null, label: 'current', hint: 'quiet dev-native, unchanged (control)' },
      { skin: 'current-deeper', label: 'deeper', hint: 'lights lower, glow richer' },
      { skin: 'current-sharper', label: 'sharper', hint: 'machined edges, tighter radius' },
    ],
  },
  {
    label: 'electric family',
    directions: [
      { skin: 'electric', label: 'electric', hint: 'blue-black + dual glow (R1 reference)' },
      { skin: 'electric-abyss', label: 'abyss', hint: 'further down, brighter cyan' },
      { skin: 'electric-violet', label: 'violet', hint: 'violet leads, cyan steps back' },
    ],
  },
];

const ALL = FAMILIES.flatMap((family) => family.directions);

export function DirectionSwitcher({ children }: { children: ReactNode }) {
  const [skin, setSkin] = useState<Skin>(null);
  const active = ALL.find((d) => d.skin === skin) ?? ALL[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        {FAMILIES.map((family) => (
          <div key={family.label} className="flex flex-wrap items-center gap-2">
            <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">
              <span aria-hidden="true">{'// '}</span>
              {family.label}
            </span>
            <div role="tablist" aria-label={family.label} className="flex flex-wrap gap-2">
              {family.directions.map((d) => {
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
          </div>
        ))}
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
