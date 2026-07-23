import type { GithubRepo } from '@/lib/github/client';

/**
 * Pure decision core for the stars-import flow (see docs/plans/p1-gallery-
 * engine.md, "Locked architecture" #6). Every branch below encodes a locked
 * precedence rule from that plan — no network, no DB, so the full matrix
 * (including precedence conflicts) is unit-testable without mocking IO.
 */

/** Everything `decideStarImport` needs about the viewer + prior state to classify one starred repo. */
export type StarImportContext = {
  viewerGithubId: number;
  isBlocklisted: boolean;
  existingProjectId: string | null;
};

export type StarImportAction =
  | { kind: 'own_unlisted' }
  | { kind: 'blocked' }
  | { kind: 'save'; projectId: string }
  | { kind: 'filtered_fork' }
  | { kind: 'candidate' };

/**
 * Classifies one starred repo during import. Decision order is locked and
 * must not be reordered — each step below is a real precedence decision, not
 * an arbitrary check order:
 *
 * 1. Own repo the viewer hasn't listed yet → nudge to list it (`own_unlisted`).
 *    An own repo that IS already listed (`existingProjectId` set) deliberately
 *    falls through to step 3 — a user saving their own listed project is a
 *    normal save, not a self-referential nudge.
 * 2. Blocklisted → `blocked`, even ahead of "already listed" — a blocklisted
 *    repo/owner must never resurface via saves either.
 * 3. Already a project on dorkhub → `save` (instant gratification; no
 *    candidate-queue involvement).
 * 4. Fork or archived → `filtered_fork`. Archived repos are filtered under
 *    the same tally as forks: neither is an actively maintained original
 *    project worth curating, even though "archived" isn't literally a fork.
 * 5. Everything else → `candidate`, queued for admin review.
 */
export function decideStarImport(repo: GithubRepo, ctx: StarImportContext): StarImportAction {
  if (repo.owner.id === ctx.viewerGithubId && !ctx.existingProjectId) {
    return { kind: 'own_unlisted' };
  }

  if (ctx.isBlocklisted) {
    return { kind: 'blocked' };
  }

  if (ctx.existingProjectId) {
    return { kind: 'save', projectId: ctx.existingProjectId };
  }

  if (repo.fork || repo.archived) {
    return { kind: 'filtered_fork' };
  }

  return { kind: 'candidate' };
}

/** Maps a decision to the tally bucket the import UI accumulates live counts into. */
export function tallyKey(
  action: StarImportAction,
): 'own' | 'blocked' | 'here' | 'filtered' | 'queued' {
  switch (action.kind) {
    case 'own_unlisted':
      return 'own';
    case 'blocked':
      return 'blocked';
    case 'save':
      return 'here';
    case 'filtered_fork':
      return 'filtered';
    case 'candidate':
      return 'queued';
    default: {
      const exhaustive: never = action;
      throw new Error(`unhandled StarImportAction: ${JSON.stringify(exhaustive)}`);
    }
  }
}
