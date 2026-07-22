'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export type Tenet = {
  title: string;
  body: string;
};

export type TenetTake = {
  id: 'a' | 'b';
  /** Rendered verbatim on the switcher button, e.g. "take a — quieter". */
  label: string;
  tenets: readonly Tenet[];
  /** Oversized closer line rendered after the last tenet. */
  closer: string;
};

export type TakeSwitcherProps = {
  takeA: TenetTake;
  takeB: TenetTake;
  className?: string;
};

/**
 * DRAFT zone (see the mono note below the switcher). Purely a stateful swap —
 * both tenet sets are server-passed props defined in page.tsx; this component
 * only tracks which one is on screen. Deleting a take later means deleting the
 * losing array in page.tsx and this component collapses back to static markup.
 */
export function TakeSwitcher({ takeA, takeB, className }: TakeSwitcherProps) {
  const [activeId, setActiveId] = useState<TenetTake['id']>(takeA.id);
  const active = activeId === takeA.id ? takeA : takeB;

  return (
    <section
      aria-label="manifesto tenets (draft)"
      className={cn(
        'relative rounded-xl border border-dashed border-muted-foreground/30 px-5 py-10 sm:px-8 sm:py-14',
        className,
      )}
    >
      <RegistrationMarks />

      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit gap-2">
          {[takeA, takeB].map((take) => (
            <button
              key={take.id}
              type="button"
              aria-pressed={activeId === take.id}
              onClick={() => setActiveId(take.id)}
              className={cn(
                'inline-flex items-center rounded-md border px-[11px] py-1 font-mono text-xs leading-[1.4] transition-colors',
                'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'active:translate-y-px',
                activeId === take.id
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'bg-surface-2 text-muted-foreground hover:text-foreground',
              )}
            >
              {take.label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          two drafts — will picks one; the other gets deleted.
        </p>
      </div>

      <ol
        key={active.id}
        className="mt-4 flex list-none flex-col animate-in fade-in-0 duration-200 ease-quiet"
      >
        {active.tenets.map((tenet, i) => (
          <TenetRow key={tenet.title} index={i + 1} tenet={tenet} />
        ))}
      </ol>

      <p className="border-t border-border/60 px-2 pt-16 pb-4 text-center font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl">
        {active.closer}
      </p>
    </section>
  );
}

function TenetRow({ index, tenet }: { index: number; tenet: Tenet }) {
  const ordinal = String(index).padStart(2, '0');

  return (
    <li className="relative border-t border-border/60 py-16 first:border-t-0 first:pt-4">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-14 right-0 select-none font-mono text-xs text-muted-foreground/35"
      >
        +
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 select-none font-mono text-[5rem] leading-none font-bold text-primary/15 tabular-nums sm:text-[7rem] md:text-[8.5rem]"
      >
        {ordinal}
      </span>
      <div className="relative max-w-2xl pl-16 sm:pl-24 md:pl-32">
        <h3 className="font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          {tenet.title}
        </h3>
        <p className="mt-4 text-lg text-muted-foreground">{tenet.body}</p>
      </div>
    </li>
  );
}

/** Print-proof "+" registration marks at each corner of the draft container. */
function RegistrationMarks() {
  const corners = ['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'right-2 bottom-2'] as const;

  return (
    <>
      {corners.map((position) => (
        <span
          key={position}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute select-none font-mono text-xs text-muted-foreground/35',
            position,
          )}
        >
          +
        </span>
      ))}
    </>
  );
}
