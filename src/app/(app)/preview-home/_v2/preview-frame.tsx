import type { ReactNode } from 'react';
import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';

/**
 * U2 harness chrome, R3: every fork is resolved (hero composed, rhythm
 * spans-only, headline board-picked), so the frame is just the mono banner
 * naming the surface as a preview. Server component — no state left.
 */
export function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div>
      <PageShell className="pt-2 pb-6">
        <div className="edge-highlight flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-lg border bg-card px-4 py-3">
          <span className="rounded-md border border-primary bg-primary-soft px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-primary">
            {copy.previewBadge}
          </span>
          <p className="font-mono text-xs text-muted-foreground">{copy.previewNote}</p>
        </div>
      </PageShell>
      {children}
    </div>
  );
}
