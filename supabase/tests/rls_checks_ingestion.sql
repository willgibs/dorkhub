-- ============================================================================
-- dorkhub.com — RLS / grants assertion suite: ingestion + moderation tables
-- (0006 ingestion · 0007 enrichment · 0009 immune system)
-- ============================================================================
-- Companion to rls_checks.sql. Run privileged AFTER the latest migration.
-- Behavioral checks run inside a rolled-back transaction. A clean run ends
-- with the ALL INGESTION CHECKS PASSED notice.
--
-- ON_ERROR_STOP makes that last sentence true — without it psql runs on past a
-- raised exception and still prints the final PASSED notice (P2.7).
-- ============================================================================
\set ON_ERROR_STOP on

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
  v_profile_a uuid;
  v_profile_b uuid;
  v_repo bigint := 990000000001;
  v_demand int;
  v_status text;
  v_project uuid;
begin
  -- Self-provisioned actors — no seed.sql dependency (P4: prod fixtures
  -- purged). github_ids sit far outside GitHub's real id space, so unlike the
  -- old fixtures these rows could never be claimed by a real account.
  insert into public.profiles (username, github_username, github_id)
  values ('rls-check-ingest-a', 'rls-check-ingest-a', 990000000901)
  returning id into v_profile_a;
  insert into public.profiles (username, github_username, github_id)
  values ('rls-check-ingest-b', 'rls-check-ingest-b', 990000000902)
  returning id into v_profile_b;

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

-- ----------------------------------------------------------------------------
-- Section I6 — 0007 enrichment columns: present, and the deny-all posture
-- survived the ALTER (no table- OR column-level API-role privileges).
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
  v_bad int;
begin
  select string_agg(c.col, ', ')
    into v_missing
    from (values ('ai_tagline'), ('ai_tags'), ('enriched_at')) c(col)
   where not exists (
           select 1 from information_schema.columns k
            where k.table_schema = 'public'
              and k.table_name = 'ingest_candidates'
              and k.column_name = c.col
         );
  if v_missing is not null then
    raise exception 'RLS FAILURE: I6 ingest_candidates missing 0007 columns: %', v_missing;
  end if;

  select count(*) into v_bad
    from information_schema.column_privileges
   where table_schema = 'public'
     and table_name = 'ingest_candidates'
     and grantee in ('anon', 'authenticated');
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I6 ingest_candidates has % API-role column privileges (expected 0)', v_bad;
  end if;
  raise notice 'PASS: I6 0007 columns present; deny-all posture intact post-ALTER';
end
$$;

-- ----------------------------------------------------------------------------
-- Section I7 — behavioral (rolled back): ai_tagline length CHECK enforced;
-- ai_tags defaults to empty array.
-- ----------------------------------------------------------------------------
begin;

do $$
declare
  v_tags text[];
begin
  begin
    insert into public.ingest_candidates
      (github_repo_id, owner_github_id, owner_login, repo_full_name, repo_url, name, source, ai_tagline)
    values
      (990000000003, 990000000900, 'rls-check-owner', 'rls-check-owner/long',
       'https://github.com/rls-check-owner/long', 'long', 'admin_manual', repeat('x', 121));
    raise exception 'RLS FAILURE: I7 121-char ai_tagline accepted (CHECK missing)';
  exception
    when check_violation then
      raise notice 'PASS: I7a ai_tagline >120 rejected by CHECK';
  end;

  insert into public.ingest_candidates
    (github_repo_id, owner_github_id, owner_login, repo_full_name, repo_url, name, source, ai_tagline)
  values
    (990000000004, 990000000900, 'rls-check-owner', 'rls-check-owner/ok',
     'https://github.com/rls-check-owner/ok', 'ok', 'admin_manual', repeat('x', 120));
  select ai_tags into v_tags from public.ingest_candidates where github_repo_id = 990000000004;
  if v_tags is null or v_tags <> '{}'::text[] then
    raise exception 'RLS FAILURE: I7 ai_tags default is % (expected empty array)', v_tags;
  end if;
  raise notice 'PASS: I7b 120-char ai_tagline accepted; ai_tags defaults to {}';
end
$$;

rollback;

-- ----------------------------------------------------------------------------
-- Section I8 — 0009: RLS enabled on both moderation tables
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  select string_agg(t.tbl, ', ' order by t.tbl)
    into v_missing
    from (values ('project_reports'), ('moderation_screens')) as t(tbl)
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
    raise exception 'RLS FAILURE: I8 row security missing on: %', v_missing;
  end if;
  raise notice 'PASS: I8 RLS enabled on both moderation tables';
