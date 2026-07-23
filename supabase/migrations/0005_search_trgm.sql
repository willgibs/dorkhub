-- ============================================================================
-- 0005: search — trigram indexes for ILIKE search (2026-07-22)
-- ============================================================================
-- pg_trgm was installed in 0001 ("for future search") but never indexed.
-- Powers /api/search via src/lib/search/queries.ts (paired .ilike() calls —
-- deliberately NOT PostgREST .or(), whose filter grammar treats , and () as
-- syntax; see docs/plans/m5.5-curator.md).
--
-- The operator class is schema-qualified (extensions.gin_trgm_ops) because
-- pg_trgm lives in the `extensions` schema — qualifying an opclass in an
-- index definition works regardless of search_path.
--
-- profiles.username is citext; pg_trgm's opclass targets text, so that index
-- is an expression index on (username::text). Whether the planner uses it for
-- citext ILIKE is verified post-apply with EXPLAIN — if unused it gets
-- dropped (profiles is small; a seq scan is acceptable there).
--
-- No index on public.tags: curated taxonomy, trivially small — index bloat.

create index if not exists idx_projects_name_trgm
  on public.projects using gin (name extensions.gin_trgm_ops)
  where status = 'published';

create index if not exists idx_projects_tagline_trgm
  on public.projects using gin (tagline extensions.gin_trgm_ops)
  where status = 'published';

create index if not exists idx_profiles_display_name_trgm
  on public.profiles using gin (display_name extensions.gin_trgm_ops);

create index if not exists idx_profiles_username_trgm
  on public.profiles using gin ((username::text) extensions.gin_trgm_ops);
