import type { FixtureAuthor, FixtureProject } from '@/lib/fixtures';
import { languageColor } from '@/lib/lang-colors';
import type { Tables } from '@/lib/supabase/types';

export type ProjectRow = Tables<'projects'>;
type ProfileRow = Tables<'profiles'>;

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Coarse relative-time formatter — day/week/month/year granularity, no
 * minutes/seconds noise (matches the fixture tone: "3 days ago", "2 weeks
 * ago", "1 month ago", "just shipped"). `now` is injectable for tests.
 */
export function formatUpdatedAgo(iso: string, now: Date = new Date()): string {
  const diffSec = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));

  if (diffSec < HOUR) return 'just shipped';
  if (diffSec < DAY) {
    const n = Math.floor(diffSec / HOUR);
    return `${n} hour${n === 1 ? '' : 's'} ago`;
  }
  if (diffSec < WEEK) {
    const n = Math.floor(diffSec / DAY);
    return `${n} day${n === 1 ? '' : 's'} ago`;
  }
  if (diffSec < MONTH) {
    const n = Math.floor(diffSec / WEEK);
    return `${n} week${n === 1 ? '' : 's'} ago`;
  }
  if (diffSec < YEAR) {
    const n = Math.floor(diffSec / MONTH);
    return `${n} month${n === 1 ? '' : 's'} ago`;
  }
  const n = Math.floor(diffSec / YEAR);
  return `${n} year${n === 1 ? '' : 's'} ago`;
}

/**
 * The subset of a `projects` row `projectRowToCard` actually reads. Declared
 * as a `Pick` (rather than the full `ProjectRow`) so both the profile page's
 * full-row select AND the feed's lean `FeedRow` projection (`src/lib/feed/
 * queries.ts` — deliberately omits `readme_html` and friends) satisfy it
 * without a cast; a full row structurally has every field a `Pick` needs.
 */
export type ProjectCardSourceRow = Pick<
  ProjectRow,
  | 'slug'
  | 'name'
  | 'tagline'
  | 'primary_language'
  | 'stars_count'
  | 'likes_count'
  | 'tags'
  | 'screenshots'
  | 'license'
  | 'forks_count'
  | 'demo_url'
  | 'updated_at'
  | 'repo_full_name'
>;

/**
 * Maps a `projects` row to ProjectCard's FixtureProject shape. `authorUsername`
 * is passed separately — the row only carries `profile_id`, and callers
 * (profile/feed pages) already have the author's username in hand.
 *
 * Absence rule (docs/design-system.md): 0 stars/likes render as `null`, never
 * "0" — ProjectCard already gates rendering on `null`.
 */
export function projectRowToCard(
  row: ProjectCardSourceRow,
  authorUsername: string,
  now: Date = new Date(),
): FixtureProject {
  const screenshots = row.screenshots as unknown[] | null;

  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? '',
    language: row.primary_language ?? 'code',
    languageColor: languageColor(row.primary_language),
    stars: row.stars_count > 0 ? row.stars_count : null,
    likes: row.likes_count > 0 ? row.likes_count : null,
    tags: row.tags,
    hasScreenshot: (screenshots?.length ?? 0) > 0,
    repoFullName: row.repo_full_name,
    author: authorUsername,
    license: row.license ?? undefined,
    forks: row.forks_count,
    demoUrl: row.demo_url ?? undefined,
    updatedAgo: formatUpdatedAgo(row.updated_at, now),
  };
}

/**
 * Maps a `profiles` row (or the lean feed join projection — both shapes carry
 * these columns) to ProjectCard's FixtureAuthor. `avatar_url` is accepted for
 * shape-compatibility with those callers but isn't used: FixtureAuthor has no
 * avatar field (ProjectCard renders the initial-letter avatar only; a real
 * image is ProfileHeader's job, which reads avatar_url off the profile row
 * directly). `projects` is always 0 here — ProjectCard never reads it.
 */
export function profileRowToAuthor(
  p: Pick<ProfileRow, 'username' | 'display_name' | 'avatar_url' | 'followers_count'> & {
    bio?: ProfileRow['bio'];
  },
): FixtureAuthor {
  const displayName = p.display_name ?? p.username;

  return {
    username: p.username,
    displayName,
    bio: p.bio ?? '',
    initial: displayName.charAt(0).toLowerCase(),
    projects: 0,
    followers: p.followers_count,
  };
}