end
$$;

-- ----------------------------------------------------------------------------
-- Section I9 — 0009: deny-all — zero API-role grants, table- and column-level
-- ----------------------------------------------------------------------------
do $$
declare
  v_bad int;
begin
  select count(*) into v_bad
    from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name in ('project_reports', 'moderation_screens')
     and grantee in ('anon', 'authenticated');
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I9 moderation tables have % API-role table grants (expected 0)', v_bad;
  end if;

  select count(*) into v_bad
    from information_schema.column_privileges
   where table_schema = 'public'
     and table_name in ('project_reports', 'moderation_screens')
     and grantee in ('anon', 'authenticated');
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I9 moderation tables have % API-role column privileges (expected 0)', v_bad;
  end if;
  raise notice 'PASS: I9 deny-all grant surface on both moderation tables';
end
$$;

-- ----------------------------------------------------------------------------
-- Section I10 — 0009: service_role has full DML on both (the 0003 bug class)
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  select string_agg(x.tbl || ':' || x.priv, ', ')
    into v_missing
    from (select t.tbl, p.priv
            from (values ('project_reports'), ('moderation_screens')) t(tbl)
           cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) p(priv)) x
   where not exists (
           select 1 from information_schema.role_table_grants g
            where g.table_schema = 'public'
              and g.table_name = x.tbl
              and g.grantee = 'service_role'
              and g.privilege_type = x.priv
         );
  if v_missing is not null then
    raise exception 'RLS FAILURE: I10 service_role missing DML: %', v_missing;
  end if;
  raise notice 'PASS: I10 service_role full DML on both moderation tables';
end
$$;

-- ----------------------------------------------------------------------------
-- Section I11 — 0009 behavioral (rolled back): constraints + upsert-overwrite
-- ----------------------------------------------------------------------------
begin;

do $$
declare
  v_profile_a uuid;
  v_profile_b uuid;
  v_project uuid;
  v_verdict text;
  v_count int;
