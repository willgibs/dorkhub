import 'server-only';

import { redirect } from 'next/navigation';

import { supabaseServer, supabaseService } from '@/lib/supabase/clients';

/**
 * Gate for every /admin surface (docs/plans/p1-gallery-engine.md, "Locked
 * architecture" #3: "Admin = service-role behind requireAdmin()"). A signed-out
 * visitor is bounced to sign-in with a `next` back to /admin; anyone signed in
 * but not an admin is bounced quietly to '/' — the admin surface is
 * unadvertised, so we never render a "you're not allowed here" page that would
 * confirm it exists.
 *
 * Reads `profiles.is_admin` via the SERVICE-ROLE client rather than the
 * cookie-bound one. `profiles` only grants `authenticated` a table-wide
 * UPDATE on presentation columns (username/display_name/bio/links/avatar_url —
 * see 0001_init.sql) — `is_admin` is never in that write set, and treating it
 * as writable-adjacent, cookie-readable state would make this check depend on
 * exactly how `profiles`' grants/RLS are shaped today. Reading it through
 * `supabaseService()` instead means admin-gating is correct by construction
 * (bypasses RLS/grants entirely) and can't silently regress if either changes
 * — the same defense-in-depth reasoning the plan applies to every other admin
 * table (claim_invites, ingest_*: deny-all RLS, service-role only).
 *
 * Callers should treat the *layout* call as a convenience, not the whole
 * gate: server actions (queue approve/reject, sources crawl triggers, claims
 * invites) run outside the layout tree entirely, so every action that
 * mutates admin state must call this again itself.
 */
export async function requireAdmin(): Promise<{
  userId: string;
  profileId: string;
  username: string;
}> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Fadmin');

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id, username, is_admin')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect('/');

  return { userId: user.id, profileId: profile.id, username: profile.username };
}
