/**
 * Builds a GitHub-hosted og:image hotlink for a repo's social preview card
 * (docs/plans/p2-discovery.md Wave 1A, decision 2). Pure — no IO. The URL is
 * built from our own DB's `projects.repo_full_name` (NOT NULL) — never a
 * user-supplied URL — so no allowlist is needed; each path segment is still
 * `encodeURIComponent`-ed defensively before being joined back together.
 */
export function githubOgImageUrl(repoFullName: string): string {
  const encodedPath = repoFullName.split('/').map(encodeURIComponent).join('/');
  return `https://opengraph.githubassets.com/dorkhub/${encodedPath}`;
}
