import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildEnrichmentPrompt, parseEnrichmentResult } from '@/lib/ai/enrich';
import { AiConfigError, chatCompletion } from '@/lib/ai/gateway';
import { validateUsername } from '@/lib/auth/usernames';
import type { GithubRepo } from '@/lib/github/client';
import { getReadmeRaw, getRepoById } from '@/lib/github/client';
import { syncProject } from '@/lib/github/sync';
import { isValidDemoUrl, parseTagsInput } from '@/lib/projects/fields';
import { generateProjectSlug } from '@/lib/projects/slug';
import { supabaseService } from '@/lib/supabase/clients';
import type { Database } from '@/lib/supabase/types';

/**
 * The materializer library (docs/plans/p2.5-self-running.md, Wave 1A).
 * `materializeCandidate` is `src/app/(app)/admin/queue/actions.ts`'s
 * `approveCandidate` steps 2–14 (pending pre-check through retroactive
 * saves), extracted VERBATIM in logic, with two changes: it returns a
 * discriminated result instead of `redirect()`ing, and it carries the
 * NEW behaviors called out below. This is the ONE place both the human
 * approve action (Wave 2A, `decidedBy` = admin, `inlineEnrich: true`) and
 * the automated pipeline cron (Wave 2B, `decidedBy: null`, `inlineEnrich:
 * false`) call to turn a pending `ingest_candidates` row into a published
 * `projects` row. No `redirect`/`revalidatePath`/`formData` here — those are
 * caller concerns (Next.js server-action/route-handler surfaces only).
 */

/** GitHub's SPDX id for "no machine-detectable license" — mirrors src/lib/github/sync.ts, src/lib/ingest/upsert.ts. */
const NOASSERTION = 'NOASSERTION';

/** Same token budget as admin/queue's `enrichCandidatesPage` — a tagline + up to 6 tags is short. */
const ENRICHMENT_MAX_TOKENS = 300;

/**
 * GitHub description → tagline, within the DB's 120-char check. Approved
 * projects must never land as bare cards — the gallery's first impression is
 * the product (first-user QA, 2026-07-23).
 *
 * CANONICAL HOME: this function lives here now. `admin/queue/actions.ts`
 * still has its own copy (Wave 2A rewires that file to re-import from here
 * instead — until then the duplicate is intentional, not drift).
 */
export function descriptionToTagline(description: string | null): string | null {
  const trimmed = description?.trim() ?? '';
  if (!trimmed) return null;
  return trimmed.length > 120 ? `${trimmed.slice(0, 119).trimEnd()}…` : trimmed;
}

/** The subset of an `ingest_candidates` row `deriveContent` reads from. */
export type DeriveContentCandidate = { ai_tagline: string | null; ai_tags: string[] };

/**
 * Pure content-precedence helper — real human/GitHub data always wins over
 * AI guesses (locked decision #5: "ai_* precedence... stays in core
 * unconditionally"). Real description beats `ai_tagline`; real topics beat
 * `ai_tags`. `candidate.ai_*` was normalized once already (`parseEnrichmentResult`),
 * but tags run through `parseTagsInput` again here — same idiom as `ghTags`,
 * harmless on already-clean input, and keeps one normalization path for
 * every tag source that reaches a project row.
 */
export function deriveContent(
  repo: Pick<GithubRepo, 'description' | 'topics'>,
  candidate: DeriveContentCandidate,
): { tagline: string | null; tags: string[] } {
  const ghTags = parseTagsInput(repo.topics.join(', '));
  const tagline = descriptionToTagline(repo.description) ?? candidate.ai_tagline ?? null;
  const tags = ghTags.length > 0 ? ghTags : parseTagsInput(candidate.ai_tags.join(', '));
  return { tagline, tags };
}

/** One `materializeCandidate` call's outcome. */
export type MaterializeResult =
  | {
      kind: 'published';
      projectId: string;
      projectSlug: string;
      profileUsername: string;
      savesCreated: number;
      inlineAiTagline: string | null;
    }
  | { kind: 'already_decided' }
  /** rate-limit/config/transient GitHub failure — candidate untouched, caller should stop its batch. */
  | { kind: 'github_unavailable' }
  /** auto-rejected: `rejection_reason: 'auto: repo unavailable at approval time'`, `decided_by: opts.decidedBy`. */
  | { kind: 'repo_gone' }
  /** auto-rejected: `rejection_reason: 'auto: blocklisted'`. */
  | { kind: 'blocklisted' }
  /** candidate left pending — no auto-creatable profile for this GitHub login. */
  | { kind: 'invalid_username'; reason: string }
  /** candidate left pending — username squatted by a different existing profile. */
  | { kind: 'username_taken'; username: string }
  | { kind: 'insert_failed' };