begin
  -- Self-provisioned actors (see I4's note — no seed.sql dependency).
  insert into public.profiles (username, github_username, github_id)
  values ('rls-check-ingest-a', 'rls-check-ingest-a', 990000000903)
  returning id into v_profile_a;
  insert into public.profiles (username, github_username, github_id)
  values ('rls-check-ingest-b', 'rls-check-ingest-b', 990000000904)
  returning id into v_profile_b;

  insert into public.projects
    (profile_id, slug, github_repo_id, repo_full_name, repo_url, name, status)
  values
    (v_profile_a, 'rls-check-immune', 990000000005, 'rls-check-owner/immune',
     'https://github.com/rls-check-owner/immune', 'immune', 'draft')
  returning id into v_project;

  insert into public.project_reports (project_id, reporter_profile_id, reason)
  values (v_project, v_profile_b, 'spam');

  begin
    insert into public.project_reports (project_id, reporter_profile_id, reason)
    values (v_project, v_profile_b, 'other');
    raise exception 'RLS FAILURE: I11 duplicate (project, reporter) report accepted';
  exception
    when unique_violation then
      raise notice 'PASS: I11a duplicate (project, reporter) report rejected';
  end;

  begin
    insert into public.project_reports (project_id, reporter_profile_id, reason)
    values (v_project, v_profile_a, 'meh');
    raise exception 'RLS FAILURE: I11 invalid report reason accepted';
  exception
    when check_violation then
      raise notice 'PASS: I11b invalid report reason rejected by CHECK';
  end;

  begin
    insert into public.project_reports (project_id, reporter_profile_id, reason, note)
    values (v_project, v_profile_a, 'spam', repeat('x', 501));
    raise exception 'RLS FAILURE: I11 501-char report note accepted';
  exception
    when check_violation then
      raise notice 'PASS: I11c report note >500 rejected by CHECK';
  end;

  begin
    insert into public.moderation_screens (project_id, source, verdict)
    values (v_project, 'retro', 'maybe');
    raise exception 'RLS FAILURE: I11 invalid screen verdict accepted';
  exception
    when check_violation then
      raise notice 'PASS: I11d invalid screen verdict rejected by CHECK';
  end;

  begin
    insert into public.moderation_screens (project_id, source, verdict)
    values (v_project, 'cron', 'ok');
    raise exception 'RLS FAILURE: I11 invalid screen source accepted';
  exception
    when check_violation then
      raise notice 'PASS: I11e invalid screen source rejected by CHECK';
  end;

  begin
    insert into public.moderation_screens (project_id, source, verdict, reason)
    values (v_project, 'retro', 'ok', repeat('x', 241));
    raise exception 'RLS FAILURE: I11 241-char screen reason accepted';
  exception
    when check_violation then
      raise notice 'PASS: I11f screen reason >240 rejected by CHECK';
  end;

  -- Upsert-overwrite: re-screens replace, never duplicate (D5).
  insert into public.moderation_screens (project_id, source, verdict)
  values (v_project, 'retro', 'ok');
  insert into public.moderation_screens (project_id, source, verdict, reason)
  values (v_project, 'report', 'flagged', 'rls check overwrite')
  on conflict (project_id) do update
    set source = excluded.source, verdict = excluded.verdict, reason = excluded.reason;
  select count(*), min(verdict) into v_count, v_verdict
    from public.moderation_screens where project_id = v_project;
  if v_count <> 1 or v_verdict <> 'flagged' then
    raise exception 'RLS FAILURE: I11 upsert left count=% verdict=% (expected 1/flagged)', v_count, v_verdict;
  end if;
  raise notice 'PASS: I11g screen upsert overwrites in place (one row per project)';
end
$$;

-- ----------------------------------------------------------------------------
-- Section I12 — API-role denial (behavioral, not just grant-level)
-- ----------------------------------------------------------------------------
do $$
begin
  set local role authenticated;
  begin
    perform 1 from public.project_reports limit 1;
    raise exception 'RLS FAILURE: I12 authenticated could select project_reports';
  exception
    when insufficient_privilege then
      raise notice 'PASS: I12a authenticated denied on project_reports';
  end;
  begin
    perform 1 from public.moderation_screens limit 1;
    raise exception 'RLS FAILURE: I12 authenticated could select moderation_screens';
  exception
    when insufficient_privilege then
      raise notice 'PASS: I12b authenticated denied on moderation_screens';
  end;
  reset role;
end
$$;

rollback;

-- ----------------------------------------------------------------------------
-- Section I13 — 0013 AI budget ledger: deny-all posture + fail-closed claims
-- ----------------------------------------------------------------------------
do $$
declare
  v_bad int;
  v_grants int;
begin
  -- RLS enabled, zero policies (deny-all's second gate).
  if not exists (
    select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'ai_usage' and c.relrowsecurity
  ) then
    raise exception 'RLS FAILURE: I13 ai_usage does not have RLS enabled';
  end if;
  select count(*) into v_bad from pg_policies
   where schemaname = 'public' and tablename = 'ai_usage';
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I13 ai_usage has % policies (expected 0 — deny-all)', v_bad;
  end if;

  -- Zero API-role grants, table- and column-level (deny-all's first gate).
  select count(*) into v_bad
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'ai_usage'
     and grantee in ('anon', 'authenticated');
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I13 ai_usage has % API-role table grants (expected 0)', v_bad;
  end if;
  select count(*) into v_bad
    from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'ai_usage'
     and grantee in ('anon', 'authenticated');
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I13 ai_usage has % API-role column privileges (expected 0)', v_bad;
  end if;

  -- service_role keeps full DML (the 0003 bug class).
  select count(distinct privilege_type) into v_grants
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'ai_usage'
     and grantee = 'service_role'
     and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE');
  if v_grants < 4 then
    raise exception 'RLS FAILURE: I13 service_role missing DML on ai_usage (% of 4)', v_grants;
  end if;

  -- claim_ai_call / db_size_bytes: service_role may execute, API roles may not.
  if not exists (
    select 1 from information_schema.routine_privileges
     where routine_schema = 'public' and routine_name = 'claim_ai_call'
       and grantee = 'service_role' and privilege_type = 'EXECUTE'
  ) then
    raise exception 'RLS FAILURE: I13 service_role cannot execute claim_ai_call';
  end if;
  select count(*) into v_bad
    from information_schema.routine_privileges
   where routine_schema = 'public'
     and routine_name in ('claim_ai_call', 'db_size_bytes')
     and grantee in ('anon', 'authenticated', 'PUBLIC');
  if v_bad > 0 then
    raise exception 'RLS FAILURE: I13 budget functions have % API-role/PUBLIC execute grants (expected 0)', v_bad;
  end if;

  raise notice 'PASS: I13 ai_usage deny-all posture + function grant surface';
end
$$;

-- ----------------------------------------------------------------------------
-- Section I14 — 0013 behavioral (rolled back): the ledger's atomic ceiling +
-- API-role denial
-- ----------------------------------------------------------------------------
begin;

do $$
declare
  v_claim boolean;
begin
  -- Fresh ledger for today inside this rolled-back transaction. Lifetime
  -- cap passed as NULL here = daily-ceiling-only semantics (0013 behavior).
  delete from public.ai_usage where day = (now() at time zone 'utc')::date;

  -- Ceiling of 2: claim, claim, then refuse — and the refusal must not
  -- increment the ledger past the cap.
  select public.claim_ai_call(2, null) into v_claim;
  if v_claim is distinct from true then
    raise exception 'RLS FAILURE: I14 first claim under a ceiling of 2 was refused';
  end if;
  select public.claim_ai_call(2, null) into v_claim;
  if v_claim is distinct from true then
    raise exception 'RLS FAILURE: I14 second claim under a ceiling of 2 was refused';
  end if;
  select public.claim_ai_call(2, null) into v_claim;
  if v_claim is distinct from false then
    raise exception 'RLS FAILURE: I14 third claim under a ceiling of 2 was NOT refused';
  end if;
  if (select calls from public.ai_usage where day = (now() at time zone 'utc')::date) <> 2 then
    raise exception 'RLS FAILURE: I14 ledger overshot the ceiling';
  end if;

  -- Zero daily ceiling = kill-switch: refused even on an empty ledger (the
  -- INSERT arm must be guarded too, or the first call of the day sneaks past).
  delete from public.ai_usage where day = (now() at time zone 'utc')::date;
  select public.claim_ai_call(0, null) into v_claim;
  if v_claim is distinct from false then
    raise exception 'RLS FAILURE: I14 zero-ceiling claim was NOT refused on an empty ledger';
  end if;
  if exists (select 1 from public.ai_usage where day = (now() at time zone 'utc')::date) then
    raise exception 'RLS FAILURE: I14 zero-ceiling claim wrote a ledger row';
  end if;

  raise notice 'PASS: I14a ledger enforces the daily ceiling atomically, zero-ceiling refuses';

  -- LIFETIME cap (0017, P3-D "~$5 max"): seed past days, then prove the
  -- total is enforced across days — including today's lock-held count.
  delete from public.ai_usage;
  insert into public.ai_usage (day, calls) values ('2026-01-01', 3), ('2026-01-02', 4); -- total 7
  select public.claim_ai_call(10, 7) into v_claim;
  if v_claim is distinct from false then
    raise exception 'RLS FAILURE: I14 lifetime-at-cap claim (7/7) was NOT refused';
  end if;
  select public.claim_ai_call(10, 8) into v_claim;
  if v_claim is distinct from true then
    raise exception 'RLS FAILURE: I14 lifetime one-under claim (7/8) was refused';
  end if;
  select public.claim_ai_call(10, 8) into v_claim;
  if v_claim is distinct from false then
    raise exception 'RLS FAILURE: I14 lifetime now-at-cap claim (8/8) was NOT refused';
  end if;

  -- Zero lifetime ceiling = kill-switch, and it writes NOTHING.
  delete from public.ai_usage where day = (now() at time zone 'utc')::date;
  select public.claim_ai_call(10, 0) into v_claim;
  if v_claim is distinct from false then
    raise exception 'RLS FAILURE: I14 zero-lifetime claim was NOT refused';
  end if;
  if exists (select 1 from public.ai_usage where day = (now() at time zone 'utc')::date) then
    raise exception 'RLS FAILURE: I14 zero-lifetime claim wrote a ledger row';
  end if;

  raise notice 'PASS: I14e lifetime cap enforced across days; zero-lifetime refuses and writes nothing';
end
$$;

do $$
begin
  set local role authenticated;
  begin
    perform 1 from public.ai_usage limit 1;
    raise exception 'RLS FAILURE: I14 authenticated could select ai_usage';
  exception
    when insufficient_privilege then
      raise notice 'PASS: I14b authenticated denied on ai_usage';
  end;
  begin
    perform public.claim_ai_call(10, null);
    raise exception 'RLS FAILURE: I14 authenticated could execute claim_ai_call (budget DoS surface)';
  exception
    when insufficient_privilege then
      raise notice 'PASS: I14c authenticated denied execute on claim_ai_call';
  end;
  reset role;
  set local role anon;
  begin
    perform public.claim_ai_call(10, null);
    raise exception 'RLS FAILURE: I14 anon could execute claim_ai_call (budget DoS surface)';
  exception
    when insufficient_privilege then
      raise notice 'PASS: I14d anon denied execute on claim_ai_call';
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
