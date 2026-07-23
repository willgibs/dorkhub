import 'server-only';

import { sanitizeReadmeHtml } from '@/lib/github/sanitize';
import { isValidDemoUrl } from '@/lib/projects/fields';
import { supabaseService } from '@/lib/supabase/clients';
import type { TablesUpdate } from '@/lib/supabase/types';
import type { GithubRepo, GithubResult } from './client';
import { getReadmeHtml, getRepoById } from './client';

/**
 * Turns a repo/README fetch pair into a DB patch — the pure decision core of
 * project sync (see docs/plans/m4-projects.md, Wave 2D). No network, no DB:
 * every branch below encodes a locked decision from that plan so the matrix
 * is unit-testable without mocking IO.
 */

/** Last-known-good state read from the `projects` row before syncing. */
export type SyncInput = {
  githubRepoId: number;
  repoEtag: string | null;
  readmeEtag: string | null;
  /** last-known-good "owner/name" — used as the README sanitizer fallback. */
  repoFullName: string;
  /**
   * Current demo_url — sync FILLS this from repo.homepage only when null
   * (P2.5.1): fast-path materialization skips the fresh repo fetch, and
   * candidates don't snapshot homepage, so the first sync heals it. Never
   * overwrites — owners can edit demo_url and sync must not fight them.
   */
  demoUrl: string | null;
};

export type SyncPatch = {
  patch: Record<string, unknown>;
  /**
   * Whether the caller should stamp `last_synced_at`. Kept OUT of the patch
   * itself (and the timestamp construction out of this function entirely) so
   * this stays pure/deterministic for tests — the IO shell adds the actual
   * `new Date().toISOString()` value.
   */
  bumpSyncedAt: boolean;
};

/** GitHub's SPDX id for "no machine-detectable license" — not a real license, normalize to null. */
const NOASSERTION = 'NOASSERTION';

/** GitHub raw-content URLs accept `HEAD` as a ref, so it's a safe branch fallback when we have no fresh `default_branch` to sync with (repo fetch didn't return `ok`). */
const FALLBACK_BRANCH = 'HEAD';

function repoMetadataPatch(repo: GithubRepo, etag: string | null): Record<string, unknown> {
  return {
    repo_etag: etag,
    repo_full_name: repo.full_name,
    repo_url: repo.html_url,
    name: repo.name,
    primary_language: repo.language,
    topics: repo.topics,
    stars_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    // NOASSERTION means GitHub couldn't detect a license, not that one exists — treat as absent.
    license: repo.license?.spdx_id === NOASSERTION ? null : (repo.license?.spdx_id ?? null),
  };
}

export function computeSyncUpdate(
  current: SyncInput,
  repoResult: GithubResult<GithubRepo>,
  readmeResult: GithubResult<string> | null,
): SyncPatch {
  const patch: Record<string, unknown> = {};

  // Fresh full_name/branch when the repo call actually returned data; otherwise
  // fall back to last-known-good repoFullName + the HEAD ref (see FALLBACK_BRANCH).
  const readmeSanitizeOpts =
    repoResult.kind === 'ok'
      ? { repoFullName: repoResult.data.full_name, branch: repoResult.data.default_branch }
      : { repoFullName: current.repoFullName, branch: FALLBACK_BRANCH };

  let bumpSyncedAt: boolean;

  switch (repoResult.kind) {
    case 'ok':
      Object.assign(patch, repoMetadataPatch(repoResult.data, repoResult.etag));
      // Fill-only demo_url (P2.5.1): heal fast-path materializations (no
      // homepage in candidate snapshots) without ever clobbering an
      // owner-edited value.
      if (
        current.demoUrl === null &&
        repoResult.data.homepage &&
        isValidDemoUrl(repoResult.data.homepage)
      ) {
        patch.demo_url = repoResult.data.homepage;
      }
      bumpSyncedAt = true;
      break;
    case 'not_modified':
      // No repo-metadata fields — nothing changed upstream.
      bumpSyncedAt = true;
      break;
    case 'not_found':
      // Dead/renamed-away/private repo: keep last-known-good display data (no
      // repo-metadata fields patched) but still bump last_synced_at — otherwise
      // a dead repo would pin itself at the front of the cron's stalest-first
      // queue forever instead of round-robining with everything else.
      console.error('[sync] repo not_found', { githubRepoId: current.githubRepoId });
      bumpSyncedAt = true;
      break;
    case 'rate_limited':
    case 'error':
      // Transient failure — retry next run, don't touch anything (including
      // the sync clock, so this project comes up again promptly).
      bumpSyncedAt = false;
      break;
    default:
      bumpSyncedAt = false;
  }

  // Readme failure alone never flips bumpSyncedAt to false — the repo result
  // is the primary freshness signal; a README-only hiccup shouldn't pin the
  // cron queue when the repo metadata itself synced fine.
  if (readmeResult) {
    switch (readmeResult.kind) {
      case 'ok':
        patch.readme_html = sanitizeReadmeHtml(readmeResult.data, readmeSanitizeOpts);
        patch.readme_etag = readmeResult.etag;
        break;
      case 'not_modified':
        // No readme fields — unchanged upstream.
        break;
      case 'not_found':
        // Repo genuinely has no README — graceful absence, not an error.
        patch.readme_html = null;
        patch.readme_etag = null;
        break;
      case 'rate_limited':
      case 'error':
        // No readme fields — retry next run.
        break;
      default:
        break;
    }
  }

  return { patch, bumpSyncedAt };
}

