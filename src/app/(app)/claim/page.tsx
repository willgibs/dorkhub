import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EmptyState } from '@/components/empty-state';
import { PageShell } from '@/components/page-shell';
import { ProfileHeader } from '@/components/profile-header';
import { ProjectCard } from '@/components/project-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { githubIdentity } from '@/lib/auth/identity';
import { copy } from '@/lib/copy';
import { projectRowToCard } from '@/lib/projects/map';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

import { acceptClaim, declineClaim } from './actions';

export const metadata: Metadata = { title: copy.claimTitle };

function Kicker() {
  return (
    <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
      <span aria-hidden="true">{'// '}</span>claim
    </p>
  );
}

/**
 * /claim — the P1 Wave 3 claim flow (docs/plans/p1-gallery-engine.md,
 * "Locked architecture" #10). Auth-gated by proxy.ts (AUTHED_PREFIXES
 * includes '/claim'); this page adds its own guard for defense-in-depth,
 * same convention as /admin/layout.tsx.
 *
 * Page order (mirrors ./actions.ts's decline-marker comment):
 *   already claimed a profile → /u/{username} (nothing to do)
 *   no unclaimed match         → /onboarding (nothing to claim)
 *   unclaimed match, declined  → quiet "done" state (copy.claimDeclined)
 *   unclaimed match            → the claim UI (accept/decline)
 */
export default async function ClaimPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Fclaim');

  const gh = githubIdentity(user);
  if (!gh) redirect('/onboarding');

  const service = supabaseService();

  // Already claimed elsewhere → nothing to do here (mirrors the callback
  // route's own "existing profile → next" branch).
  const { data: mine } = await service
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle();
  if (mine) redirect(`/u/${mine.username}`);

  const { data: profile } = await service
    .from('profiles')
    .select('*')
    .eq('github_id', gh.githubId)
    .is('user_id', null)
    .maybeSingle();
  if (!profile) redirect('/onboarding'); // nothing seeded for this github account

  // Decline-marker check — same claim_invites repurposing documented in
  // src/app/auth/callback/route.ts and ./actions.ts's declineClaim.
  const { data: declineMarker } = await service
    .from('claim_invites')
    .select('token')
    .eq('profile_id', profile.id)
    .not('used_at', 'is', null)
    .limit(1)
    .maybeSingle();

  if (declineMarker) {
    return (
      <PageShell className="flex flex-col items-start gap-4 py-24">
        <Kicker />
        <p className="max-w-md text-muted-foreground">{copy.claimDeclined}</p>
        <Link
          href="/"
          className="rounded-sm text-sm text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          back home
        </Link>
      </PageShell>
    );
  }

  const { data: projectRows } = await service
    .from('projects')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  const projectItems = (projectRows ?? []).map((row) => projectRowToCard(row, profile.username));

  const author = {
    username: profile.username,
    displayName: profile.display_name ?? profile.username,
    bio: profile.bio ?? '',
    initial: (profile.display_name ?? profile.username).charAt(0).toLowerCase(),
    projects: projectItems.length,
    followers: profile.followers_count,
  };

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <div className="max-w-xl">
        <Kicker />
        <h1 className="mt-3 font-display text-4xl font-extrabold">{copy.claimTitle}</h1>
        <p className="mt-3 text-muted-foreground">{copy.claimBody}</p>
      </div>

      <div className="flex flex-col gap-6">
        <Badge
          variant="outline"
          className="w-fit font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
        >
          curated by dorkhub from public github data · not yet claimed
        </Badge>

        <ProfileHeader avatarUrl={profile.avatar_url} author={author} />

        {projectItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projectItems.map((card, i) => (
              <ProjectCard
                key={card.slug}
                project={card}
                author={author}
                staggerIndex={i}
                href={`/u/${author.username}/${card.slug}`}
                authorHref={`/u/${author.username}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState message={copy.profileEmptyProjects} />
        )}
      </div>

      <div className="flex items-center gap-3">
        <form action={acceptClaim}>
          <Button type="submit">{copy.claimAccept}</Button>
        </form>
        <form action={declineClaim}>
          <Button
            type="submit"
            variant="secondary"
            className="text-destructive hover:text-destructive"
          >
            {copy.claimDecline}
          </Button>
        </form>
      </div>
    </PageShell>
  );
}
