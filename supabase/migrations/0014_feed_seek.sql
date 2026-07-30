-- ============================================================================
-- 0014 — feed_page(): keyset pagination that actually seeks (P3-C wave C1,
-- docs/plans/p3c-scale.md, decisions D31/D32)
-- ============================================================================
-- The PostgREST `.or()` cursor emulation cannot produce a row-comparison
-- predicate, so every deep feed page scanned the index from the top and
-- discarded everything before the cursor — measured at 10k rows:
-- `Rows Removed by Filter: 7001`, ~3 ms, growing linearly with depth. The
-- row comparison `(trending_score, id) < (x, y)` seeks directly:
-- `Index Cond: ROW(...)`, ~0.08 ms (scale_probe.sql P2a vs P2b).
--
-- D31 — an RPC, because the generated-column alternative is impossible
-- (`to_char` is STABLE, not IMMUTABLE — Postgres rejects the expression) and
-- a trigger-maintained sort key would duplicate ordering logic.
--
-- D32 — SECURITY INVOKER, so RLS applies AS THE CALLER. This must never
-- become DEFINER: that would bypass projects_select_published_or_own and
-- leak drafts. (The explicit status = 'published' predicate is still
-- load-bearing for authenticated callers, whose own drafts pass RLS.)
--
-- Implementation note — dynamic SQL on purpose: a static plpgsql query with
-- `(p_x IS NULL OR ...)` guards goes generic after a few calls and the
-- cursor degrades back to a filter (the exact bug this migration removes).
-- Building the statement from CONSTANT fragments and binding every value
-- via USING gives each filter-combination a fresh, exact plan — and no
-- user-shaped value is ever interpolated into SQL text (the P2.7 cursor
-- validators remain as defense in depth on the TS side, but the type system
-- is now the boundary: uuid is uuid, timestamptz is timestamptz).
-- ----------------------------------------------------------------------------
create or replace function public.feed_page(
  p_sort text,
  p_limit integer,
  p_tag text default null,
  p_language text default null,
  p_profile_ids uuid[] default null,
  p_cursor_score double precision default null,
  p_cursor_at timestamptz default null,
  p_cursor_id uuid default null
)
returns table (
  id uuid,
  slug text,
  profile_id uuid,
  name text,
  tagline text,
  primary_language text,
  stars_count integer,
  forks_count integer,
  license text,
  demo_url text,
  tags text[],
  screenshots jsonb,
  likes_count integer,
  lists_count integer,
  updated_at timestamptz,
  github_pushed_at timestamptz,
  published_at timestamptz,
  trending_score double precision,
  repo_full_name text,
  author_username text,
  author_display_name text,
  author_avatar_url text,
  author_followers_count integer
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  q text;
begin
  if p_sort not in ('trending', 'recent') then
    raise exception 'feed_page: unknown sort "%"', p_sort;
  end if;

  q := 'select p.id, p.slug, p.profile_id, p.name, p.tagline, p.primary_language,'
    || ' p.stars_count, p.forks_count, p.license, p.demo_url, p.tags, p.screenshots,'
    || ' p.likes_count, p.lists_count, p.updated_at, p.github_pushed_at, p.published_at,'
    || ' p.trending_score, p.repo_full_name,'
    || ' pr.username::text, pr.display_name, pr.avatar_url, pr.followers_count'
    || ' from public.projects p'
    || ' join public.profiles pr on pr.id = p.profile_id'
    || ' where p.status = ''published''';

  -- Fixed USING positions: $1 tag · $2 language · $3 profile_ids ·
  -- $4 cursor_score · $5 cursor_at · $6 cursor_id · $7 limit.
  if p_tag is not null then
    q := q || ' and p.tags @> array[$1]';
  end if;
  if p_language is not null then
    q := q || ' and p.language_slug = $2';
  end if;
  if p_profile_ids is not null then
    q := q || ' and p.profile_id = any($3)';
  end if;

  if p_sort = 'trending' then
    if p_cursor_score is not null and p_cursor_id is not null then
      q := q || ' and (p.trending_score, p.id) < ($4, $6)';
    end if;
    q := q || ' order by p.trending_score desc, p.id desc';
  else
    if p_cursor_at is not null and p_cursor_id is not null then
      q := q || ' and (p.published_at, p.id) < ($5, $6)';
    end if;
    q := q || ' order by p.published_at desc, p.id desc';
  end if;

  q := q || ' limit $7';

  return query execute q
    using p_tag, p_language, p_profile_ids, p_cursor_score, p_cursor_at, p_cursor_id,
      -- Server-side clamp, defense in depth behind the TS clamp:
      -- FEED_PAGE_SIZE_MAX (48) + the one look-ahead row.
      least(greatest(p_limit, 1), 49);
end;
$$;

comment on function public.feed_page(text, integer, text, text, uuid[], double precision, timestamptz, uuid) is
  'Keyset feed page that seeks via row comparison (P3-C D31). SECURITY INVOKER on purpose (D32) — RLS applies as the caller; must never become DEFINER.';

-- The public feed's read path: API roles may execute; RLS (as invoker)
-- governs what they see.
revoke execute on function public.feed_page(text, integer, text, text, uuid[], double precision, timestamptz, uuid) from public;
grant execute on function public.feed_page(text, integer, text, text, uuid[], double precision, timestamptz, uuid) to anon, authenticated, service_role;
