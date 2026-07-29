-- ============================================================================
-- 0012: search facets — normalized language + owner/repo trigram index
-- (P3-B part 2, docs/plans/p3b-search.md)
-- ============================================================================
-- No grant changes: a GENERATED column is never writable by anyone, so
-- language_slug cannot enter the authenticated UPDATE grant even by accident.
-- rls_checks.sql asserts the absence by name anyway.

-- ----------------------------------------------------------------------------
-- 1. language_slug — the facet key, and the fix for a filter that never worked
-- ----------------------------------------------------------------------------
-- `lower(primary_language)`, NOT a slugify. Probed against live data: a naive
-- slugify collides — `C#` and `C++` both become `c-` — while lower() is
-- collision-free across all 23 languages in the gallery. It is also exactly
-- what the existing filter already expects: resolveFeedFilterSpec lowercases
-- the incoming value and then exact-matched the GitHub-cased column, so
-- /api/feed?language=typescript has ALWAYS returned an empty page (verified on
-- prod immediately before this migration: 0 rows for every casing, against 76
-- published TypeScript projects).
--
-- URL-safe once encoded (`c%23`, `c%2B%2B`) and indexable, which an .ilike()
-- workaround would not be.

alter table public.projects
  add column language_slug text
  generated always as (lower(primary_language)) stored;

comment on column public.projects.language_slug is
  'lower(primary_language) — the language facet key and feed filter target. Deliberately not a slugify: that collides (C# and C++ both -> "c-"), while lower() is collision-free across the live language set. Generated, so never writable by any role.';

-- Replaces idx_projects_language, which only ever served the exact-case
-- `.eq(primary_language, …)` this migration removes — leaving it would be pure
-- write amplification on a table the pipeline writes 4x/hour.
drop index if exists public.idx_projects_language;

create index idx_projects_language_slug
  on public.projects (language_slug, published_at desc)
  where status = 'published';

-- ----------------------------------------------------------------------------
-- 2. owner/repo search leg
-- ----------------------------------------------------------------------------
-- "owner/repo" is the most-typed query shape on a GitHub-derived product and
-- was entirely unsearchable. Same idiom as 0005: gin + schema-qualified
-- extensions.gin_trgm_ops (pg_trgm lives in `extensions`) + partial on
-- published.

create index if not exists idx_projects_repo_full_name_trgm
  on public.projects using gin (repo_full_name extensions.gin_trgm_ops)
  where status = 'published';
