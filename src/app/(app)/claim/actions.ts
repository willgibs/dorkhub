'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { githubIdentity } from '@/lib/auth/identity';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

/**
 * Claim-flow actions (P1 Wave 3, docs/plans/p1-gallery-engine.md "Locked
 * architecture" #10). Both actions resolve the caller's GitHub identity from
 * the SESSION — never from form data — because `github_id` is the sole claim
 * key (docs/architecture.md, "Ownership model"): trusting a client-supplied
 * id here would let anyone claim anyone else's seeded page.
 */

/**
 * Accepts a claim: the atomic conditional UPDATE is the entire security
 * model. It only succeeds if a row still exists with this exact github_id
 * AND user_id IS NULL — a second browser tab, a double-submit, or someone
 * else racing the same profile all fail this WHERE clause harmlessly (zero
 * rows updated), never a duplicate/partial claim.
 */
export async function acceptClaim(): Promise<void> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Fclaim');

  const gh = githubIdentity(user);
  if (!gh) redirect('/onboarding');

  const service = supabaseService();
  const { data: claimed, error } = await service
    .from('profiles')
    .update({ user_id: user.id, claimed_at: new Date().toISOString() })
    .eq('github_id', gh.githubId)
    .is('user_id', null)
    .select('id, username, github_username')
    .maybeSingle();

  if (error) {
    console.error('[claim] acceptClaim update failed:', error.message);
  }
  if (!claimed) {
    // Someone else claimed it mid-flight, or there was never anything to
    // claim (stale link, double submit after a first successful accept) —
    // either way there's nothing left to do here but the ordinary onboarding
    // path (mirrors the callback route's own fallback).
    redirect('/onboarding');
  }

  // The GitHub login may have drifted since this profile was seeded (repo
  // owner renamed their account) — true up github_username now that we have
  // a verified, freshly-authenticated session for it. Service role: this
  // column has no authenticated-writable grant (0001_init.sql).
  if (gh.login && gh.login !== claimed.github_username) {
    const { error: usernameSyncError } = await service
      .from('profiles')
      .update({ github_username: gh.login })
      .eq('id', claimed.id);
    if (usernameSyncError) {
      console.error('[claim] github_username sync failed:', usernameSyncError.message);
    }
  }

  revalidatePath(`/u/${claimed.username}`);
  revalidatePath('/');
  redirect(`/u/${claimed.username}`);
}

/**
 * Declines a claim: unpublishes every project under the unclaimed profile
 * (status → 'draft', rows kept — copy promises "change your mind anytime")
 * and leaves the profile itself unclaimed (user_id stays null; this is NOT
 * the admin delete-and-block consent path).
 *
 * Decline-marker repurposing (see the matching comment in
 * src/app/auth/callback/route.ts): claim_invites has no "declined" column,
 * and the schema is locked for P1, so a decline inserts a claim_invites row
 * for this profile with `used_at` already set — "used" standing in for
 * "the owner interacted with this claim (and said no)". This is the ONLY
 * write this action makes to claim_invites; it never touches `token` or
 * `expires_at` meaningfully since nothing is ever redeemed through it.
 */
export async function declineClaim(): Promise<void> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Fclaim');

  const gh = githubIdentity(user);
  if (!gh) redirect('/onboarding');

  const service = supabaseService();
  const { data: unclaimed } = await service
    .from('profiles')
    .select('id, username')
    .eq('github_id', gh.githubId)
    .is('user_id', null)
    .maybeSingle();

  if (!unclaimed) {
    // Nothing to decline (already claimed elsewhere, or never existed) —
    // send them through the ordinary path rather than erroring.
    redirect('/onboarding');
  }

  const { data: unpublished, error: unpublishError } = await service
    .from('projects')
    .update({ status: 'draft' })
    .eq('profile_id', unclaimed.id)
    .eq('status', 'published')
    .select('slug');
  if (unpublishError) {
    console.error('[claim] declineClaim unpublish failed:', unpublishError.message);
  }

  const { error: markerError } = await service
    .from('claim_invites')
    .insert({ profile_id: unclaimed.id, used_at: new Date().toISOString() });
  if (markerError) {
    console.error('[claim] declineClaim marker insert failed:', markerError.message);
  }

  revalidatePath('/');
  revalidatePath(`/u/${unclaimed.username}`);
  for (const project of unpublished ?? []) {
    revalidatePath(`/u/${unclaimed.username}/${project.slug}`);
  }
  revalidatePath('/claim');

  // Back to /claim, not /onboarding — the page now finds the decline marker
  // and renders the quiet "done" state instead of the claim UI (no redirect
  // loop: this is a direct redirect from the action, not through the
  // callback route's decline-marker check).
  redirect('/claim');
}
