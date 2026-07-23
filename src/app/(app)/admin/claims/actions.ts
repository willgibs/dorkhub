'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/admin';
import { supabaseService } from '@/lib/supabase/clients';

/**
 * Admin claims actions (P1 Wave 3, docs/plans/p1-gallery-engine.md "Locked
 * architecture" #10, minimal cut). `requireAdmin()` re-runs here — the
 * /admin/layout.tsx gate is defense-in-depth only; server actions bypass
 * that render tree entirely (same convention as every other /admin/*
 * actions.ts).
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Inserts a plain, unused claim_invites row for conversion tracking only.
 * The token is NEVER authorization — the real claim key is the verified
 * session github_id (docs/architecture.md). `/claim/[token]` (a pretty,
 * pre-filled landing page) is deferred past P1; the link an admin hands out
 * today is just `/claim` itself, which does the real matching once the
 * owner signs in with GitHub. This action exists so the queue can show
 * "invited" vs. "not yet invited" per unclaimed profile.
 */
export async function generateClaimInvite(formData: FormData): Promise<void> {
  await requireAdmin();
  const service = supabaseService();

  const profileId = String(formData.get('profile_id') ?? '').trim();
  if (!UUID_PATTERN.test(profileId)) return;

  const { error } = await service.from('claim_invites').insert({ profile_id: profileId });
  if (error) {
    console.error('[admin/claims] generateClaimInvite failed:', error.message);
  }

  revalidatePath('/admin/claims');
}
