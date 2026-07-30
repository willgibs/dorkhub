-- ============================================================================
-- dorkhub.com — scale probe harness (P3-C wave C0, decision D36)
-- ============================================================================
-- Measures the hot paths at 10k projects / 100k ingest candidates by
-- inserting synthetic rows INSIDE A TRANSACTION THAT IS ROLLED BACK, so any
-- future change can be re-measured in one command instead of re-derived.
-- This is the committed form of the investigation that produced the P3-C
-- measured-gaps table (docs/plans/p3c-scale.md).
--
-- Usage (prod-safe by construction — everything synthetic rolls back):
--   set -a; source .env.local; set +a
--   PGPASSWORD=$SUPABASE_DB_PASSWORD psql "postgresql://postgres.xvorwdvsnbpujyzfowwu@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/scale_probe.sql
--
-- Do NOT add --single-transaction: the file manages its own begin/rollback,
-- and the trailing integrity check must run AFTER the rollback.
--
-- PASS/FAIL tells:
--   · P2b (deep feed cursor, row-comparison shape) must show
--     `Index Cond: ROW(trending_score, id) < ROW(...)`. If a deep-cursor
--     probe shows `Rows Removed by Filter` in the thousands, pagination has
--     regressed to scan-and-discard (the pre-C1 behaviour, 42× slower).
--   · The trigram probes must show `Bitmap Index Scan on idx_projects_*_trgm`
--     — at 10k the planner chooses them (at ~200 live rows it prefers a seq
--     scan, which is expected and fine).
--   · The final integrity SELECT must report zero probe leftovers.
--
-- Data is DETERMINISTIC (modulo patterns, no random()) so plans and numbers
-- are comparable across runs. Synthetic id ranges are far above real GitHub
-- ids: projects 900000000000+n, candidates 910000000000+n. CAUTION: the SEED
-- FIXTURES also live in the 900-billion range (900287465110+, drafts like
-- spudnik/crateweight) — the synthetic ranges below stop at 900000010000 /
-- 910000100000, safely under them; keep it that way if you resize the probe.
-- ============================================================================

\set ON_ERROR_STOP on
\timing on

\echo '=== baseline row counts (pre-probe) ==='
select
  (select count(*) from public.projects) as projects_before,
  (select count(*) from public.ingest_candidates) as candidates_before,
  pg_size_pretty(pg_database_size(current_database())) as db_size;

begin;

-- One real profile carries every synthetic project — the feed join is by FK
-- and unaffected by author cardinality.
select id as seed_profile_id from public.profiles limit 1 \gset

\echo '=== inserting 10,000 synthetic projects (rolled back at the end) ==='
insert into public.projects
  (profile_id, slug, github_repo_id, repo_full_name, repo_url, name,
   tagline, primary_language, tags, stars_count, forks_count,
   status, trending_score, published_at, github_pushed_at)
select
  :'seed_profile_id'::uuid,
  'probe-proj-' || n,
  900000000000 + n,
  'probe/repo-' || n,
  'https://github.com/probe/repo-' || n,
  'probe-project-' || n,
  case when n % 3 = 0 then 'a synthetic probe row for scale measurement' else null end,
  (array['TypeScript','Python','Rust','Go','JavaScript','C#',null])[1 + (n % 7)],
  case when n % 2 = 0 then array['cli','tools']
       when n % 5 = 0 then array['web-audio']
       else array['web'] end,
  (n * 37) % 20000,
  n % 500,
  case when n % 20 = 0 then 'draft' else 'published' end::project_status,
  -- Mirrors the real distribution: a large recency-dominated base with a
  -- sub-2.5 engagement spread (the P3-C trending finding).
  39000 + (n % 1400) * 0.5 + (n % 7) * 0.01,
  now() - ((n % 400) || ' hours')::interval,
  case when n % 4 = 0 then now() - ((n % 90) || ' days')::interval else null end
from generate_series(1, 10000) n;

\echo '=== inserting 100,000 synthetic pending candidates (rolled back) ==='
insert into public.ingest_candidates
  (github_repo_id, owner_github_id, owner_login, repo_full_name, repo_url, name,
   description, primary_language, stars_count, source, demand_count, status)
select
  910000000000 + n,
  1000 + (n % 5000),
  'probe-owner-' || (n % 5000),
  'probe-owner-' || (n % 5000) || '/probe-cand-' || n,
  'https://github.com/probe-owner/probe-cand-' || n,
  'probe-cand-' || n,
  case when n % 2 = 0 then 'a synthetic probe candidate' else null end,
  (array['TypeScript','Python','Rust','Go'])[1 + (n % 4)],
  (n * 13) % 5000,
  'star_import',
  n % 7,
  'pending'
from generate_series(1, 100000) n;

-- Transactional stats: the planner sees 10k/100k rows inside this
-- transaction, and the stats roll back with the data.
analyze public.projects;
analyze public.ingest_candidates;

-- Deep-page cursor values, pulled from the synthetic distribution (~offset
-- 7000 of ~9.7k published rows — a "user kept scrolling" depth).
select trending_score as cur_score, id as cur_id
  from public.projects
 where status = 'published'
 order by trending_score desc, id desc
