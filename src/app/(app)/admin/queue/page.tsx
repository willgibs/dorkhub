import type { Metadata } from 'next';

import { EmptyState } from '@/components/empty-state';
import { RepoStatsRow } from '@/components/repo-stats-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { needsEnrichment } from '@/lib/ai/enrich';
import { requireAdmin } from '@/lib/auth/admin';
import { copy } from '@/lib/copy';
import { autoApproveMinStars, needsReview } from '@/lib/ingest/policy';
import { languageColor } from '@/lib/lang-colors';
import { supabaseService } from '@/lib/supabase/clients';
import type { Tables } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

import { deleteAndBlockProject } from '../sources/actions';
import {
  approveCandidate,
  markReviewed,
  rejectCandidate,
  reopenCandidate,
  unpublishProject,
} from './actions';
import { EnrichRunner } from './enrich-runner';

export const metadata: Metadata = { title: copy.adminQueueTitle };

type Candidate = Tables<'ingest_candidates'>;

/**
 * Shape of a retro-moderation row (P2.5 Wave 2A, docs/plans/
 * p2.5-self-running.md) — an already-`approved`, still-`decided_by IS NULL`
 * candidate joined to the `projects` row it materialized and that project's
 * owner username. postgrest-js's generic inference doesn't fully verify
 * nested embeds (same IO-boundary trust as src/lib/feed/queries.ts
 * FEED_COLUMNS / src/app/weird/route.ts) — shape enforced by the select
 * string in the query below, not by this type alone.
 */
type RetroCandidate = {
  github_repo_id: number;
  decided_at: string | null;
  projects: {
    id: string;
    name: string;
    slug: string;
    stars_count: number;
    tagline: string | null;
    status: string;
    profiles: { username: string };
  };
};

const PENDING_LIMIT = 100;
const REJECTED_BY_DEMAND_LIMIT = 20;
/** idx_ingest_candidates_retro (0008_self_running.sql) serves this exact shape — decided_at desc, no OFFSET. */
const RETRO_LIMIT = 50;

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

