-- ============================================================================
-- 0015 — tag_tally(): the /tags counts as a SQL aggregate (P3-C wave C2)
-- ============================================================================
-- /tags previously fetched the `tags` array of EVERY published row and
-- tallied in JS — an O(projects) payload over PostgREST per revalidation
-- (measured: 10,207-row seq scan, 487 buffers at 10k; the payload grows
-- with the catalog). The aggregate returns one row per DISTINCT tag instead
-- — O(tags) over the wire — while the scan itself stays server-side, once
-- per ISR window. A `.limit()` on the old query was never an option: it
-- would silently undercount (the window-then-filter bug class).
--
-- Exact semantic mirror of src/lib/tags/tally.ts `tallyProjectTags`: counts
-- occurrences across rows with no per-row dedup (arrays are deduped at write
-- time by parseTagsInput) and no case normalization (tags are stored
-- lowercase). SECURITY INVOKER — RLS applies as the caller; the explicit
-- published filter keeps parity with the page's old explicit filter for
-- authenticated callers, whose own drafts pass RLS.
--
-- Deliberately NOT a materialized counter (plan: measure first) — at 50k
-- projects this is one ~35ms scan per 15-minute window, server-side.
-- ----------------------------------------------------------------------------
create or replace function public.tag_tally()
returns table (slug text, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select t.slug, count(*)::bigint
    from public.projects p
   cross join lateral unnest(p.tags) as t(slug)
   where p.status = 'published'
   group by t.slug;
$$;

comment on function public.tag_tally() is
  'Published-project tag counts, one row per distinct tag (P3-C C2). Mirrors tallyProjectTags exactly; SECURITY INVOKER so RLS applies as the caller.';

revoke execute on function public.tag_tally() from public;
grant execute on function public.tag_tally() to anon, authenticated, service_role;
