'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { TagChip } from '@/components/tag-chip';
import { Input } from '@/components/ui/input';
import { copy } from '@/lib/copy';
// `import type` from a `server-only` module is erased at compile time, so
// nothing reaches the client bundle — and it means there is exactly ONE
// definition of the response shape (the palette used to hand-mirror it and
// drifted). A value import here would fail loudly, which is the point.
import { collectFacetOptions, type FacetOption, STAR_BUCKETS } from '@/lib/search/facets';
import type { SearchResults } from '@/lib/search/queries';

const EMPTY: SearchResults = { projects: [], profiles: [], tags: [] };

/** Matches SEARCH_PROJECT_LIMIT_MAX. Results are capped by relevance, not paginated (D25). */
const PAGE_PROJECT_LIMIT = 48;

const DEBOUNCE_MS = 150;

const rowLink =
  'block rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * The whole of `/search`'s behaviour. Reads `?q=` with `useSearchParams()` so
 * the enclosing route stays statically prerendered (D27), and mirrors typing
 * back into the URL so a result set is shareable.
 *
 * The fetch loop is lifted from the command palette rather than reinvented:
 * debounce, an AbortController that cancels a still-in-flight request, and a
 * `settled` flag so "nothing found" can't flash while a request is in the air.
 */
export function SearchResultsIsland() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [settled, setSettled] = useState(false);
  const [limited, setLimited] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const lang = searchParams.get('lang') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const stars = searchParams.get('stars') ?? '';
  const demo = searchParams.get('demo') ?? '';

  /**
   * Refinements are derived from the UNFACETED response and remembered. If they
   * were read from the current (already-narrowed) results, picking "Rust" would
   * delete every other language from the UI — the classic faceted-search dead
   * end where the only way out is the browser Back button.
   */
  const vocabRef = useRef<{ languages: FacetOption[]; tags: FacetOption[] }>({
    languages: [],
    tags: [],
  });
  if (!lang && !tag && results.projects.length > 0) {
    vocabRef.current = collectFacetOptions(results.projects);
  }
  const vocab = vocabRef.current;

  /**
   * An ACTIVE language always gets a chip, even when it isn't in the
   * remembered vocabulary — which is exactly what happens when someone lands
   * on a shared `?lang=` URL, since no unfaceted response was ever seen.
   * Without this the filter is applied but invisible: you can see it worked
   * and have no way to switch or remove it.
   */
  const languageOptions =
    lang && !vocab.languages.some((option) => option.value === lang)
      ? [{ value: lang, label: lang, count: 0 }, ...vocab.languages]
      : vocab.languages;

  // Keep the URL in step with the input, but with `replace` — a history entry
  // per keystroke would make Back unusable.
  useEffect(() => {
    const trimmed = query.trim();
    const current = searchParams.get('q') ?? '';
    if (trimmed === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (trimmed) next.set('q', trimmed);
      else next.delete('q');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, searchParams, router, pathname]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setResults(EMPTY);
      setSettled(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed, limit: String(PAGE_PROJECT_LIMIT) });
        if (lang) params.set('lang', lang);
        if (tag) params.set('tag', tag);
        if (stars) params.set('stars', stars);
        if (demo) params.set('demo', demo);
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const data: SearchResults = response.ok ? await response.json() : EMPTY;
        if (!controller.signal.aborted) {
          // A 429 is the rate limiter speaking (P4) — same empty shape, but
          // the empty state must say so instead of pretending "no results".
          setLimited(response.status === 429);
          setResults(data);
          setSettled(true);
        }
      } catch {
        // Abort is the common path here (every keystroke cancels the last
        // request); a real failure degrades to "nothing found" rather than
        // breaking the page.
        if (!controller.signal.aborted) {
          setLimited(false);
          setResults(EMPTY);
          setSettled(true);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, lang, tag, stars, demo]);

  const total = results.projects.length + results.profiles.length + results.tags.length;
  const capped = results.projects.length >= PAGE_PROJECT_LIMIT;
  const facetsActive = Boolean(lang || tag || stars || demo);

  function setFacet(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function clearFacets() {
    const next = new URLSearchParams();
    const currentQ = searchParams.get('q');
    if (currentQ) next.set('q', currentQ);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const chip = (active: boolean) =>
    `rounded-lg border px-[11px] py-[5px] font-mono text-[12.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px ${
      active
        ? 'border-primary/40 bg-accent text-foreground'
        : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
    }`;

  return (
    <div className="flex w-full max-w-[780px] flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          autoComplete="off"
          // Autofocus is right here and nowhere else: arriving at /search is an
          // explicit act, unlike the palette which is summoned over other work.
          // biome-ignore lint/a11y/noAutofocus: the page exists to be typed into
          autoFocus
          aria-label={copy.searchTitle}
        />
        <p className="font-mono text-[12.5px] text-muted-foreground">{copy.searchScopeNote}</p>
      </div>

      {/* Facets narrow the query IN SQL (applyFacets), never the returned set —
          filtering 48 already-capped rows down to "Rust only" would show
          whichever handful happened to land in those 48. */}
      {query.trim().length >= 2 && (languageOptions.length > 0 || facetsActive) ? (
        <div className="flex flex-col gap-2">
          {languageOptions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {copy.searchFilterLanguage}
              </span>
              {languageOptions.slice(0, 8).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={chip(lang === option.value)}
                  onClick={() => setFacet('lang', lang === option.value ? null : option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {copy.searchFilterStars}
            </span>
            {STAR_BUCKETS.map((bucket) => (
              <button
                key={bucket}
                type="button"
                className={chip(stars === String(bucket))}
                onClick={() => setFacet('stars', stars === String(bucket) ? null : String(bucket))}
              >
                {bucket >= 1000 ? `${bucket / 1000}k+` : `${bucket}+`}
              </button>
            ))}
            <button
              type="button"
              className={chip(demo === '1')}
              onClick={() => setFacet('demo', demo === '1' ? null : '1')}
            >
              {copy.searchFilterDemo}
            </button>
            {facetsActive ? (
              <button type="button" className={chip(false)} onClick={clearFacets}>
                {copy.searchFilterClear}
              </button>
            ) : null}
          </div>

          {tag ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {copy.searchFilterTag}
              </span>
              <button type="button" className={chip(true)} onClick={() => setFacet('tag', null)}>
                #{tag}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {query.trim().length < 2 ? (
        <p className="text-[15px] text-muted-foreground">{copy.searchStart}</p>
      ) : settled && total === 0 ? (
        <EmptyState message={limited ? copy.searchRateLimited : copy.searchEmpty} />
      ) : (
        <div className="flex flex-col gap-8">
          {results.projects.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <span aria-hidden="true">{'// '}</span>
                {copy.searchGroupProjects}
              </h2>
              <ul className="flex flex-col divide-y divide-border">
                {results.projects.map((project) => (
                  <li key={project.id} className="py-3">
                    <Link
                      href={`/u/${project.profiles.username}/${project.slug}`}
                      className={rowLink}
                    >
                      <span className="font-mono text-[15px] font-semibold">{project.name}</span>
                      <span className="ml-2 font-mono text-[12.5px] text-muted-foreground">
                        {project.repo_full_name}
                      </span>
                      {project.tagline ? (
                        <span className="mt-0.5 block text-[13.5px] text-muted-foreground">
                          {project.tagline}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
              {capped ? (
                <p className="font-mono text-[12.5px] text-muted-foreground">{copy.searchCapped}</p>
              ) : null}
            </section>
          ) : null}

          {results.profiles.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <span aria-hidden="true">{'// '}</span>
                {copy.searchGroupPeople}
              </h2>
              <ul className="flex flex-col gap-2">
                {results.profiles.map((profile) => (
                  <li key={profile.id}>
                    <Link href={`/u/${profile.username}`} className={rowLink}>
                      <span className="font-mono text-[15px]">@{profile.username}</span>
                      {profile.display_name ? (
                        <span className="ml-2 text-[13.5px] text-muted-foreground">
                          {profile.display_name}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {results.tags.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <span aria-hidden="true">{'// '}</span>
                {copy.searchGroupTags}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {results.tags.map((tag) => (
                  <TagChip key={tag.slug} tag={tag.slug} hashPrefix />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
