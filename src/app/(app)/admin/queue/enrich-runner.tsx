'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { type EnrichPageResult, enrichCandidatesPage } from './actions';

/**
 * Client-driven enrichment loop (P2.1 rework after first-admin QA: the old
 * fire-and-forget form gave "zero preview feedback before clicking, then a
 * very abbreviated result") — same chunked pattern as
 * src/app/(app)/settings/import/import-runner.tsx. Admin literals are exempt
 * from copy.ts (documented in page.tsx).
 *
 * GEOMETRY (P2.5 Wave 2A, docs/plans/p2.5-self-running.md locked decision
 * #6 + Will's layout bug — the header row used to change shape as the
 * runner cycled through states, shoving the source-filter nav around):
 * every state below renders exactly ONE `h-8 inline-flex items-center gap-2`
 * row, no `flex-col`, no second line, ever. `idle`'s explainer text and
 * `stopped`'s full reason both move into a `title` attribute (+ `aria-label`
 * on idle, since a button's aria-label REPLACES its accessible name — the
 * visible "enrich N" has to be folded back in) instead of a rendered second
 * line.
 *
 * AUTO-RESUME (`waiting` state, locked decision #6's `stopKind` field):
 * a `rate_limited` stop no longer strands the admin on a manual "resume"
 * click — it counts down and retries itself, up to `RATE_LIMIT_RETRIES`
 * times, before finally giving up to the manual `stopped` state a
 * `config`/`provider_error`/thrown-error stop still goes straight to.
 *
 * Feedback contract otherwise unchanged: BEFORE — idle says what a run will
 * do; DURING — a live, layout-stable progress line (tabular-nums, aria-live)
 * advances per chunk; AFTER — a summary plus the queue rows themselves
 * re-render (router.refresh) with their new ai badges. No animation on any
 * of this — state changes are text swaps an admin sees dozens of times a
 * day, and the motion policy (docs/motion.md) reserves animation for
 * surfaces where it adds information.
 */

/** Safety cap on chunks per run — 40 × 3 = 120 rows, far above any real queue. */
const MAX_CHUNKS = 40;

/** How many consecutive rate-limited stops auto-resume before handing back to a manual "resume" click. */
const RATE_LIMIT_RETRIES = 5;

/** Countdown length per auto-resume wait (locked decision #6). */
const RATE_LIMIT_WAIT_SECONDS = 60;

/** The one fixed-height row shape every state renders — see GEOMETRY above. */
const ROW_CLASS = 'h-8 inline-flex items-center gap-2';

type RunState =
  | { status: 'idle' }
  | { status: 'running'; enriched: number; empty: number }
  | { status: 'waiting'; enriched: number; empty: number; secondsLeft: number; retriesLeft: number }
  | { status: 'stopped'; enriched: number; empty: number; reason: string }
  | { status: 'done'; enriched: number; empty: number };

export function EnrichRunner({ enrichableCount }: { enrichableCount: number }) {
  const router = useRouter();
  const [state, setState] = useState<RunState>({ status: 'idle' });
  const waitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount only (locked decision #6's explicit requirement) —
  // `startWaitCountdown` below clears/replaces the ref itself on every tick
  // and on completion, so this is just the safety net for an admin
  // navigating away mid-countdown.
  useEffect(() => {
    return () => {
      if (waitIntervalRef.current) clearInterval(waitIntervalRef.current);
    };
  }, []);

  function startWaitCountdown(enriched: number, empty: number, retriesLeft: number) {
    if (waitIntervalRef.current) clearInterval(waitIntervalRef.current);

    let secondsLeft = RATE_LIMIT_WAIT_SECONDS;
    setState({ status: 'waiting', enriched, empty, secondsLeft, retriesLeft });

    waitIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        if (waitIntervalRef.current) clearInterval(waitIntervalRef.current);
        waitIntervalRef.current = null;
        run(enriched, empty, retriesLeft);
        return;
      }
      setState({ status: 'waiting', enriched, empty, secondsLeft, retriesLeft });
    }, 1000);
  }

  async function run(enrichedSoFar: number, emptySoFar: number, retriesLeft: number) {
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

      if (result.stopKind === 'rate_limited' && retriesLeft > 0) {
        startWaitCountdown(enriched, empty, retriesLeft - 1);
        router.refresh();
        return;
      }

      if (result.stopReason) {
        // Either a non-rate_limited systemic stop (config/provider_error),
        // or a rate_limited one that already burned every auto-retry —
        // both land here, manual "resume" only.
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
    const explainer = 'ai taglines + tags for rows missing them — you review before approving';
    return (
      <div className={ROW_CLASS}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => run(0, 0, RATE_LIMIT_RETRIES)}
          title={explainer}
          aria-label={`enrich ${enrichableCount} — ${explainer}`}
        >
          enrich {enrichableCount}
        </Button>
      </div>
    );
  }

  if (state.status === 'running') {
    return (
      <div className={ROW_CLASS}>
        <p
          aria-live="polite"
          className="font-mono text-[12.5px] text-muted-foreground tabular-nums"
        >
          enriching… {state.enriched + state.empty} of {enrichableCount}
          {state.enriched > 0 ? ` · ${state.enriched} enriched` : ''}
          {state.empty > 0 ? ` · ${state.empty} came up empty` : ''}
        </p>
      </div>
    );
  }

  if (state.status === 'waiting') {
    return (
      <div className={ROW_CLASS}>
        <p
          aria-live="polite"
          className="font-mono text-[12.5px] text-muted-foreground tabular-nums"
        >
          rate limited — resuming in {state.secondsLeft}s
        </p>
      </div>
    );
  }

  if (state.status === 'stopped') {
    const fullReason = `stopped after ${state.enriched + state.empty} — ${state.reason}`;
    return (
      <div className={ROW_CLASS}>
        <p
          aria-live="polite"
          title={fullReason}
          className="max-w-[360px] truncate font-mono text-[12px] text-destructive"
        >
          {fullReason}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => run(state.enriched, state.empty, RATE_LIMIT_RETRIES)}
        >
          resume
        </Button>
      </div>
    );
  }

  // done
  return (
    <div className={ROW_CLASS}>
      <p aria-live="polite" className="font-mono text-[12.5px] text-muted-foreground tabular-nums">
        enriched {state.enriched}
        {state.empty > 0 ? ` · ${state.empty} came up empty` : ''} — review the rows below
      </p>
    </div>
  );
}
