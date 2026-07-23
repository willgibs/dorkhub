import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GithubRepo } from '@/lib/github/client';
import type { Database, TablesInsert } from '@/lib/supabase/types';

/**
 * Shared candidate-writing helper (docs/plans/p1-gallery-engine.md, "Locked
 * architecture" #9 + Wave 2). Every ingestion path — star import (2A), admin
 * queue actions (2B), topic/awesome crawls + manual add (2C) — funnels
 * through this ONE function so the blocklist consent check and the
 * "never silently rewrite a decided row" guard live in exactly one place.
 */

/** GitHub's four candidate-creating origins (mirrors `ingest_candidates.source`'s CHECK constraint). */
export type CandidateSource = 'star_import' | 'topic_crawl' | 'awesome_list' | 'admin_manual';

export type CandidateInput = { repo: GithubRepo; source: CandidateSource };

export type UpsertCandidatesResult = { created: number; touched: number; blocked: number };

/** GitHub's SPDX id for "no machine-detectable license" — not a real license, normalize to null (mirrors src/lib/github/sync.ts). */
const NOASSERTION = 'NOASSERTION';

/** ingest_candidates.description has a 500-char DB constraint — clip before it ever reaches the write. */
const DESCRIPTION_MAX = 500;

/**
 * The refreshable metadata fields — used identically for a brand-new
 * candidate row and for refreshing an existing pending one. Deliberately
 * excludes `source`: a repo's discovery source is "how we first found it",
 * not overwritten by a later crawl that happens to touch the same repo.
 */
function candidateMetadataPatch(repo: GithubRepo) {
  return {
    owner_github_id: repo.owner.id,
    owner_login: repo.owner.login,
    repo_full_name: repo.full_name,
    repo_url: repo.html_url,
    name: repo.name,
    description: repo.description ? repo.description.slice(0, DESCRIPTION_MAX) : null,
    primary_language: repo.language,
    topics: repo.topics,
    license: repo.license?.spdx_id === NOASSERTION ? null : (repo.license?.spdx_id ?? null),
    stars_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Upserts a batch of GitHub repos into `ingest_candidates`, blocklist-checked
 * and status-guarded.
 *
 * Three phases, each batched (never one query per repo):
 * 1. Consent gate — one blocklist query per scope (repo ids, owner ids),
 *    covering the whole batch. Blocked repos are dropped before any write.
 * 2. Split the survivors by prior state — one query reads existing
 *    `(github_repo_id, status)` pairs for the batch: repos with no row yet
 *    are new inserts; repos with a `pending` row get their metadata
 *    refreshed; repos already decided (`approved`/`rejected`/`superseded`)
 *    are left untouched — decisions are sticky (locked architecture #7).
 * 3. Write. New rows go through `.upsert(..., {ignoreDuplicates: true})`
 *    rather than a plain `.insert()`: if a second caller creates the SAME
 *    repo id between this function's read (step 2) and this write — e.g.
 *    two users star-importing the same brand-new repo within milliseconds
 *    of each other — a plain multi-row insert would 23505 the ENTIRE batch.
 *    `ignoreDuplicates` (`INSERT ... ON CONFLICT DO NOTHING`) makes the
 *    loser's row a harmless no-op instead. Existing-pending rows are updated
 *    with a re-checked `.eq('status', 'pending')` guard so a row an admin
 *    decides in that same window is never silently rewritten. Documented
 *    race caveat either way: worst case, one row's metadata refresh is
 *    skipped for this pass and picked up by the next import/crawl that
 *    touches it — never data loss, never a resurrected decided row.
 */
export async function upsertCandidates(
  repos: CandidateInput[],
  service: SupabaseClient<Database>,
): Promise<UpsertCandidatesResult> {
  if (repos.length === 0) return { created: 0, touched: 0, blocked: 0 };

  const repoIds = repos.map(({ repo }) => repo.id);
  const ownerIds = [...new Set(repos.map(({ repo }) => repo.owner.id))];

  // Consent gate (locked architecture #9) — one query per scope for the
  // WHOLE batch, never one query per repo.
  const [{ data: blockedRepoRows }, { data: blockedOwnerRows }] = await Promise.all([
    service
      .from('ingest_blocklist')
      .select('github_repo_id')
      .eq('scope', 'repo')
      .in('github_repo_id', repoIds),
    service
      .from('ingest_blocklist')
      .select('github_owner_id')
      .eq('scope', 'owner')
      .in('github_owner_id', ownerIds),
  ]);
  const blockedRepoIds = new Set((blockedRepoRows ?? []).map((row) => row.github_repo_id));
  const blockedOwnerIds = new Set((blockedOwnerRows ?? []).map((row) => row.github_owner_id));

  const allowed = repos.filter(
    ({ repo }) => !blockedRepoIds.has(repo.id) && !blockedOwnerIds.has(repo.owner.id),
  );
  const blocked = repos.length - allowed.length;
  if (allowed.length === 0) return { created: 0, touched: 0, blocked };

  const allowedIds = allowed.map(({ repo }) => repo.id);
  const { data: existingRows } = await service
    .from('ingest_candidates')
    .select('github_repo_id, status')
    .in('github_repo_id', allowedIds);
  const existingStatus = new Map(
    (existingRows ?? []).map((row) => [row.github_repo_id, row.status]),
  );

  const toInsert: TablesInsert<'ingest_candidates'>[] = [];
  const toUpdate: Array<{
    githubRepoId: number;
    patch: ReturnType<typeof candidateMetadataPatch>;
  }> = [];

  for (const { repo, source } of allowed) {
    const status = existingStatus.get(repo.id);
    if (status === undefined) {
      toInsert.push({ github_repo_id: repo.id, source, ...candidateMetadataPatch(repo) });
    } else if (status === 'pending') {
      toUpdate.push({ githubRepoId: repo.id, patch: candidateMetadataPatch(repo) });
    }
    // else: decided (approved/rejected/superseded) — sticky, never rewritten.
  }

  let created = 0;
  let touched = 0;

  if (toInsert.length > 0) {
    const { data, error } = await service
      .from('ingest_candidates')
      .upsert(toInsert, { onConflict: 'github_repo_id', ignoreDuplicates: true })
      .select('github_repo_id');
    if (error) {
      console.error('[ingest/upsert] candidate insert failed:', error.message);
    } else {
      // Rows that hit the DO-NOTHING branch (the race above) aren't returned
      // by RETURNING — this count is exactly the rows actually created.
      created = data?.length ?? 0;
    }
  }

  if (toUpdate.length > 0) {
    const results = await Promise.all(
      toUpdate.map(({ githubRepoId, patch }) =>
        service
          .from('ingest_candidates')
          .update(patch)
          .eq('github_repo_id', githubRepoId)
          .eq('status', 'pending')
          .select('github_repo_id'),
      ),
    );
    for (const { data, error } of results) {
      if (error) {
        console.error('[ingest/upsert] candidate update failed:', error.message);
        continue;
      }
      touched += data?.length ?? 0;
    }
  }

  return { created, touched, blocked };
}