offset 7000 limit 1 \gset trend_

select published_at as cur_at, id as cur_id
  from public.projects
 where status = 'published'
 order by published_at desc, id desc
offset 7000 limit 1 \gset recent_

-- ----------------------------------------------------------------------------
\echo '=== P1: feed page 1 (trending) — expect Index Only/Index Scan, <1ms ==='
explain (analyze, buffers)
select id from public.projects
 where status = 'published'
 order by trending_score desc, id desc
 limit 24;

\echo '=== P2a: deep feed cursor, OR shape (the pre-C1 PostgREST .or() emission) ==='
\echo '=== EXPECT THE FAILURE MODE HERE: Rows Removed by Filter ~7000 — this probe'
\echo '=== is the regression tell kept for before/after comparison'
explain (analyze, buffers)
select id from public.projects
 where status = 'published'
   and (trending_score < :trend_cur_score
        or (trending_score = :trend_cur_score and id < :'trend_cur_id'))
 order by trending_score desc, id desc
 limit 24;

\echo '=== P2b: deep feed cursor, row-comparison shape (what feed_page runs) ==='
\echo '=== PASS = Index Cond: ROW(trending_score, id) < ROW(...) ==='
explain (analyze, buffers)
select id from public.projects
 where status = 'published'
   and (trending_score, id) < (:trend_cur_score, :'trend_cur_id'::uuid)
 order by trending_score desc, id desc
 limit 24;

\echo '=== P2c: feed_page RPC end-to-end at the same deep cursor (C1) ==='
\echo '=== the function scan is opaque to EXPLAIN — judge by Execution Time, and'
\echo '=== judge the SECOND call: the first pays one-time session costs (plpgsql'
\echo '=== compile, ~2.6ms measured). Warm steady state ≈0.64ms for the FULL'
\echo '=== column set + author join + per-call dynamic plan, vs 3.57ms for the'
\echo '=== old full-shape OR query — and flat with depth instead of linear.'
explain (analyze, buffers)
select id from public.feed_page('trending', 25,
  p_cursor_score => :trend_cur_score, p_cursor_id => :'trend_cur_id');
explain (analyze, buffers)
select id from public.feed_page('trending', 25,
  p_cursor_score => :trend_cur_score, p_cursor_id => :'trend_cur_id');

\echo '=== P3: deep recent-feed cursor, row-comparison shape ==='
explain (analyze, buffers)
select id from public.projects
 where status = 'published'
   and (published_at, id) < (:'recent_cur_at'::timestamptz, :'recent_cur_id'::uuid)
 order by published_at desc, id desc
 limit 24;

\echo '=== P4: search name ilike — expect Bitmap Index Scan on idx_projects_name_trgm ==='
explain (analyze, buffers)
select id from public.projects
 where status = 'published' and name ilike '%cli%'
 order by trending_score desc
 limit 24;

\echo '=== P5: language facet — expect Index Scan on idx_projects_language_slug ==='
explain (analyze, buffers)
select id from public.projects
 where status = 'published' and language_slug = 'typescript'
 order by published_at desc
 limit 24;

\echo '=== P6: /weird cost, pre-C2 shape (count + OFFSET) — the O(n)-per-request gap ==='
explain (analyze, buffers)
select count(*) from public.projects where status = 'published';
explain (analyze, buffers)
select id from public.projects
 where status = 'published'
 order by trending_score desc, id desc
offset 7000 limit 1;

\echo '=== P7: /tags tally shape — reads every published row''s tags ==='
explain (analyze, buffers)
select tags from public.projects
 where status = 'published' and tags <> '{}';

\echo '=== P8a: ingest queue, index order (demand desc, stars desc) — expect Index Only Scan ==='
explain (analyze, buffers)
select github_repo_id from public.ingest_candidates
 where status = 'pending'
 order by demand_count desc, stars_count desc
 limit 50;

\echo '=== P8b: ingest queue, the PRE-C3 order (stars desc only) — regression tell ==='
\echo '=== ~270-320ms parallel seq scan at 100k; C3 moved the ingest route to the'
\echo '=== index order (P8a). If the app ever orders stars-only again, this is the cost.'
explain (analyze, buffers)
select github_repo_id, description, stars_count from public.ingest_candidates
 where status = 'pending'
 order by stars_count desc
 limit 50;

\echo '=== P9: enrich selection shape (no supporting index — measured for C3) ==='
explain (analyze, buffers)
select id from public.projects
 where status = 'published' and enriched_at is null and tagline is null
 order by stars_count desc
 limit 5;

rollback;

\echo '=== integrity: probe leftovers must be zero, counts must match baseline ==='
select
  (select count(*) from public.projects) as projects_after,
  (select count(*) from public.ingest_candidates) as candidates_after,
  -- Exact synthetic ranges — NOT a broad >= 9e11 sweep, which would catch the
  -- real seed fixtures (fabricated ids at 900287465110+).
  (select count(*) from public.projects
    where github_repo_id between 900000000001 and 900000010000) as probe_project_leftovers,
  (select count(*) from public.ingest_candidates
    where github_repo_id between 910000000001 and 910000100000) as probe_candidate_leftovers;