export type SyncOutcome = 'synced' | 'not_modified' | 'not_found' | 'rate_limited' | 'error';

/**
 * IO shell around `computeSyncUpdate`: reads the project row, fetches fresh
 * repo + README data from GitHub, computes the patch, and writes it back —
 * all through the service-role client (sync columns are service-role-only,
 * see docs/architecture.md "GitHub integration").
 */
export async function syncProject(
  projectId: string,
  opts?: { fetchImpl?: typeof fetch },
): Promise<{ status: SyncOutcome; detail?: string }> {
  const service = supabaseService();

  const { data: project, error: selectError } = await service
    .from('projects')
    .select('id, github_repo_id, repo_etag, readme_etag, repo_full_name, demo_url')
    .eq('id', projectId)
    .maybeSingle();

  if (selectError) {
    console.error('[sync] failed to read project', { projectId, message: selectError.message });
    return { status: 'error', detail: selectError.message };
  }
  if (!project) {
    return { status: 'error', detail: 'project not found' };
  }

  let repoResult: GithubResult<GithubRepo>;
  let readmeResult: GithubResult<string> | null = null;
  try {
    repoResult = await getRepoById(project.github_repo_id, {
      etag: project.repo_etag,
      fetchImpl: opts?.fetchImpl,
    });

    if (repoResult.kind === 'ok' || repoResult.kind === 'not_modified') {
      // Fresh owner/name when the repo call returned data (renames self-heal),
      // else fall back to the last-known-good full_name we already have stored.
      const fullName =
        repoResult.kind === 'ok' ? repoResult.data.full_name : project.repo_full_name;
      const separatorIndex = fullName.indexOf('/');
      const owner = separatorIndex === -1 ? fullName : fullName.slice(0, separatorIndex);
      const name = separatorIndex === -1 ? '' : fullName.slice(separatorIndex + 1);

      readmeResult = await getReadmeHtml(owner, name, {
        etag: project.readme_etag,
        fetchImpl: opts?.fetchImpl,
      });
    }
  } catch (err) {
    // GithubConfigError (missing GITHUB_TOKEN) — callers get a plain error
    // outcome instead of a thrown 500; nothing is written, cron retries later.
    console.error('[sync] github unavailable', { projectId, err });
    return { status: 'error', detail: err instanceof Error ? err.message : String(err) };
  }

  const { patch, bumpSyncedAt } = computeSyncUpdate(
    {
      githubRepoId: project.github_repo_id,
      repoEtag: project.repo_etag,
      readmeEtag: project.readme_etag,
      repoFullName: project.repo_full_name,
      demoUrl: project.demo_url,
    },
    repoResult,
    readmeResult,
  );

  if (bumpSyncedAt) {
    patch.last_synced_at = new Date().toISOString();
  }

  if (Object.keys(patch).length > 0) {
    const { error: updateError } = await service
      .from('projects')
      .update(patch as TablesUpdate<'projects'>)
      .eq('id', projectId);
    if (updateError) {
      console.error('[sync] failed to write project patch', {
        projectId,
        message: updateError.message,
      });
      return { status: 'error', detail: updateError.message };
    }
  }

  switch (repoResult.kind) {
    case 'ok':
      return { status: 'synced' };
    case 'not_modified':
      // A 304 on the repo doesn't mean nothing changed: the README can still
      // have changed independently, and that IS content the visitor sees —
      // so a fresh README counts as a 'synced' outcome even though the repo
      // metadata itself didn't move.
      return { status: readmeResult?.kind === 'ok' ? 'synced' : 'not_modified' };
    case 'not_found':
      return { status: 'not_found' };
    case 'rate_limited':
      return { status: 'rate_limited' };
    default:
      return {
        status: 'error',
        detail: repoResult.kind === 'error' ? repoResult.message : undefined,
      };
  }
}
