'use client';

import { type ReactNode, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type HeroVariant = 'shelf' | 'ticker';
type Rhythm = 'clusters' | 'spans';

/**
 * U2 R1 harness chrome (docs/plans/u2-rework.md): a mono banner naming the
 * surface as a preview, plus chip toggles for the two contested forks (hero
 * product-moment, feed rhythm). Children are server-rendered ONCE with both
 * variant trees present; the toggles only flip data attributes and
 * src/styles/u2-preview.css hides the un-picked tree — the U1
 * direction-switcher idiom, applied to composition instead of tokens.
 */
export function PreviewFrame({
  children,
  showHeroToggle = true,
  showRhythmToggle = true,
}: {
  children: ReactNode;
  showHeroToggle?: boolean;
  showRhythmToggle?: boolean;
}) {
  const [hero, setHero] = useState<HeroVariant>('shelf');
  const [rhythm, setRhythm] = useState<Rhythm>('clusters');

  return (
    <div data-u2-hero={hero} data-u2-rhythm={rhythm}>
      <PageShell className="pt-2 pb-6">
        <div className="edge-highlight flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-lg border bg-card px-4 py-3">
          <span className="rounded-md border border-primary bg-primary-soft px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-primary">
            {copy.previewBadge}
          </span>
          <p className="font-mono text-xs text-muted-foreground">{copy.previewNote}</p>
          <div className="ml-auto flex flex-wrap items-center gap-4">
            {showHeroToggle ? (
              <ToggleGroup
                label="hero"
                options={['shelf', 'ticker'] as const}
                value={hero}
                onChange={setHero}
              />
            ) : null}
            {showRhythmToggle ? (
              <ToggleGroup
                label="rhythm"
                options={['clusters', 'spans'] as const}
                value={rhythm}
                onChange={setRhythm}
              />
            ) : null}
          </div>
        </div>
      </PageShell>
      {children}
    </div>
  );
}

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
        <span aria-hidden="true">{'// '}</span>
        {label}
      </span>
      <div role="tablist" aria-label={label} className="flex gap-1.5">
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option)}
              className={cn(
                'rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors active:translate-y-px',
                'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                active
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