export type MaterializeOpts = {
  /** `admin.profileId` for a human approve; `null` for the automated pipeline. */
  decidedBy: string | null;
  /**
   * Decision #5 — inline AI enrichment fallback opt-in. Human approve passes
   * `true` (matches `approveCandidate`'s existing banner-visible behavior);
   * the pipeline + import phase-2 pass `false` (no unpaced AI call inside
   * materialization — enrichment there is `enrichNextBatch`'s paced job).
   * Defaults to `false` when omitted.
   */
  inlineEnrich?: boolean;
};

/**
 * Turns one pending `ingest_candidates` row into a published `projects` row
 * (or a terminal/no-op outcome — see `MaterializeResult`). See the file
 * header for the origin (`approveCandidate`) and the shared-caller contract.
 */
export async function materializeCandidate(
  githubRepoId: number,
  opts: MaterializeOpts,
  service: SupabaseClient<Database> = supabaseService(),
): Promise<MaterializeResult> {
  const { data: candidate } = await service
    .from('ingest_candidates')
    .select('github_repo_id, ai_tagline, ai_tags')
    .eq('github_repo_id', githubRepoId)
    .eq('status', 'pending')
    .maybeSingle();
  if (!candidate) return { kind: 'already_decided' }; // already decided elsewhere, or a stale double-submit

  // Fresh fetch — candidate rows are disposable snapshots, never trusted at
  // write time (locked arch #2, p1-gallery-engine.md).
  let repoResult: Awaited<ReturnType<typeof getRepoById>>;
  try {
    repoResult = await getRepoById(githubRepoId);
  } catch (err) {
    // GithubConfigError (missing GITHUB_TOKEN) — candidate stays pending, caller retries.
    console.error('[ingest/materialize] repo fetch unavailable:', err);
    return { kind: 'github_unavailable' };
  }

  if (repoResult.kind === 'not_found') {
    const { error } = await service
      .from('ingest_candidates')
      .update({
        status: 'rejected',
        rejection_reason: 'auto: repo unavailable at approval time',
        decided_by: opts.decidedBy,
        decided_at: new Date().toISOString(),
      })
      .eq('github_repo_id', githubRepoId);
    if (error) console.error('[ingest/materialize] auto-reject (not_found) failed:', error.message);
    return { kind: 'repo_gone' };
  }
  if (repoResult.kind !== 'ok') {
    // Covers rate_limited/error (not_modified can't happen — this call never sends an etag).
    return { kind: 'github_unavailable' };
  }
  const repo = repoResult.data;

  // Blocklist can change between candidate creation and this call — re-check
  // fresh. Consent is checked on EVERY candidate-creating/-materializing path
  // (locked arch #9, p1-gallery-engine.md).
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
        decided_by: opts.decidedBy,
        decided_at: new Date().toISOString(),
      })
      .eq('github_repo_id', githubRepoId);
    if (error) console.error('[ingest/materialize] auto-reject (blocklist) failed:', error.message);
    return { kind: 'blocklisted' };
  }

  // Upsert the unclaimed owner profile — N repos under one owner collapse to
  // one profile (locked arch #4, p1-gallery-engine.md).
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
      return { kind: 'invalid_username', reason: usernameCheck.reason };
    }

    const { data: insertedProfile, error: profileInsertError } = await service
      .from('profiles')
      .insert({
        username: usernameCheck.value,
        display_name: repo.owner.login,
        github_id: repo.owner.id,
        github_username: repo.owner.login,
        // claimed_at stays null (column default) — unclaimed seeded profile
        // until the real owner signs in via the claim flow, NOT
        // an onboarding-style self-claim.
      })
      .select('id, username')
      .single();

    if (insertedProfile) {
      profileId = insertedProfile.id;
      profileUsername = insertedProfile.username;
    } else if (profileInsertError?.code === '23505') {
      // Decision #4 (NEW behavior vs approveCandidate) — a 23505 here can
      // mean a CONCURRENT materializer won the github_id race between our
      // SELECT above and this INSERT: the pipeline can process two
      // candidates under the same brand-new owner in the same invocation
      // (approveCandidate never hit this — an admin approves one row at a
      // time). Re-select by github_id before giving up: if a row exists now,
      // it's the race winner's row — use it and continue.
      const { data: raceWinner } = await service
        .from('profiles')
        .select('id, username')
        .eq('github_id', repo.owner.id)
        .maybeSingle();
      if (!raceWinner) {
        // Genuinely the USERNAME unique constraint: a different existing
        // profile squats this login (e.g. a GitHub handle that changed
        // hands). Don't guess who "wins" — leave the candidate pending for
        // manual resolution.
        console.error(
          '[ingest/materialize] profile insert 23505, no github_id race winner:',
          profileInsertError,
        );
        return { kind: 'username_taken', username: usernameCheck.value };
      }
      profileId = raceWinner.id;
      profileUsername = raceWinner.username;
    } else {
      console.error('[ingest/materialize] profile insert failed:', profileInsertError);
      return { kind: 'username_taken', username: usernameCheck.value };
    }
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

  // Curated-content mapping (first-user QA, 2026-07-23; extended for AI
  // enrichment, locked decision #5): real human data always wins.
  let { tagline, tags } = deriveContent(repo, candidate);

  // Inline fallback (decision #5 — opt-in, NOT unconditional): only when the
  // caller asked for it AND queue-time enrichment never ran (or came up
  // empty) AND the fresh repo itself has neither a description nor topics —
  // i.e. there is truly nothing better to fall back on. One best-effort try;
  // ANY failure (including AiConfigError, caught right here) proceeds with
  // nulls — this must never fail materialization. The og image + repo name
  // still carry the card either way.
  let inlineAiTagline: string | null = null;
  const repoHasNoContent = !repo.description?.trim() && repo.topics.length === 0;
  if (opts.inlineEnrich === true && tagline === null && tags.length === 0 && repoHasNoContent) {
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
              '[ingest/materialize] inline enrichment audit write failed:',
              enrichWriteError.message,
            );
          }
        }
      }
      // chatResult.kind === 'rate_limited' | 'error' — swallowed, publish with nulls.
    } catch (err) {
      // Covers AiConfigError (no key configured) and any other throw.
      if (err instanceof AiConfigError) {
        console.error('[ingest/materialize] inline enrichment not configured:', err.message);
      } else {
        console.error(
          '[ingest/materialize] inline enrichment fallback failed (publishing with nulls):',
          err,
        );
      }
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
      // the queue, or — new in the pipeline era — a double-firing cron
      // invocation raced this same row; `trg_projects_supersede_candidate`
      // already flipped the candidate to 'superseded' either way). Re-point
      // rather than fail. Select slug too — it's THEIR slug, not the one
      // generated above.
      const { data: existingProject } = await service
        .from('projects')
        .select('id, slug')
        .eq('github_repo_id', repo.id)
        .maybeSingle();
      if (!existingProject) {
        console.error('[ingest/materialize] 23505 recovery found no existing row:', insertError);
        return { kind: 'insert_failed' };
      }
      projectId = existingProject.id;
      projectSlug = existingProject.slug;
    } else {
      console.error('[ingest/materialize] project insert failed:', insertError);
      return { kind: 'insert_failed' };
    }
  } else {
    projectId = insertedProject.id;
    projectSlug = insertedProject.slug;
  }

  // Best-effort initial sync — never blocks materialization (mirrors createProject).
  try {
    await syncProject(projectId);
  } catch (err) {
    console.error('[ingest/materialize] initial sync threw:', err);
  }

  // Decision #3 (supersede-trigger invariant) — this write is DELIBERATELY
  // unconditional on `github_repo_id` alone. NO `.eq('status', 'pending')`
  // guard. Our own project INSERT above already fired
  // `trg_projects_supersede_candidate`, flipping this candidate row from
  // 'pending' to 'superseded' as a SIDE EFFECT of that insert — this write
  // intentionally overwrites that side effect with the REAL outcome
  // ('approved'). Adding a status guard back would silently no-op on every
  // single materialized row (the trigger already moved it off 'pending'
  // before this UPDATE runs), stranding every one of them at 'superseded'
  // forever and emptying the retro queue's bookkeeping (`approved ∧
  // decided_by IS NULL ∧ stars < threshold` — a 'superseded' row matches
  // neither). DO NOT add a status guard here.
  const { error: decideError } = await service
    .from('ingest_candidates')
    .update({
      status: 'approved',
      decided_by: opts.decidedBy,
      decided_at: new Date().toISOString(),
      materialized_project_id: projectId,
    })
    .eq('github_repo_id', githubRepoId);
  if (decideError) {
    console.error('[ingest/materialize] candidate decision write failed:', decideError.message);
  }

  // Retroactive saves: everyone who already starred this while it was a
  // candidate gets instant gratification (locked arch #4, p1-gallery-
  // engine.md). Batched upsert with ON CONFLICT DO NOTHING — safe even
  // against the 23505-recovery path reusing an already-live, already-saved
  // project. RETURNING only reports the rows PostgREST actually inserted
  // (conflicted rows are silently skipped), so `.select().length` IS the
  // real "created" count.
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
      console.error('[ingest/materialize] retroactive saves failed:', savesError.message);
    }
    savesCreated = insertedSaves?.length ?? 0;
  }

  return {
    kind: 'published',
    projectId,
    projectSlug,
    profileUsername,
    savesCreated,
    inlineAiTagline,
  };
}
