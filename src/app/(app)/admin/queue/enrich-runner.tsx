'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { type EnrichPageResult, enrichCandidatesPage } from './actions';

/**
 * Client-driven enrichment loop (P2.1 rework after first-admin QA: the old
 * fire-and-forget form gave "zero preview feedback before clicking, then a
 * very abbreviated result") — same chunked pattern as
 * src/app/(app)/settings/import/import-runner.tsx. Admin literals are exempt
 * from copy.ts (documented in page.tsx).
 *
 * Feedback contract: BEFORE — the idle state says what a run will do and to
 * how many rows; DURING — a live, layout-stable progress line (tabular-nums,
 * aria-live) advances per chunk; AFTER — a summary plus the queue rows
 * themselves re-render (router.refresh) with their new ai badges. Failures
 * surface the provider's actual reason and offer resume — a systemic error
 * consumes nothing server-side, so resume is always safe.
 *
 * No animation on any of this: state changes are text swaps an admin sees
 * dozens of times a day, and the motion policy (docs/motion.md) reserves
 * animation for surfaces where it adds information.
 */

/** Safety cap on chunks per run — 40 × 5 = 200 rows, far above any real queue. */
const MAX_CHUNKS = 40;

type RunState =
  | { status: 'idle' }
  | { status: 'running'; enriched: number; empty: number }
  | { status: 'stopped'; enriched: number; empty: number; reason: string }
  | { status: 'done'; enriched: number; empty: number };

export function EnrichRunner({ enrichableCount }: { enrichableCount: number }) {
  const router = useRouter();
  const [state, setState] = useState<RunState>({ status: 'idle' });

  async function run(enrichedSoFar: number, emptySoFar: number) {
    let enriched = enrichedSoFar;
    let empty = emptySoFar;

    setState({ status: 'running', enriched, empty });

    for (let chunk = 0; chunk < MAX_CHUNKS; chunk++) {
      let result: EnrichPageResult;
      try {
        result = await enrichCandidatesPage();
      } catch (err) {
        console.error('[enrich-runner] chunk call threw:', err);
        setState({
          status: 'stopped',
          enriched,
          empty,
          reason: 'something broke on our end — resume to retry',
        });
        return;
      }

      enriched += result.enriched;
      empty += result.empty;

      if (result.stopReason) {
        setState({ status: 'stopped', enriched, empty, reason: result.stopReason });
        router.refresh();
        return;
      }

      if (!result.hasMore) {
        setState({ status: 'done', enriched, empty });
        router.refresh();
        return;
      }

      setState({ status: 'running', enriched, empty });
    }

    // Safety cap reached — show what we have rather than loop forever.
    setState({ status: 'done', enriched, empty });
    router.refresh();
  }

  if (state.status === 'idle') {
    if (enrichableCount === 0) return null;
    return (
      <div className="flex flex-col items-end gap-1">
        <Button size="sm" variant="secondary" onClick={() => run(0, 0)}>
          enrich {enrichableCount}
        </Button>
        <p className="font-mono text-[11.5px] text-muted-foreground">
          ai taglines + tags for rows missing them — you review before approving
        </p>
      </div>
    );
  }

  if (state.status === 'running') {
    return (
      <p aria-live="polite" className="font-mono text-[12.5px] text-muted-foreground tabular-nums">
        enriching… {state.enriched + state.empty} of {enrichableCount}
        {state.enriched > 0 ? ` · ${state.enriched} enriched` : ''}
        {state.empty > 0 ? ` · ${state.empty} came up empty` : ''}
      </p>
    );
  }

  if (state.status === 'stopped') {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <p
          aria-live="polite"
          className="max-w-[420px] text-right font-mono text-[12px] text-destructive"
        >
          stopped after {state.enriched + state.empty} — {state.reason}
        </p>
        <Button size="sm" variant="secondary" onClick={() => run(state.enriched, state.empty)}>
          resume
        </Button>
      </div>
    );
  }

  // done
  return (
    <p aria-live="polite" className="font-mono text-[12.5px] text-muted-foreground tabular-nums">
      enriched {state.enriched}
      {state.empty > 0 ? ` · ${state.empty} came up empty` : ''} — review the rows below
    </p>
  );
}
