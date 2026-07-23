import type { Metadata } from 'next';

import { EmptyState } from '@/components/empty-state';
import { RepoStatsRow } from '@/components/repo-stats-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/auth/admin';
import { copy } from '@/lib/copy';
import { languageColor } from '@/lib/lang-colors';
import { supabaseService } from '@/lib/supabase/clients';
import type { Tables } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

import { approveCandidate, rejectCandidate, reopenCandidate } from './actions';

export const metadata: Metadata = { title: copy.adminQueueTitle };

type Candidate = Tables<'ingest_candidates'>;

const PENDING_LIMIT = 100;
const REJECTED_BY_DEMAND_LIMIT = 20;

/**
 * Admin-only literal strings on this page (row labels, the empty-queue line,
 * source labels) are exempt from the "voice comes from copy.ts" rule
 * (docs/conventions.md / CLAUDE.md) — that rule is about public-facing
 * copy; docs/plans/p1-gallery-engine.md Wave 2B explicitly calls this out for
 * the empty-state string and it applies equally to the rest of this
 * queue-only chrome.
 */
const SOURCE_LABELS: Record<string, string> = {
  star_import: 'star import',
  topic_crawl: 'topic crawl',
  awesome_list: 'awesome list',
  admin_manual: 'manual',
};

const linkFocusRing =
  'rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function CandidateMeta({ candidate }: { candidate: Candidate }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <RepoStatsRow
        language={candidate.primary_language ?? ''}
        languageColor={languageColor(candidate.primary_language)}
        stars={candidate.stars_count > 0 ? candidate.stars_count : null}
      />
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
      >
        {SOURCE_LABELS[candidate.source] ?? candidate.source}
      </Badge>
      {candidate.demand_count > 0 ? (
        <span className="font-mono text-[12.5px] text-muted-foreground tabular-nums">
          wanted by {candidate.demand_count}
        </span>
      ) : null}
    </div>
  );
}

function PendingRow({ candidate }: { candidate: Candidate }) {
  return (
    <div className="edge-highlight flex flex-col gap-3 rounded-lg border bg-card px-[22px] py-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <a
            href={candidate.repo_url}
            target="_blank"
            rel="noopener"
            className={cn(
              'w-fit font-mono text-[15px] font-semibold transition-colors hover:text-foreground',
              linkFocusRing,
            )}
          >
            {candidate.name}
          </a>
          <span className="font-mono text-[12px] text-muted-foreground">
            {candidate.owner_login}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <form action={approveCandidate}>
            <input type="hidden" name="github_repo_id" value={candidate.github_repo_id} />
            <Button type="submit" size="sm">
              approve
            </Button>
          </form>
          <form action={rejectCandidate}>
            <input type="hidden" name="github_repo_id" value={candidate.github_repo_id} />
            <Button type="submit" variant="ghost" size="sm">
              reject
            </Button>
          </form>
        </div>
      </div>

      {candidate.description ? (
        <p className="line-clamp-2 text-[13.5px] text-muted-foreground">{candidate.description}</p>
      ) : null}

      <CandidateMeta candidate={candidate} />
    </div>
  );
}

function RejectedByDemandRow({ candidate }: { candidate: Candidate }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-border/60 border-b py-3 last:border-b-0">
      <div className="flex flex-col gap-0.5">
        <a
          href={candidate.repo_url}
          target="_blank"
          rel="noopener"
          className={cn(
            'w-fit font-mono text-[13.5px] font-medium transition-colors hover:text-foreground',
            linkFocusRing,
          )}
        >
          {candidate.name}
        </a>
        <span className="font-mono text-[11.5px] text-muted-foreground">
          {candidate.owner_login} · wanted by {candidate.demand_count}
          {candidate.rejection_reason ? ` · ${candidate.rejection_reason}` : ''}
        </span>
      </div>
      <form action={reopenCandidate}>
        <input type="hidden" name="github_repo_id" value={candidate.github_repo_id} />
        <Button type="submit" variant="secondary" size="sm">
          reopen
        </Button>
      </form>
    </div>
  );
}

