'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/admin';
import { parseProjectRef, resolveSlotWindow } from '@/lib/featured/admin';
import { supabaseService } from '@/lib/supabase/clients';

/**
 * Admin featured-slot actions (P4 L1, mechanism only — nothing is sold;
 * pricing is a separate board gate). `requireAdmin()` re-runs in every
 * action — the /admin/layout.tsx gate is defense-in-depth only (same
 * convention as every other /admin/* actions.ts). All writes are
 * service-role: featured_slots has zero API-role write grants by design.
 *
 * Failures log server-side and no-op the page (minimal cut — the row list
 * simply not changing is the admin's signal; richer feedback can ride the
 * queue's ?aireason= idiom later if slot management grows real traffic).
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LABEL_MAX = 80;

function revalidateFeaturedSurfaces() {
  // The strip renders on both homes (ISR-60); revalidating makes admin
  // changes land immediately instead of on the next 60s window.
  revalidatePath('/');
  revalidatePath('/home');
  revalidatePath('/admin/featured');
}

export async function createFeaturedSlot(formData: FormData): Promise<void> {
  await requireAdmin();
  const service = supabaseService();

  const ref = parseProjectRef(String(formData.get('project') ?? ''));
  if (!ref) {
    console.error('[admin/featured] createFeaturedSlot: unparseable project ref');
    return;
  }

  const window = resolveSlotWindow(
    String(formData.get('starts_at') ?? ''),
    String(formData.get('ends_at') ?? ''),
    new Date(),
  );
  if ('error' in window) {
    console.error('[admin/featured] createFeaturedSlot window rejected:', window.error);
    return;
  }

  const rawLabel = String(formData.get('sponsor_label') ?? '').trim();
  const sponsorLabel = rawLabel ? rawLabel.slice(0, LABEL_MAX) : null;

  // Resolve the target: username -> profile -> (profile, slug) project.
  // Published-only on purpose: featuring a draft would render an empty strip
  // entry for everyone (the !inner embed drops invisible targets).
  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('username', ref.username)
    .maybeSingle();
  if (!profile) {
    console.error('[admin/featured] createFeaturedSlot: no profile', { username: ref.username });
    return;
  }
  const { data: project } = await service
    .from('projects')
    .select('id, status')
    .eq('profile_id', profile.id)
    .eq('slug', ref.slug)
    .maybeSingle();
  if (project?.status !== 'published') {
    console.error('[admin/featured] createFeaturedSlot: no published project', ref);
    return;
  }

  const { error } = await service.from('featured_slots').insert({
    project_id: project.id,
    sponsor_label: sponsorLabel,
    starts_at: window.startsAt,
    ends_at: window.endsAt,
  });
  if (error) {
    console.error('[admin/featured] createFeaturedSlot insert failed:', error.message);
    return;
  }

  revalidateFeaturedSurfaces();
}

export async function endFeaturedSlot(formData: FormData): Promise<void> {
  await requireAdmin();
  const service = supabaseService();

  const id = String(formData.get('slot_id') ?? '').trim();
  if (!UUID_PATTERN.test(id)) return;

  // ends_at = now() ends an active slot immediately and cancels a scheduled
  // one (its window collapses to already-over)... except the DB CHECK
  // requires ends_at > starts_at, so a scheduled slot (starts in the
  // future) must clamp to just past its start — functionally never-visible.
  const { data: slot } = await service
    .from('featured_slots')
    .select('starts_at')
    .eq('id', id)
    .maybeSingle();
  if (!slot) return;

  const now = new Date();
  const starts = new Date(slot.starts_at);
  const endsAt = starts.getTime() >= now.getTime() ? new Date(starts.getTime() + 1000) : now;

  const { error } = await service
    .from('featured_slots')
    .update({ ends_at: endsAt.toISOString() })
    .eq('id', id);
  if (error) {
    console.error('[admin/featured] endFeaturedSlot failed:', error.message);
    return;
  }

  revalidateFeaturedSurfaces();
}

export async function deleteFeaturedSlot(formData: FormData): Promise<void> {
  await requireAdmin();
  const service = supabaseService();

  const id = String(formData.get('slot_id') ?? '').trim();
  if (!UUID_PATTERN.test(id)) return;

  const { error } = await service.from('featured_slots').delete().eq('id', id);
  if (error) {
    console.error('[admin/featured] deleteFeaturedSlot failed:', error.message);
    return;
  }

  revalidateFeaturedSurfaces();
}
