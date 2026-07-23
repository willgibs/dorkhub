'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { buildEnrichmentPrompt, needsEnrichment, parseEnrichmentResult } from '@/lib/ai/enrich';
import { AiConfigError, chatCompletion } from '@/lib/ai/gateway';
import { requireAdmin } from '@/lib/auth/admin';
import { validateUsername } from '@/lib/auth/usernames';
import { getReadmeRaw, getRepoById } from '@/lib/github/client';
import { syncProject } from '@/lib/github/sync';
import { isValidDemoUrl, parseTagsInput } from '@/lib/projects/fields';
import { generateProjectSlug } from '@/lib/projects/slug';
import { supabaseService } from '@/lib/supabase/clients';

/**
 * GitHub description → tagline, within the DB's 120-char check. Approved
 * projects must never land as bare cards — the gallery's first impression is
 * the product (first-user QA, 2026-07-23).
 */
function descriptionToTagline(description: string | null): string | null {
  const trimmed = description?.trim() ?? '';
  if (!trimmed) return null;
  return trimmed.length > 120 ? `${trimmed.slice(0, 119).trimEnd()}…` : trimmed;
}

/**
 * Review-queue actions (P1 Wave 2B, docs/plans/p1-gallery-engine.md "Locked
 * architecture" #2, #4, #7, #9). Every action starts with `requireAdmin()` —
 * the /admin/layout.tsx gate is defense-in-depth only; server actions live
 * outside that render tree entirely.
 *
 * Wiring choice (plan explicitly leaves this open, "pick one, note it"): these
 * are plain `<form action={...}>` targets, not useActionState — same base
 * pattern as src/app/(app)/settings/projects/actions.ts (void-returning
 * actions + revalidatePath). A plain form action's return value is never
 * observed by React, though, so unlike that file's simpler toggles,
 * `approveCandidate` has real outcomes an admin needs to see (which repo got
 * auto-rejected, why an approval failed, how many retroactive saves landed) —
 * those travel as `/admin/queue?...` query params via `redirect()` on both
 * the success and failure paths, decoded and rendered by page.tsx.
 * `rejectCandidate`/`reopenCandidate` have no comparable outcomes to report,
 * so they stay silent no-ops on precondition failure (revalidatePath only),
 * matching setProjectStatus's convention.
 *
 * `enrichCandidates` (P2 Wave 2D, docs/plans/p2-discovery.md) joins this
 * file as the batch AI-enrichment trigger — same query-param redirect
 * convention as `approveCandidate`.
 */

/** GitHub's SPDX id for "no machine-detectable license" — mirrors src/app/(app)/new/actions.ts. */
const NOASSERTION = 'NOASSERTION';

/**
 * Sequential AI calls per `enrichCandidatesPage` chunk — small enough that
 * each server-action round-trip stays a few seconds (readme fetch + one
 * model call per row), so the runner's progress line moves visibly.
 */
const ENRICH_CHUNK_SIZE = 5;

/** Same token budget for every enrichment call, batch or inline — a tagline + up to 6 tags is short. */
const ENRICHMENT_MAX_TOKENS = 300;

function parseRepoId(formData: FormData): number | null {
  const raw = Number(formData.get('github_repo_id'));
  return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
}

/** Sends the admin back to the queue with a short, human-readable reason in `?err=`. */
function redirectWithError(message: string): never {
  redirect(`/admin/queue?err=${encodeURIComponent(message)}`);
}

/** One enrich-runner chunk — see `enrichCandidatesPage`. */
export type EnrichPageResult = {
  /** Rows this chunk wrote a usable ai_tagline/ai_tags for. */
  enriched: number;
  /** Rows the model answered but produced nothing usable for (stamped — won't retry). */
  empty: number;
  /** True when a full chunk was selected — more enrichable rows likely remain. */
  hasMore: boolean;
  /**
   * Set when the chunk stopped early on a SYSTEMIC failure (rate limit,
   * provider error, missing key). Unprocessed rows stay unstamped and are
   * picked up by the next call — resume is safe.
   */
  stopReason: string | null;
};

