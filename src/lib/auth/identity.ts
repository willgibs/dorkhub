import type { User } from '@supabase/supabase-js';

export type GithubIdentity = {
  /**
   * GitHub's immutable NUMERIC user id — the ONLY valid identity/claim key.
   * Usernames are mutable and re-registerable; never key on them
   * (docs/architecture.md, "Ownership model").
   */
  githubId: number;
  /** Mutable login, display only. */
  login: string | null;
};

/** Extracts the GitHub identity from a Supabase auth user, or null if absent. */
export function githubIdentity(user: User): GithubIdentity | null {
  const identity = user.identities?.find((i) => i.provider === 'github');
  const rawId = identity?.id ?? (user.user_metadata?.provider_id as string | undefined);
  if (!rawId) return null;
  const githubId = Number(rawId);
  if (!Number.isSafeInteger(githubId) || githubId <= 0) return null;
  const login =
    (identity?.identity_data?.user_name as string | undefined) ??
    (user.user_metadata?.user_name as string | undefined) ??
    null;
  return { githubId, login };
}
