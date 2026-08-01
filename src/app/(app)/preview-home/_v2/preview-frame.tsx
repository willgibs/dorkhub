'use client';

import { type ReactNode, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type Headline = 'discover' | 'count';

/**
 * U2 R2.5 harness chrome: the mono banner naming the surface as a preview,
 * plus the ONE remaining contested fork — the reframed headline (discover /
 * live-count). R2 resolved hero (both variants compose) and rhythm
 * (spans-only; quick hits re-homed). Children are server-rendered once with
 * both H1 trees present; the toggle flips a data attribute and
 * src/styles/u2-preview.css hides the un-picked tree.
 */
export function PreviewFrame({
  children,
  showHeadlineToggle = true,
}: {
  children: ReactNode;
  showHeadlineToggle?: boolean;
}) {
  const [headline, setHeadline] = useState<Headline>('discover');

  return (
    <div data-u2-headline={headline}>
      <PageShell className="pt-2 pb-6">
        <div className="edge-highlight flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-lg border bg-card px-4 py-3">
          <span className="rounded-md border border-primary bg-primary-soft px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-primary">
            {copy.previewBadge}
          </span>
          <p className="font-mono text-xs text-muted-foreground">{copy.previewNote}</p>
          {showHeadlineToggle ? (
            <div className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                <span aria-hidden="true">{'// '}</span>
                headline
              </span>
              <div role="tablist" aria-label="headline" className="flex gap-1.5">
                {(['discover', 'count'] as const).map((option) => {
                  const active = option === headline;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setHeadline(option)}
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
          ) : null}
        </div>
      </PageShell>
      {children}
    </div>
  );
}