/**
 * One chunk of the client-driven enrichment loop (P2.1 rework — same shape
 * as `importStarsPage`): the queue page's EnrichRunner calls this repeatedly
 * until `hasMore` is false, showing live progress between calls. This is the
 * PRIMARY enrichment path (docs/plans/p2-discovery.md locked decisions
 * #8–#9): an admin reviews `ai_tagline`/`ai_tags` on the pending row before
 * approving; `approveCandidate`'s inline fallback only fires when this never
 * ran (or the model came up empty).
 *
 * Selection draws from the ACTUAL enrichable set — two lean queries
 * (`description is null` / `topics = '{}'`), merged and deduped, instead of
 * one `.or()` (house style avoids PostgREST `.or()` — docs/decisions.md
 * M5.5; the original top-60-by-demand window saw 1 of 52 enrichable rows).
 * Chunks run SEQUENTIALLY — never a concurrency pool.
 *
 * Stamping semantics (P2.1 hard lesson — a bad model id stamped 12 rows as
 * "attempted" that were never really tried):
 *  - SYSTEMIC failures (rate_limited, any provider `error`, AiConfigError)
 *    stop the chunk WITHOUT stamping — nothing is consumed, the reason is
 *    returned for the runner to display, and resume retries the same rows.
 *  - Only an `ok` model reply stamps `enriched_at` — usable or not — so
 *    genuinely-answered duds never retry forever, and nothing else burns.
 */
export async function enrichCandidatesPage(): Promise<EnrichPageResult> {
  await requireAdmin();
  const service = supabaseService();

  const enrichableBase = () =>
    service
      .from('ingest_candidates')
      .select('*')
      .eq('status', 'pending')
      .is('enriched_at', null)
      .order('demand_count', { ascending: false })
      .order('stars_count', { ascending: false })
      .limit(ENRICH_CHUNK_SIZE);

  const [{ data: noDescription }, { data: noTopics }] = await Promise.all([
    enrichableBase().is('description', null),
    // .filter() escape hatch: .eq('topics', []) typechecks but serializes to
    // the invalid `topics=eq.` (empty value, no braces) — probed live, P2.1.
    enrichableBase().filter('topics', 'eq', '{}'),
  ]);

  const byRepoId = new Map(
    [...(noDescription ?? []), ...(noTopics ?? [])].map((row) => [row.github_repo_id, row]),
  );
  const toEnrich = [...byRepoId.values()]
    .filter(needsEnrichment) // belt-and-braces: whitespace-only descriptions
    .sort((a, b) => b.demand_count - a.demand_count || b.stars_count - a.stars_count)
    .slice(0, ENRICH_CHUNK_SIZE);

  const result: EnrichPageResult = {
    enriched: 0,
    empty: 0,
    hasMore: toEnrich.length === ENRICH_CHUNK_SIZE,
    stopReason: null,
  };

  for (const candidate of toEnrich) {
    let readmeText: string | null = null;
    try {
      const readmeResult = await getReadmeRaw(candidate.owner_login, candidate.name);
      if (readmeResult.kind === 'ok') readmeText = readmeResult.data;
    } catch (err) {
      console.error('[admin/queue] enrichCandidatesPage readme fetch failed:', err);
    }

    let chatResult: Awaited<ReturnType<typeof chatCompletion>>;
    try {
      chatResult = await chatCompletion({
        messages: buildEnrichmentPrompt(candidate, readmeText),
        maxTokens: ENRICHMENT_MAX_TOKENS,
      });
    } catch (err) {
      if (err instanceof AiConfigError) {
        console.error('[admin/queue] enrichCandidatesPage:', err.message);
        result.stopReason =
          'ai not configured — set GEMINI_API_KEY (google ai studio, free) or AI_GATEWAY_API_KEY';
        return result;
      }
      throw err;
    }

    if (chatResult.kind === 'rate_limited') {
      result.stopReason = 'provider rate-limited — nothing consumed, resume in a minute';
      return result;
    }
    if (chatResult.kind === 'error') {
      result.stopReason = `provider error${chatResult.status ? ` ${chatResult.status}` : ''}: ${chatResult.message.slice(0, 160)}`;
      return result;
    }

    const parsed = parseEnrichmentResult(chatResult.content);
    if (parsed) {
      result.enriched += 1;
    } else {
      result.empty += 1;
    }

    const { error } = await service
      .from('ingest_candidates')
      .update({
        ai_tagline: parsed?.tagline ?? null,
        ai_tags: parsed?.tags ?? [],
        enriched_at: new Date().toISOString(),
      })
      .eq('github_repo_id', candidate.github_repo_id);
    if (error) {
      console.error('[admin/queue] enrichCandidatesPage update failed:', error.message);
    }
  }

  if (!result.hasMore) revalidatePath('/admin/queue');
  return result;
}

