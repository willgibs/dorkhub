import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { formatUpdatedAgo } from '@/lib/projects/map';
import { supabaseService } from '@/lib/supabase/clients';

export const metadata: Metadata = { title: 'admin' };

/** Quiet bordered card, one per dashboard metric group. Inline — this is a single-use page shell, not a design-system component (per plan: "no new design-system components"). */
function AdminSection({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <section className="edge-highlight flex flex-col gap-0.5 rounded-lg border bg-card px-[22px] py-[18px]">
      <p className="mb-1.5 font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
        <span aria-hidden="true">{'// '}</span>
        {kicker}
      </p>
      {children}
    </section>
  );
}

/**
 * A single label/count row. Admin counts are deliberately shown even at 0 —
 * the product-wide "absence, not zero" voice rule (docs/design-system.md) is
 * about user-facing content (an empty profile shouldn't announce "0 stars");
 * here 0 pending / 0 blocked / 0 crawls IS the useful signal ("the queue is
 * actually empty" vs. "we haven't checked"), so it stays a plain number.
 */
function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 font-mono text-[13px] last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const service = supabaseService();

  const [
    pendingRes,
    approvedRes,
    rejectedRes,
    supersededRes,
    starImportsRes,
    starImportersRes,
    blocklistRes,
    crawlRunsRes,
    unclaimedRes,
    publishedRes,
  ] = await Promise.all([
    service
      .from('ingest_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    service
      .from('ingest_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    service
      .from('ingest_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),
    service
      .from('ingest_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'superseded'),
    service.from('star_imports').select('*', { count: 'exact', head: true }),
    // No SQL DISTINCT via postgrest — profile_id is fetched and deduped in JS.
    // Fine at this scale (pre-launch admin dashboard, not a hot path).
    service.from('star_imports').select('profile_id'),
    service.from('ingest_blocklist').select('*', { count: 'exact', head: true }),
    service
      .from('ingest_crawl_runs')
      .select('id, source, status, candidates_created, candidates_touched, started_at')
      .order('started_at', { ascending: false })
      .limit(5),
    service.from('profiles').select('*', { count: 'exact', head: true }).is('user_id', null),
    service.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'published'),
  ]);

  const candidateCounts = {
    pending: pendingRes.count ?? 0,
    approved: approvedRes.count ?? 0,
    rejected: rejectedRes.count ?? 0,
    superseded: supersededRes.count ?? 0,
  };
  const starImportsTotal = starImportsRes.count ?? 0;
  const distinctImporters = new Set((starImportersRes.data ?? []).map((row) => row.profile_id))
    .size;
  const blocklistCount = blocklistRes.count ?? 0;
  const crawlRuns = crawlRunsRes.data ?? [];
  const unclaimedCount = unclaimedRes.count ?? 0;
  const publishedCount = publishedRes.count ?? 0;
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] font-extrabold">admin</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminSection kicker="review queue">
          <StatRow label="pending" value={candidateCounts.pending} />
          <StatRow label="approved" value={candidateCounts.approved} />
          <StatRow label="rejected" value={candidateCounts.rejected} />
          <StatRow label="superseded" value={candidateCounts.superseded} />
        </AdminSection>

        <AdminSection kicker="star imports">
          <StatRow label="total imports" value={starImportsTotal} />
          <StatRow label="distinct importers" value={distinctImporters} />
        </AdminSection>

        <AdminSection kicker="blocklist">
          <StatRow label="blocked repos + owners" value={blocklistCount} />
        </AdminSection>

        <AdminSection kicker="claims">
          <StatRow label="unclaimed profiles" value={unclaimedCount} />
        </AdminSection>

        <AdminSection kicker="gallery">
          <StatRow label="published projects" value={publishedCount} />
        </AdminSection>
      </div>

      <AdminSection kicker="latest crawls">
        {crawlRuns.length === 0 ? (
          <p className="py-1.5 font-mono text-[13px] text-muted-foreground">no crawls run yet</p>
        ) : (
          <div className="flex flex-col gap-2 pt-1">
            {crawlRuns.map((run) => (
              <div
                key={run.id}
                className="flex flex-wrap items-center gap-3 font-mono text-[12.5px] text-muted-foreground"
              >
                <span className="text-foreground">{run.source}</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
                >
                  {run.status}
                </Badge>
                <span className="tabular-nums">{run.candidates_created} created</span>
                <span className="tabular-nums">{run.candidates_touched} touched</span>
                <span>{formatUpdatedAgo(run.started_at, now)}</span>
              </div>
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
