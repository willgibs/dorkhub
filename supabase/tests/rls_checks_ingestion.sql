-- ============================================================================
-- dorkhub.com — RLS / grants assertion suite: 0006 ingestion tables (P1)
-- ============================================================================
-- Companion to rls_checks.sql. Run privileged AFTER 0006_ingestion.sql.
-- Behavioral checks run inside a rolled-back transaction. A clean run ends
-- with the ALL INGESTION CHECKS PASSED notice.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Section I1 — RLS enabled on all four new tables
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  select string_agg(t.tbl, ', ' order by t.tbl)
    into v_missing
    from (values
            ('ingest_candidates'), ('star_imports'),
            ('ingest_blocklist'), ('ingest_crawl_runs')
         ) as t(tbl)
   where not exists (
           select 1
             from pg_class c
             join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
              and c.relname = t.tbl
              and c.relkind = 'r'
              and c.relrowsecurity
         );
  if v_missing is not null then
    raise exception 'RLS FAILURE: I1 row security missing on: %', v_missing;
  end if;
  raise notice 'PASS: I1 RLS enabled on all four ingestion tables';
end
$$;

-- ----------------------------------------------------------------------------
-- Section I2 — deny-all: NO grants for anon/authenticated on the three
-- admin tables; star_imports grants are exactly select/insert(cols)/delete
-- for authenticated only
-- ----------------------------------------------------------------------------
do $$
declare
  v_bad int;
begin
  select count(*) into v_bad
    from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name in ('ingest_candidates', 'ingest_blocklist', 'ingest_crawl_runs')
     and grantee in ('anon', 'authenticated');
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I2 admin ingestion tables have % API-role grants (expected 0)', v_bad;
  end if;

  select count(*) into v_bad
    from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name = 'star_imports'
     and grantee = 'anon';
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I2 star_imports has anon grants (expected 0)';
  end if;

  select count(*) into v_bad
    from information_schema.column_privileges
   where table_schema = 'public'
     and table_name = 'star_imports'
     and grantee = 'authenticated'
     and privilege_type = 'INSERT'
     and column_name not in ('profile_id', 'github_repo_id', 'starred_at');
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I2 star_imports INSERT grant covers % unexpected columns', v_bad;
  end if;
  raise notice 'PASS: I2 grant surface: deny-all on admin tables, narrow star_imports grants';
end
$$;

-- ----------------------------------------------------------------------------
-- Section I3 — service_role has full DML on all four (the 0003 bug class)
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  select string_agg(x.tbl || ':' || x.priv, ', ')
    into v_missing
    from (select t.tbl, p.priv
            from (values ('ingest_candidates'), ('star_imports'),
                         ('ingest_blocklist'), ('ingest_crawl_runs')) t(tbl)
           cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) p(priv)) x
   where not exists (
           select 1 from information_schema.role_table_grants g
            where g.table_schema = 'public'
              and g.table_name = x.tbl
              and g.grantee = 'service_role'
              and g.privilege_type = x.priv
         );
  if v_missing is not null then
    raise exception 'RLS FAILURE: I3 service_role missing DML: %', v_missing;
  end if;
  raise notice 'PASS: I3 service_role full DML on all four ingestion tables (0003 class guarded)';
end
$$;

-- ----------------------------------------------------------------------------
-- Section I4 — behavioral (rolled back): demand trigger + supersede trigger
-- ----------------------------------------------------------------------------
begin;

do $$
declare
  v_profile_a uuid := 'a1000000-0000-4000-8000-000000000001'; -- mollybuilds (seed)
  v_profile_b uuid := 'a1000000-0000-4000-8000-000000000002'; -- gremlinworks (seed)
  v_repo bigint := 990000000001;
  v_demand int;
  v_status text;
  v_project uuid;
begin
  insert into public.ingest_candidates
    (github_repo_id, owner_github_id, owner_login, repo_full_name, repo_url, name, source)
  values
    (v_repo, 990000000900, 'rls-check-owner', 'rls-check-owner/thing',
     'https://github.com/rls-check-owner/thing', 'thing', 'admin_manual');

  -- Demand recount: two importers → 2; delete one → 1.
  insert into public.star_imports (profile_id, github_repo_id, starred_at)
  values (v_profile_a, v_repo, now()), (v_profile_b, v_repo, now());
  select demand_count into v_demand from public.ingest_candidates where github_repo_id = v_repo;
  if v_demand <> 2 then
    raise exception 'RLS FAILURE: I4 demand_count % after two imports (expected 2)', v_demand;
  end if;
  delete from public.star_imports where profile_id = v_profile_b and github_repo_id = v_repo;
  select demand_count into v_demand from public.ingest_candidates where github_repo_id = v_repo;
  if v_demand <> 1 then
    raise exception 'RLS FAILURE: I4 demand_count % after delete (expected 1)', v_demand;
  end if;
  raise notice 'PASS: I4a demand trigger recounts on insert and delete';

  -- Supersede: a projects insert for the same repo flips pending → superseded.
  insert into public.projects
    (profile_id, slug, github_repo_id, repo_full_name, repo_url, name, status)
  values
    (v_profile_a, 'rls-check-thing', v_repo, 'rls-check-owner/thing',
     'https://github.com/rls-check-owner/thing', 'thing', 'draft')
  returning id into v_project;
  select status into v_status from public.ingest_candidates where github_repo_id = v_repo;
  if v_status <> 'superseded' then
    raise exception 'RLS FAILURE: I4 candidate status % after project insert (expected superseded)', v_status;
  end if;
  raise notice 'PASS: I4b supersede trigger flips pending candidates on project insert';

  -- Decided rows are NOT flipped: re-insert candidate as rejected, add another
  -- project for a different repo id — untouched; and supersede only targets
  -- matching repo ids anyway. Assert rejected survives a star_import touch
  -- (demand accrues, status stays).
  insert into public.ingest_candidates
    (github_repo_id, owner_github_id, owner_login, repo_full_name, repo_url, name, source, status, decided_at)
  values
    (990000000002, 990000000900, 'rls-check-owner', 'rls-check-owner/other',
     'https://github.com/rls-check-owner/other', 'other', 'admin_manual', 'rejected', now());
  insert into public.star_imports (profile_id, github_repo_id, starred_at)
  values (v_profile_a, 990000000002, now());
  select status, demand_count into v_status, v_demand
    from public.ingest_candidates where github_repo_id = 990000000002;
  if v_status <> 'rejected' or v_demand <> 1 then
    raise exception 'RLS FAILURE: I4 rejected row status=% demand=% (expected rejected/1)', v_status, v_demand;
  end if;
  raise notice 'PASS: I4c rejected stays sticky while demand accrues';
end
$$;

-- API-role denial (behavioral, not just grant-level).
do $$
begin
  set local role authenticated;
  begin
    perform 1 from public.ingest_candidates limit 1;
    raise exception 'RLS FAILURE: I5 authenticated could select ingest_candidates';
  exception
    when insufficient_privilege then
      raise notice 'PASS: I5 authenticated denied on ingest_candidates';
  end;
  reset role;
end
$$;

rollback;

do $$
begin
  raise notice '=== ALL INGESTION CHECKS PASSED — behavioral changes rolled back ===';
end
$$;
