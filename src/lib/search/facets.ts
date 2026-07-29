import { resolveTagSlug } from '@/lib/tags/slug';

/**
 * Pure facet helpers, deliberately NOT in `queries.ts` — that module is
 * `server-only`, and the /search island needs `collectFacetOptions` as a
 * VALUE (a type-only import wouldn't do). Nothing here touches IO or the
 * database, so it is safe on both sides.
 */

/** Normalized, validated facet state. All fields null/false = unfiltered. */
export type SearchFacets = {
  language: string | null;
  tag: string | null;
  minStars: number | null;
  hasDemo: boolean;
};

export const EMPTY_FACETS: SearchFacets = {
  language: null,
  tag: null,
  minStars: null,
  hasDemo: false,
};

/** Star thresholds offered as chips. Presets rather than a free number so the URL space stays small and cacheable. */
export const STAR_BUCKETS = [100, 1000, 10000] as const;

/**
 * Normalizes raw facet params (straight off a URL — untrusted). Never throws:
 * anything malformed degrades to "not filtered" rather than erroring a search.
 *
 * `tag` goes through `resolveTagSlug`, the same validator `/t/[tag]` uses,
 * whose documented contract is that a valid slug is safe to `.contains()` — so
 * a crafted value cannot reach PostgREST's filter grammar. `language` is
 * matched with `.eq()` against a generated column, which is likewise inert.
 */
export function resolveSearchFacets(raw: {
  language?: string | null;
  tag?: string | null;
  stars?: string | number | null;
  demo?: string | null;
}): SearchFacets {
  const language = (raw.language ?? '').trim().toLowerCase();
  const starsNum =
    typeof raw.stars === 'number' ? raw.stars : Number.parseInt(String(raw.stars ?? ''), 10);

  return {
    language: language.length > 0 ? language : null,
    tag: raw.tag ? resolveTagSlug(String(raw.tag).trim()) : null,
    minStars: Number.isFinite(starsNum) && starsNum > 0 ? Math.trunc(starsNum) : null,
    hasDemo: raw.demo === '1' || raw.demo === 'true',
  };
}

export type FacetOption = { value: string; label: string; count: number };

/** Structural, so this stays decoupled from the server-only result type. */
type FacetSource = {
  language_slug: string | null;
  primary_language: string | null;
  tags: string[];
};

/**
 * Derives the language and tag refinements available for a result set, most
 * common first, ties broken alphabetically so the order is stable.
 *
 * These describe the CURRENT query's matches, not the whole corpus — which is
 * what a refinement UI should offer. The caller is responsible for remembering
 * the UNFACETED set, or picking "Rust" deletes every other language from the
 * UI and the only way back is the browser Back button.
 */
export function collectFacetOptions(projects: readonly FacetSource[]): {
  languages: FacetOption[];
  tags: FacetOption[];
} {
  const languages = new Map<string, FacetOption>();
  const tags = new Map<string, FacetOption>();

  for (const project of projects) {
    if (project.language_slug && project.primary_language) {
      const existing = languages.get(project.language_slug);
      if (existing) existing.count += 1;
      else {
        languages.set(project.language_slug, {
          value: project.language_slug,
          label: project.primary_language,
          count: 1,
        });
      }
    }
    for (const tag of project.tags) {
      const existing = tags.get(tag);
      if (existing) existing.count += 1;
      else tags.set(tag, { value: tag, label: tag, count: 1 });
    }
  }

  const byCount = (a: FacetOption, b: FacetOption) =>
    b.count - a.count || a.label.localeCompare(b.label);

  return {
    languages: [...languages.values()].sort(byCount),
    tags: [...tags.values()].sort(byCount),
  };
}