/** Tiny, quiet marker on any AI-generated field standing in for missing human data (P2 Wave 2D). */
function AiBadge() {
  return (
    <Badge
      variant="outline"
      className="h-fit shrink-0 px-1.5 py-0 font-mono text-[9px] font-normal tracking-wide text-muted-foreground"
    >
      ai
    </Badge>
  );
}

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
      {needsEnrichment(candidate) ? (
        <Badge
          variant="outline"
          className="font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
        >
          needs content
        </Badge>
      ) : null}
      {/* Visible after-state for an enrich run that produced nothing usable —
          without this, "attempted but empty" rows look identical to
          never-attempted ones (first-admin QA, P2.1). */}
      {candidate.enriched_at &&
      needsEnrichment(candidate) &&
      !candidate.ai_tagline &&
      candidate.ai_tags.length === 0 ? (
        <span className="font-mono text-[11.5px] text-muted-foreground">ai came up empty</span>
      ) : null}
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
      ) : candidate.ai_tagline ? (
        <div className="flex items-start gap-1.5">
          <AiBadge />
          <p className="line-clamp-2 text-[13.5px] text-muted-foreground">{candidate.ai_tagline}</p>
        </div>
      ) : null}

      {candidate.topics.length === 0 && candidate.ai_tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <AiBadge />
          {candidate.ai_tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md border bg-surface-2 px-[9px] py-0.5 font-mono text-[11px] leading-[1.4] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
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

/**
 * A retro-moderation row (P2.5 Wave 2A) — the project is ALREADY live (the
 * pipeline published it unattended); this row is purely "give it a human
 * glance", not a gate. Three actions, cheapest-first: `markReviewed`
 * ("looks good", no side effect on the project), `unpublishProject` (pulls
 * it back to draft, keeps the row around for the owner to `/new` again
 * later), `deleteAndBlockProject` (reused from ../sources/actions —
 * destructive, blocklists the repo so it never re-ingests).
 */
function RetroModerationRow({ candidate }: { candidate: RetroCandidate }) {
  const project = candidate.projects;
  const username = project.profiles.username;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-border/60 border-b py-3 last:border-b-0">
      <div className="flex flex-col gap-0.5">
        <a
          href={`/u/${username}/${project.slug}`}
          className={cn(
            'w-fit font-mono text-[13.5px] font-medium transition-colors hover:text-foreground',
            linkFocusRing,
          )}
        >
          {project.name}
        </a>
        {/* Absence, not zero (design-system.md) — 0 stars renders nothing, never "0 stars". */}
        <span className="font-mono text-[11.5px] text-muted-foreground">
          {`@${username}`}
          {project.stars_count > 0 ? ` · ${project.stars_count} stars` : ''}
          {` · ${project.tagline ?? 'no tagline yet'}`}
          {project.status !== 'published' ? ' · unpublished' : ''}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <form action={markReviewed}>
          <input type="hidden" name="github_repo_id" value={candidate.github_repo_id} />
          <Button type="submit" variant="secondary" size="sm">
            looks good
          </Button>
        </form>
        <form action={unpublishProject}>
          <input type="hidden" name="github_repo_id" value={candidate.github_repo_id} />
          <input type="hidden" name="project_id" value={project.id} />
          <Button type="submit" variant="ghost" size="sm">
            unpublish
          </Button>
        </form>
        {/* `deleteAndBlockProject` (../sources/actions.ts) — reused as-is,
            FormData contract is project_id + scope ('repo'|'owner') + optional
            reason; scope defaults to "this repo only" here, no reason input.
            It redirects to /admin/sources on completion (that action's own
            banner surface) rather than staying on /admin/queue — accepted,
            not forked into a queue-local variant for one button. */}
        <form action={deleteAndBlockProject}>
          <input type="hidden" name="project_id" value={project.id} />
          <input type="hidden" name="scope" value="repo" />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            delete + block
          </Button>
        </form>
      </div>
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
    ai?: string;
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

  const [
    { data: pending },
    { data: rejectedByDemand },
    { data: pendingSources },
    { data: pendingEnrichable },
    { data: rawRetro },
  ] = await Promise.all([
    pendingQuery,
    service
      .from('ingest_candidates')
      .select('*')
      .eq('status', 'rejected')
      .gt('demand_count', 0)
      .order('demand_count', { ascending: false })
      .limit(REJECTED_BY_DEMAND_LIMIT),
    service.from('ingest_candidates').select('source').eq('status', 'pending'),
    // Lean projection — just enough for `needsEnrichment` — for the enrich
    // button's count (P2 Wave 2D). Separate from `pending` above (which
    // already carries every column for the visible rows) to keep this cheap
    // even once the queue holds hundreds of candidates.
    service
      .from('ingest_candidates')
      .select('description, topics')
      .eq('status', 'pending')
      .is('enriched_at', null),
    // Retro-moderation ("published, unreviewed") — auto-approved by the
    // pipeline (status='approved', decided_by IS NULL, locked decision #1),
    // newest exposure first via idx_ingest_candidates_retro. Explicit FK
    // names on both embeds: ingest_candidates→projects has exactly one FK
    // today (materialized_project_id) so a bare `projects!inner` would
    // likely resolve fine, but naming it is free and matches the codebase's
    // existing belt-and-suspenders style for projects↔profiles below, which
    // genuinely IS ambiguous (three relationships — direct FK plus
    // many-to-many through likes/saves — ref src/lib/feed/queries.ts
    // FEED_COLUMNS / src/app/weird/route.ts).
    service
      .from('ingest_candidates')
      .select(
        'github_repo_id, decided_at, projects!ingest_candidates_materialized_project_id_fkey!inner(id, name, slug, stars_count, tagline, status, profiles!projects_profile_id_fkey!inner(username))',
      )
      .eq('status', 'approved')
      .is('decided_by', null)
      .order('decided_at', { ascending: false })
      .limit(RETRO_LIMIT),
  ]);

  const pendingRows = pending ?? [];
  const rejectedRows = rejectedByDemand ?? [];
  const sourceCounts = new Map<string, number>();
  for (const row of pendingSources ?? []) {
    sourceCounts.set(row.source, (sourceCounts.get(row.source) ?? 0) + 1);
  }
  const totalPending = (pendingSources ?? []).length;
  const enrichableCount = (pendingEnrichable ?? []).filter(needsEnrichment).length;
  const savesCount = Number(params.saves ?? '0');

  // Sub-threshold filter applied IN APPLICATION CODE, after the LIMIT-50
  // fetch above (not a SQL WHERE — the retro index is decided_at-only, no
  // stars_count column, and locked decision #1 explicitly accepts this:
  // "raising the threshold retroactively surfaces [previously-clean] items
  // ... bounded by the retro query's LIMIT"). Above-threshold auto-approved
  // rows are popular enough already — they don't need eyes.
  const autoApproveThreshold = autoApproveMinStars();
  const retroRows = ((rawRetro ?? []) as unknown as RetroCandidate[]).filter((row) =>
    needsReview({ stars_count: row.projects.stars_count }, autoApproveThreshold),
  );

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
          {params.ai ? ` · published with ai tagline: “${params.ai}”` : ''}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <EnrichRunner enrichableCount={enrichableCount} />
      </div>

      {pendingRows.length === 0 ? (
        <EmptyState message="queue’s clear — go crawl something" />
      ) : (
        <div className="flex flex-col gap-4">
          {pendingRows.map((candidate) => (
            <PendingRow key={candidate.github_repo_id} candidate={candidate} />
          ))}
        </div>
      )}

      {/* Retro-moderation (P2.5 Wave 2A): OPEN by default when non-empty —
          unlike "rejected, by demand" below, these are already LIVE on the
          gallery, so this section wants eyes, not just archival access. */}
      <details
        className="rounded-lg border border-dashed px-[22px] py-[14px]"
        open={retroRows.length > 0}
      >
        <summary
          className={cn(
            'cursor-pointer select-none font-mono text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground',
            linkFocusRing,
          )}
        >
          <span aria-hidden="true">{'// '}</span>published, unreviewed ({retroRows.length})
        </summary>
        <div className="mt-4 flex flex-col gap-1">
          {retroRows.length === 0 ? (
            <p className="py-1.5 font-mono text-[13px] text-muted-foreground">none</p>
          ) : (
            retroRows.map((candidate) => (
              <RetroModerationRow key={candidate.github_repo_id} candidate={candidate} />
            ))
          )}
        </div>
      </details>

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