const SOURCE_KEYS = ['star_import', 'topic_crawl', 'awesome_list', 'admin_manual'] as const;
type SourceKey = (typeof SOURCE_KEYS)[number];

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{
    err?: string;
    ok?: string;
    username?: string;
    saves?: string;
    source?: string;
  }>;
}) {
  // /admin/layout.tsx already gates this route — defense in depth, since
  // server actions elsewhere on this page live outside that render tree.
  await requireAdmin();
  const params = await searchParams;
  const service = supabaseService();

  // Source filter (first-user QA, 2026-07-23): demand-sorted ranking buried
  // crawl results below the star-import mass — every star-import candidate
  // has demand ≥ 1 and outranks every demand-0 crawl row, so with 100+
  // star-import candidates the crawls were unreachable. Per-source filtering
  // makes every source's slice of the queue directly viewable.
  const activeSource: SourceKey | null = SOURCE_KEYS.includes(params.source as SourceKey)
    ? (params.source as SourceKey)
    : null;

  let pendingQuery = service
    .from('ingest_candidates')
    .select('*')
    .eq('status', 'pending')
    .order('demand_count', { ascending: false })
    .order('stars_count', { ascending: false })
    .limit(PENDING_LIMIT);
  if (activeSource) pendingQuery = pendingQuery.eq('source', activeSource);

  const [{ data: pending }, { data: rejectedByDemand }, { data: pendingSources }] =
    await Promise.all([
      pendingQuery,
      service
        .from('ingest_candidates')
        .select('*')
        .eq('status', 'rejected')
        .gt('demand_count', 0)
        .order('demand_count', { ascending: false })
        .limit(REJECTED_BY_DEMAND_LIMIT),
      service.from('ingest_candidates').select('source').eq('status', 'pending'),
    ]);

  const pendingRows = pending ?? [];
  const rejectedRows = rejectedByDemand ?? [];
  const sourceCounts = new Map<string, number>();
  for (const row of pendingSources ?? []) {
    sourceCounts.set(row.source, (sourceCounts.get(row.source) ?? 0) + 1);
  }
  const totalPending = (pendingSources ?? []).length;
  const savesCount = Number(params.saves ?? '0');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] font-extrabold">{copy.adminQueueTitle}</h1>

      {params.err ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 font-mono text-[13px] text-destructive">
          {params.err}
        </div>
      ) : null}
      {params.ok ? (
        <div className="rounded-lg border border-positive/40 bg-positive-soft px-4 py-3 font-mono text-[13px] text-positive">
          approved — {params.ok}
          {params.username ? ` · @${params.username}` : ''}
          {savesCount > 0 ? ` · ${savesCount} retroactive save${savesCount === 1 ? '' : 's'}` : ''}
        </div>
      ) : null}

      <nav aria-label="source filter" className="flex flex-wrap items-center gap-2">
        <a
          href="/admin/queue"
          className={cn(
            'rounded-lg border px-3 py-1 font-mono text-[12.5px] tabular-nums',
            linkFocusRing,
            activeSource === null
              ? 'border-primary/50 bg-primary-soft text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          all {totalPending}
        </a>
        {SOURCE_KEYS.map((key) => (
          <a
            key={key}
            href={`/admin/queue?source=${key}`}
            className={cn(
              'rounded-lg border px-3 py-1 font-mono text-[12.5px] tabular-nums',
              linkFocusRing,
              activeSource === key
                ? 'border-primary/50 bg-primary-soft text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {SOURCE_LABELS[key]} {sourceCounts.get(key) ?? 0}
          </a>
        ))}
      </nav>

      {pendingRows.length === 0 ? (
        <EmptyState message="queue’s clear — go crawl something" />
      ) : (
        <div className="flex flex-col gap-4">
          {pendingRows.map((candidate) => (
            <PendingRow key={candidate.github_repo_id} candidate={candidate} />
          ))}
        </div>
      )}

      <details className="rounded-lg border border-dashed px-[22px] py-[14px]">
        <summary
          className={cn(
            'cursor-pointer select-none font-mono text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground',
            linkFocusRing,
          )}
        >
          <span aria-hidden="true">{'// '}</span>rejected, by demand
        </summary>
        <div className="mt-4 flex flex-col gap-1">
          {rejectedRows.length === 0 ? (
            <p className="py-1.5 font-mono text-[13px] text-muted-foreground">none</p>
          ) : (
            rejectedRows.map((candidate) => (
              <RejectedByDemandRow key={candidate.github_repo_id} candidate={candidate} />
            ))
          )}
        </div>
      </details>
    </div>
  );
}
