'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import {
  type ImportPageResult,
  type ImportTallies,
  importStarsPage,
  type MaterializeImportsResult,
  materializeImportsPage,
} from './actions';

/**
 * Hard safety cap on pages walked in one run (docs/plans/p1-gallery-engine.md,
 * Wave 2A) — GitHub star lists can't realistically exceed 10,000 stars
 * (100/page × 100), and this stops a runaway loop if `hasMore` ever lies.
 */
const MAX_PAGES = 100;

/**
 * Phase 2 is a FIRST SLICE, not a full drain (P2.5.1, after first-user QA:
 * "that felt like it took forever"): 6 × 5 = the user's top 30 stars go
 * live while they watch (~15s on the fast path), then the done state hands
 * the tail to the background pipeline ("more going live automatically").
 * The pipeline materializes 25 per 15-min tick, so even a huge import is
 * fully live within a few hours — without holding the user hostage.
 */
const MAX_MATERIALIZE_CHUNKS = 6;

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
  | { status: 'materializing'; scanned: number; tallies: ImportTallies; materialized: number }
  | {
      status: 'done';
      scanned: number;
      tallies: ImportTallies;
      materialized: number;
      /** Quiet aside from a stopped phase-2 chunk (e.g. github rate-limiting) — display-only, never an error state. */
      note: string | null;
    };

export function ImportRunner() {
  const [state, setState] = useState<RunState>({ status: 'idle' });

  /**
   * Phase 2 — "putting them on the wall" (docs/plans/p2.5-self-running.md
   * Wave 2C). Walks `materializeImportsPage` chunks sequentially, same
   * shape as `run` below, until it runs dry, stops itself, or hits the
   * safety cap — then always lands on `done` (a stopped chunk is a quiet
   * note there, never its own error state; the pipeline finishes the job
   * either way).
   */
  async function materialize(scanned: number, tallies: ImportTallies, materializedSoFar: number) {
    let materialized = materializedSoFar;

    setState({ status: 'materializing', scanned, tallies, materialized });

    for (let i = 0; i < MAX_MATERIALIZE_CHUNKS; i++) {
      let result: MaterializeImportsResult;
      try {
        result = await materializeImportsPage();
      } catch (err) {
        console.error('[import-runner] materialize chunk threw:', err);
        setState({ status: 'done', scanned, tallies, materialized, note: null });
        return;
      }

      materialized += result.materialized;

      if (result.stopReason) {
        setState({ status: 'done', scanned, tallies, materialized, note: result.stopReason });
        return;
      }

      if (!result.hasMore) {
        setState({ status: 'done', scanned, tallies, materialized, note: null });
        return;
      }

      setState({ status: 'materializing', scanned, tallies, materialized });
    }

    // Safety cap reached — the pipeline drains the rest of the tail.
    setState({ status: 'done', scanned, tallies, materialized, note: null });
  }

  /** Scan finished (either a real end-of-list or the page safety cap) — hand off to phase 2 when there's anything queued to materialize. */
  function finishScan(scanned: number, tallies: ImportTallies) {
    if (scanned === 0) {
      setState({ status: 'empty' });
      return;
    }
    if (tallies.queued > 0) {
      materialize(scanned, tallies, 0);
      return;
    }
    setState({ status: 'done', scanned, tallies, materialized: 0, note: null });
  }

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
        finishScan(scanned, tallies);
        return;
      }

      page += 1;
      setState({ status: 'running', nextPage: page, scanned, tallies });
    }

    // Safety cap reached, not a real end-of-list — show what we have rather
    // than loop forever.
    finishScan(scanned, tallies);
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

  if (state.status === 'materializing') {
    return (
      <p aria-live="polite" className="font-mono text-sm text-muted-foreground">
        {copy.importMaterializing}{' '}
        <span className="tabular-nums">
          {state.materialized} of {state.tallies.queued}
        </span>
      </p>
    );
  }

  // done
  return (
    <div aria-live="polite" className="flex flex-col gap-2 font-mono text-[13.5px]">
      <p>
        <span className="tabular-nums">{state.tallies.here}</span> {copy.importDoneHere}
      </p>
      <p>
        <span className="tabular-nums">{state.materialized}</span> {copy.importDoneLive}
      </p>
      {state.materialized < state.tallies.queued ? (
        <p>
          <span className="tabular-nums">{state.tallies.queued - state.materialized}</span>{' '}
          {copy.importDonePolishing}
        </p>
      ) : null}
      {state.note ? <p className="text-muted-foreground">{state.note}</p> : null}
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
      <Link
        href="/"
        className="w-fit rounded-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {copy.browseCta}
      </Link>
    </div>
  );
}
