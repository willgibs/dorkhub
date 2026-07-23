'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { type ImportPageResult, type ImportTallies, importStarsPage } from './actions';

/**
 * Hard safety cap on pages walked in one run (docs/plans/p1-gallery-engine.md,
 * Wave 2A) — GitHub star lists can't realistically exceed 10,000 stars
 * (100/page × 100), and this stops a runaway loop if `hasMore` ever lies.
 */
const MAX_PAGES = 100;

const ZERO_TALLIES: ImportTallies = { own: 0, blocked: 0, here: 0, filtered: 0, queued: 0 };

function addTallies(a: ImportTallies, b: ImportTallies): ImportTallies {
  return {
    own: a.own + b.own,
    blocked: a.blocked + b.blocked,
    here: a.here + b.here,
    filtered: a.filtered + b.filtered,
    queued: a.queued + b.queued,
  };
}

type RunState =
  | { status: 'idle' }
  | { status: 'running'; nextPage: number; scanned: number; tallies: ImportTallies }
  | { status: 'error'; failedPage: number; scanned: number; tallies: ImportTallies }
  | { status: 'empty' }
  | { status: 'done'; scanned: number; tallies: ImportTallies };

export function ImportRunner() {
  const [state, setState] = useState<RunState>({ status: 'idle' });

  /** Walks pages sequentially starting at `startPage`, awaiting each server call before requesting the next — never fires two pages concurrently. */
  async function run(startPage: number, scannedSoFar: number, talliesSoFar: ImportTallies) {
    let page = startPage;
    let scanned = scannedSoFar;
    let tallies = talliesSoFar;

    setState({ status: 'running', nextPage: page, scanned, tallies });

    while (page <= MAX_PAGES) {
      let result: ImportPageResult;
      try {
        result = await importStarsPage(page);
      } catch (err) {
        console.error('[import-runner] page call threw:', err);
        setState({ status: 'error', failedPage: page, scanned, tallies });
        return;
      }

      if ('error' in result) {
        setState({ status: 'error', failedPage: page, scanned, tallies });
        return;
      }

      scanned += result.scanned;
      tallies = addTallies(tallies, result.tallies);

      if (!result.hasMore) {
        setState(scanned === 0 ? { status: 'empty' } : { status: 'done', scanned, tallies });
        return;
      }

      page += 1;
      setState({ status: 'running', nextPage: page, scanned, tallies });
    }

    // Safety cap reached, not a real end-of-list — show what we have rather
    // than loop forever.
    setState({ status: 'done', scanned, tallies });
  }

  if (state.status === 'idle') {
    return (
      <Button size="sm" onClick={() => run(1, 0, ZERO_TALLIES)}>
        {copy.importStart}
      </Button>
    );
  }

  if (state.status === 'running') {
    return (
      <p aria-live="polite" className="font-mono text-sm text-muted-foreground">
        {copy.importRunning} <span className="tabular-nums">{state.scanned}</span>
      </p>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <p aria-live="polite" className="text-sm text-destructive">
          {copy.error}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => run(state.failedPage, state.scanned, state.tallies)}
        >
          retry
        </Button>
      </div>
    );
  }

  if (state.status === 'empty') {
    return <p className="text-muted-foreground">{copy.importEmpty}</p>;
  }

  // done
  return (
    <div aria-live="polite" className="flex flex-col gap-2 font-mono text-[13.5px]">
      <p>
        <span className="tabular-nums">{state.tallies.here}</span> {copy.importDoneHere}
      </p>
      <p>
        <span className="tabular-nums">{state.tallies.queued}</span> {copy.importDoneQueued}
      </p>
      {state.tallies.own > 0 ? (
        <p className="flex flex-wrap items-center gap-2">
          <span>
            <span className="tabular-nums">{state.tallies.own}</span> {copy.importDoneOwn}
          </span>
          <Link
            href="/new"
            className="rounded-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copy.ctaPrimary}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