/**
 * Approves a pending candidate — "approval = publish", no draft step (locked
 * arch #4). Re-fetches the repo fresh (locked arch #2: candidate rows are
 * disposable snapshots, never trusted at write time), re-checks the
 * blocklist, upserts the unclaimed owner profile, and inserts the project
 * using exactly the same shape/slug/sort_order/23505-recovery logic as
 * src/app/(app)/new/actions.ts `createProject` — the only structural
 * difference is `status: 'published'` at insert time instead of `'draft'`.
 */
export async function approveCandidate(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const service = supabaseService();

  const githubRepoId = parseRepoId(formData);
  if (githubRepoId === null) return;

  const { data: candidate } = await service
    .from('ingest_candidates')
    .select('github_repo_id, ai_tagline, ai_tags')
    .eq('github_repo_id', githubRepoId)
    .eq('status', 'pending')
    .maybeSingle();
  if (!candidate) return; // already decided elsewhere, or a stale double-submit

  let repoResult: Awaited<ReturnType<typeof getRepoById>>;
  try {
    repoResult = await getRepoById(githubRepoId);
  } catch (err) {
    // GithubConfigError (missing GITHUB_TOKEN) — candidate stays pending, admin retries.
    console.error('[admin/queue] repo fetch unavailable:', err);
    redirectWithError('github unavailable right now — try again');
  }

  if (repoResult.kind === 'not_found') {
    const { error } = await service
      .from('ingest_candidates')
      .update({
        status: 'rejected',
        rejection_reason: 'auto: repo unavailable at approval time',
        decided_by: admin.profileId,
        decided_at: new Date().toISOString(),
      })
      .eq('github_repo_id', githubRepoId);
    if (error) console.error('[admin/queue] auto-reject (not_found) failed:', error.message);
    revalidatePath('/admin/queue');
    redirectWithError('repo no longer available — auto-rejected');
  }
  if (repoResult.kind !== 'ok') {
    // Covers rate_limited/error (and not_modified, which can't happen here —
    // this call never sends an etag). Candidate stays pending either way.
    redirectWithError('github unavailable right now — try again');
  }
  const repo = repoResult.data;

  // Blocklist can change between candidate creation and approval — re-check
  // fresh. Consent is checked on EVERY candidate-creating/-materializing path
  // (locked arch #9).
  const { data: blocked } = await service
    .from('ingest_blocklist')
    .select('id')
    .or(
      `and(scope.eq.repo,github_repo_id.eq.${repo.id}),and(scope.eq.owner,github_owner_id.eq.${repo.owner.id})`,
    )
    .limit(1)
    .maybeSingle();
  if (blocked) {
    const { error } = await service
      .from('ingest_candidates')
      .update({
        status: 'rejected',
        rejection_reason: 'auto: blocklisted',
        decided_by: admin.profileId,
        decided_at: new Date().toISOString(),
      })
      .eq('github_repo_id', githubRepoId);
    if (error) console.error('[admin/queue] auto-reject (blocklist) failed:', error.message);
    revalidatePath('/admin/queue');
    redirectWithError('blocklisted — auto-rejected');
  }

  // Upsert the unclaimed owner profile — N repos under one owner collapse to
  // one profile (locked arch #4).
  const { data: existingProfile } = await service
    .from('profiles')
    .select('id, username')
    .eq('github_id', repo.owner.id)
    .maybeSingle();

  let profileId: string;
  let profileUsername: string;

  if (existingProfile) {
    profileId = existingProfile.id;
    profileUsername = existingProfile.username;
  } else {
    const usernameCheck = validateUsername(repo.owner.login);
    if (!usernameCheck.ok) {
      redirectWithError(
        `can't auto-create a profile for "${repo.owner.login}" (${usernameCheck.reason}) — handle manually`,
      );
    }

    const { data: insertedProfile, error: profileInsertError } = await service
      .from('profiles')
      .insert({
        username: usernameCheck.value,
        display_name: repo.owner.login,
        github_id: repo.owner.id,
        github_username: repo.owner.login,
        // claimed_at stays null (column default) — this is an unclaimed
        // seeded profile until the real owner signs in via the claim flow
        // (P1 Wave 3), NOT an onboarding-style self-claim.
      })
      .select('id, username')
      .single();

    if (profileInsertError || !insertedProfile) {
      // We already confirmed no profile exists for this github_id above, so a
      // 23505 here can only be the USERNAME unique constraint: a different
      // existing profile squats this login (e.g. a GitHub handle that changed
      // hands). Don't guess who "wins" — surface it for manual resolution.
      console.error('[admin/queue] profile insert failed:', profileInsertError);
      redirectWithError(
        `username "${usernameCheck.value}" is already taken by a different account — handle manually`,
      );
    }
    profileId = insertedProfile.id;
    profileUsername = insertedProfile.username;
  }

  // Insert exactly like createProject (src/app/(app)/new/actions.ts): fresh
  // slug vs this owner's existing slugs, sort_order = max + 1, 23505 recovery.
  const { data: existingSlugRows } = await service
    .from('projects')
    .select('slug')
    .eq('profile_id', profileId);
  const existingSlugs = new Set((existingSlugRows ?? []).map((row) => row.slug));
  const slug = generateProjectSlug(repo.name, existingSlugs);

  const { data: maxSortRow } = await service
    .from('projects')
    .select('sort_order')
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (maxSortRow?.sort_order ?? -1) + 1;

  const license = repo.license?.spdx_id === NOASSERTION ? null : (repo.license?.spdx_id ?? null);
  const publishedAt = new Date();

  // Curated-content mapping (first-user QA, 2026-07-23), extended for AI
  // enrichment (P2 Wave 2D, docs/plans/p2-discovery.md locked decision #9):
  // real human data always wins. Real description beats `ai_tagline`; real
  // topics beat `ai_tags`. `candidate.ai_*` was normalized once already
  // (parseEnrichmentResult / descriptionToTagline-equivalent), but tags run
  // through `parseTagsInput` again here — same idiom as `ghTags`, harmless
  // on already-clean input, and keeps one normalization path for every tag
  // source that reaches a project row.
  const ghTags = parseTagsInput(repo.topics.join(', '));
  let tagline = descriptionToTagline(repo.description) ?? candidate.ai_tagline ?? null;
  let tags = ghTags.length > 0 ? ghTags : parseTagsInput(candidate.ai_tags.join(', '));

  // Inline fallback (locked decision #9): only when queue-time enrichment
  // never ran (or came up empty) AND the fresh repo itself has neither a
  // description nor topics — i.e. there is truly nothing better to fall
  // back on. One best-effort try; ANY failure (including AiConfigError,
  // caught right here) proceeds with nulls — this must never fail
  // approval. The og image + repo name still carry the card either way.
  let inlineAiTagline: string | null = null;
  const repoHasNoContent = !repo.description?.trim() && repo.topics.length === 0;
  if (tagline === null && tags.length === 0 && repoHasNoContent) {
    try {
      let readmeText: string | null = null;
      const readmeResult = await getReadmeRaw(repo.owner.login, repo.name);
      if (readmeResult.kind === 'ok') readmeText = readmeResult.data;

      const chatResult = await chatCompletion({
        messages: buildEnrichmentPrompt(
          {
            name: repo.name,
            owner_login: repo.owner.login,
            description: repo.description,
            primary_language: repo.language,
            topics: repo.topics,
          },
          readmeText,
        ),
        maxTokens: ENRICHMENT_MAX_TOKENS,
      });

      if (chatResult.kind === 'ok') {
        const parsed = parseEnrichmentResult(chatResult.content);
        if (parsed) {
          tagline = parsed.tagline;
          tags = parsed.tags;
          inlineAiTagline = parsed.tagline;

          // Audit trail — persist back to the candidate row even though its
          // status flips to 'approved' below.
          const { error: enrichWriteError } = await service
            .from('ingest_candidates')
            .update({
              ai_tagline: parsed.tagline,
              ai_tags: parsed.tags,
              enriched_at: new Date().toISOString(),
            })
            .eq('github_repo_id', githubRepoId);
          if (enrichWriteError) {
            console.error(
              '[admin/queue] inline enrichment audit write failed:',
              enrichWriteError.message,
            );
          }
        }
      }
    } catch (err) {
      console.error(
        '[admin/queue] inline enrichment fallback failed (publishing with nulls):',
        err,
      );
    }
  }

  const { data: insertedProject, error: insertError } = await service
    .from('projects')
    .insert({
      profile_id: profileId,
      slug,
      github_repo_id: repo.id,
      repo_full_name: repo.full_name,
      repo_url: repo.html_url,
      name: repo.name,
      primary_language: repo.language,
      topics: repo.topics,
      stars_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      license,
      status: 'published',
      sort_order: sortOrder,
      tagline,
      tags,
      demo_url: repo.homepage && isValidDemoUrl(repo.homepage) ? repo.homepage : null,
      // `trg_projects_before_update` (0001_init.sql) only fires on UPDATE and
      // only stamps published_at/trending_score on a draft→published
      // transition — a direct INSERT as 'published' never runs it, so both
      // would otherwise sit at null/0 forever. Stamp published_at explicitly,
      // and seed trending_score with the SAME formula as compute_trending()
      // there: likes/saves are always 0 on a brand-new row, so
      // log10(1 + 0 + 2*0) collapses to 0 and only the recency term remains.
      published_at: publishedAt.toISOString(),
      trending_score: publishedAt.getTime() / 1000 / 45000,
    })
    .select('id, slug')
    .single();

  let projectId: string;
  let projectSlug: string;
  if (insertError) {
    if (insertError.code === '23505') {
      // Global unique constraint on github_repo_id: someone else materialized
      // this repo first (e.g. the owner self-added via /new while this sat in
      // the queue — trg_projects_supersede_candidate already flipped the
      // candidate to 'superseded' in that case). Re-point rather than fail.
      // Select slug too — it's THEIR slug, not the one generated above.
      const { data: existingProject } = await service
        .from('projects')
        .select('id, slug')
        .eq('github_repo_id', repo.id)
        .maybeSingle();
      if (!existingProject) {
        console.error('[admin/queue] 23505 recovery found no existing row:', insertError);
        redirectWithError('something broke on our end — not you, us. try again?');
      }
      projectId = existingProject.id;
      projectSlug = existingProject.slug;
    } else {
      console.error('[admin/queue] project insert failed:', insertError);
      redirectWithError('something broke on our end — not you, us. try again?');
    }
  } else {
    projectId = insertedProject.id;
    projectSlug = insertedProject.slug;
  }

  // Best-effort initial sync — never blocks approval (mirrors createProject).
  try {
    await syncProject(projectId);
  } catch (err) {
    console.error('[admin/queue] initial sync threw:', err);
  }

  const { error: decideError } = await service
    .from('ingest_candidates')
    .update({
      status: 'approved',
      decided_by: admin.profileId,
      decided_at: new Date().toISOString(),
      materialized_project_id: projectId,
    })
    .eq('github_repo_id', githubRepoId);
  if (decideError) {
    console.error('[admin/queue] candidate decision write failed:', decideError.message);
  }

  // Retroactive saves: everyone who already starred this while it was a
  // candidate gets instant gratification (locked arch #4). Batched upsert
  // with ON CONFLICT DO NOTHING — safe even against the 23505-recovery path
  // reusing an already-live, already-saved project. RETURNING only reports
  // the rows PostgREST actually inserted (conflicted rows are silently
  // skipped), so `.select().length` IS the real "created" count.
  const { data: importerRows } = await service
    .from('star_imports')
    .select('profile_id')
    .eq('github_repo_id', githubRepoId);
  const importerProfileIds = [...new Set((importerRows ?? []).map((row) => row.profile_id))];

  let savesCreated = 0;
  if (importerProfileIds.length > 0) {
    const { data: insertedSaves, error: savesError } = await service
      .from('saves')
      .upsert(
        importerProfileIds.map((profileIdToSave) => ({
          profile_id: profileIdToSave,
          project_id: projectId,
        })),
        { onConflict: 'profile_id,project_id', ignoreDuplicates: true },
      )
      .select('profile_id');
    if (savesError) {
      console.error('[admin/queue] retroactive saves failed:', savesError.message);
    }
    savesCreated = insertedSaves?.length ?? 0;
  }

  revalidatePath('/');
  revalidatePath(`/u/${profileUsername}`);
  revalidatePath('/admin/queue');

  // Success surfaces the same way failures do (query params, not a return
  // value a plain form action can't observe) — projectSlug/username/
  // savesCreated is what the plan asked this action to report back.
  const successParams = new URLSearchParams({
    ok: projectSlug,
    username: profileUsername,
    saves: String(savesCreated),
  });
  // Only set when the inline fallback above actually generated a tagline —
  // lets the admin see what got published sight-unseen (locked decision #9).
  if (inlineAiTagline) {
    successParams.set('ai', inlineAiTagline);
  }
  redirect(`/admin/queue?${successParams.toString()}`);
}

