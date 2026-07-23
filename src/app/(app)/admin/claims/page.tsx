import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';

import { CopyButton } from '@/components/copy-button';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/auth/admin';
import { copy } from '@/lib/copy';
import { formatUpdatedAgo } from '@/lib/projects/map';
import { supabaseService } from '@/lib/supabase/clients';
import { cn } from '@/lib/utils';

import { generateClaimInvite } from './actions';

export const metadata: Metadata = { title: copy.adminClaimsTitle };

const UNCLAIMED_LIMIT = 100;

const linkFocusRing =
  'rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Same forwarded-host origin logic as src/lib/auth/redirects.ts's
 * `requestOrigin`, adapted for a Server Component (no Request object here —
 * `headers()` is the RSC equivalent).
 */
async function currentOrigin(): Promise<string> {
  const h = await headers();
  const forwardedHost = h.get('x-forwarded-host');
  const forwardedProto = h.get('x-forwarded-proto') ?? 'https';
  const host = forwardedHost ?? h.get('host');
  return host ? `${forwardedProto}://${host}` : '';
}

type ClaimRow = {
  id: string;
  username: string;
  github_username: string;
  created_at: string;
  publishedCount: number;
  invited: boolean;
  declined: boolean;
};

function InviteState({ row }: { row: ClaimRow }) {
  if (row.declined) {
    return (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
      >
        declined
      </Badge>
    );
  }
  if (row.invited) {
    return (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
      >
        invited — unused
      </Badge>
    );
  }
  return <span className="font-mono text-[12px] text-muted-foreground">no invite yet</span>;
}

function ClaimRowCard({ row, origin, now }: { row: ClaimRow; origin: string; now: Date }) {
  return (
    <div className="edge-highlight flex flex-col gap-3 rounded-lg border bg-card px-[22px] py-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            href={`/u/${row.username}`}
            className={cn(
              'w-fit font-mono text-[15px] font-semibold transition-colors hover:text-foreground',
              linkFocusRing,
            )}
          >
            @{row.username}
          </Link>
          <span className="font-mono text-[12px] text-muted-foreground">
            github: {row.github_username} · seeded {formatUpdatedAgo(row.created_at, now)}
          </span>
        </div>
        <InviteState row={row} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[12.5px] text-muted-foreground tabular-nums">
          {row.publishedCount} published project{row.publishedCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-3">
        <form action={generateClaimInvite}>
          <input type="hidden" name="profile_id" value={row.id} />
          <Button type="submit" variant="secondary" size="sm">
            generate invite
          </Button>
        </form>
        {origin ? <CopyButton command={`${origin}/claim`} className="text-[11.5px]" /> : null}
      </div>
    </div>
  );
}

export default async function AdminClaimsPage() {
  // /admin/layout.tsx already gates this route — defense in depth, since
  // server actions elsewhere on this page live outside that render tree.
  await requireAdmin();
  const service = supabaseService();
  const origin = await currentOrigin();
  const now = new Date();

  const { data: profiles } = await service
    .from('profiles')
    .select('id, username, github_username, created_at')
    .is('user_id', null)
    .order('created_at', { ascending: false })
    .limit(UNCLAIMED_LIMIT);

  const unclaimed = profiles ?? [];
  const profileIds = unclaimed.map((p) => p.id);

  const [{ data: publishedRows }, { data: inviteRows }] =
    profileIds.length > 0
      ? await Promise.all([
          service
            .from('projects')
            .select('profile_id')
            .eq('status', 'published')
            .in('profile_id', profileIds),
          // Reads across EVERY claim_invites row for these profiles, not just
          // the latest — a decline marker can be a different row than a
          // later admin-generated invite, and any used_at-set row anywhere
          // in the set means the owner already declined (exact same
          // predicate the callback route and /claim page use to decide
          // whether to nag on sign-in — see the comment there).
          service.from('claim_invites').select('profile_id, used_at').in('profile_id', profileIds),
        ])
      : [{ data: [] }, { data: [] }];

  const publishedCounts = new Map<string, number>();
  for (const row of publishedRows ?? []) {
    publishedCounts.set(row.profile_id, (publishedCounts.get(row.profile_id) ?? 0) + 1);
  }

  const invitedIds = new Set<string>();
  const declinedIds = new Set<string>();
  for (const row of inviteRows ?? []) {
    invitedIds.add(row.profile_id);
    if (row.used_at !== null) declinedIds.add(row.profile_id);
  }

  const rows: ClaimRow[] = unclaimed.map((p) => ({
    id: p.id,
    username: p.username,
    github_username: p.github_username,
    created_at: p.created_at,
    publishedCount: publishedCounts.get(p.id) ?? 0,
    invited: invitedIds.has(p.id),
    declined: declinedIds.has(p.id),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-extrabold">{copy.adminClaimsTitle}</h1>
        <p className="text-sm text-muted-foreground">
          unclaimed, seeded profiles — the owner claims automatically by signing in with the
          matching GitHub account at /claim. invites here are conversion tracking only, never
          authorization.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="no unclaimed profiles right now" />
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <ClaimRowCard key={row.id} row={row} origin={origin} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