/** Pending → rejected. Sticky by design (locked arch #7) — only `reopenCandidate` reverses it. */
export async function rejectCandidate(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const service = supabaseService();

  const githubRepoId = parseRepoId(formData);
  if (githubRepoId === null) return;

  const reasonRaw = String(formData.get('reason') ?? '').trim();
  const reason = reasonRaw.length > 0 ? reasonRaw : null;

  const { error } = await service
    .from('ingest_candidates')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      decided_by: admin.profileId,
      decided_at: new Date().toISOString(),
    })
    .eq('github_repo_id', githubRepoId)
    .eq('status', 'pending'); // no-op if already decided elsewhere (stale double-submit)

  if (error) console.error('[admin/queue] rejectCandidate failed:', error.message);
  revalidatePath('/admin/queue');
}

/** Rejected → pending. The ONLY reopen path (locked arch #7) — clears the prior decision. */
export async function reopenCandidate(formData: FormData): Promise<void> {
  await requireAdmin();
  const service = supabaseService();

  const githubRepoId = parseRepoId(formData);
  if (githubRepoId === null) return;

  const { error } = await service
    .from('ingest_candidates')
    .update({
      status: 'pending',
      decided_by: null,
      decided_at: null,
      rejection_reason: null,
    })
    .eq('github_repo_id', githubRepoId)
    .eq('status', 'rejected');

  if (error) console.error('[admin/queue] reopenCandidate failed:', error.message);
  revalidatePath('/admin/queue');
}
