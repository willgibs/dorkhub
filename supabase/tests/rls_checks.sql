-- ============================================================================
-- dorkhub.com — RLS / grants assertion suite
-- ============================================================================
-- Run as a privileged role (Supabase SQL editor, or MCP execute_sql) AFTER
-- applying supabase/migrations/0001_init.sql. Sections 1–3 are structural and
-- have no prerequisites; Section 4 is behavioral and requires supabase/seed.sql
-- (it references the fixed seed UUIDs) — everything it touches happens inside
-- a transaction that is ROLLED BACK at the end.
--
-- Every check prints a "PASS: ..." notice. Any failure raises an exception
-- prefixed "RLS FAILURE:" (or "SETUP FAILURE:") and aborts the script, so a
-- clean run ends with the final ALL CHECKS PASSED notice.
--
-- ON_ERROR_STOP is what MAKES the sentence above true (P2.7). Without it psql
-- continues past a raised exception, and since the final notice sits after
-- `rollback;` — outside the aborted transaction — the suite happily printed
-- ALL CHECKS PASSED on a run that had already failed a check. Caught while
-- negative-controlling T21/T23 against deliberately widened policies.
\set ON_ERROR_STOP on
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Section 1 — row security enabled on every expected table
-- ----------------------------------------------------------------------------

do $$
declare
  v_missing text;
begin
  select string_agg(t.tbl, ', ' order by t.tbl)
    into v_missing
    from (values
            ('profiles'), ('projects'), ('project_updates'),
            ('likes'), ('saves'), ('follows'),
            ('tags'), ('featured_slots'), ('claim_invites'),
            ('collections'), ('collection_items')
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
    raise exception 'RLS FAILURE: row security not enabled on: %', v_missing;
  end if;
  raise notice 'PASS: RLS enabled on all 11 expected tables';
end
$$;


-- ----------------------------------------------------------------------------
-- Section 2 — exact UPDATE column grants for the API roles
-- ----------------------------------------------------------------------------
-- Note: information_schema.column_privileges expands table-level grants into
-- per-column rows, so a stray table-wide GRANT UPDATE also shows up as
-- "extra" columns here.

do $$
declare
  v_missing text;
  v_extra   text;
  v_bad     text;
begin
  -- 2a. authenticated UPDATE columns on profiles/projects: exact match.
  with expected(table_name, column_name) as (
    values
      ('profiles', 'username'),
      ('profiles', 'display_name'),
      ('profiles', 'bio'),
      ('profiles', 'links'),
      ('profiles', 'avatar_url'),
      ('projects', 'tagline'),
      ('projects', 'description_md'),
      ('projects', 'tags'),
      ('projects', 'demo_url'),
      ('projects', 'screenshots'),
      ('projects', 'sort_order'),
      ('projects', 'status')
  ),
  actual as (
    select table_name::text, column_name::text
      from information_schema.column_privileges
     where table_schema    = 'public'
       and grantee         = 'authenticated'
       and privilege_type  = 'UPDATE'
       and table_name in ('profiles', 'projects')
  )
  select
    (select string_agg(m.table_name || '.' || m.column_name, ', '
                       order by m.table_name, m.column_name)
       from (select * from expected except select * from actual) m),
    (select string_agg(x.table_name || '.' || x.column_name, ', '
                       order by x.table_name, x.column_name)
       from (select * from actual except select * from expected) x)
    into v_missing, v_extra;

  if v_extra is not null then
    raise exception
      'RLS FAILURE: unexpected UPDATE column grants for authenticated (privilege-escalation surface — watch for is_admin / github_id / user_id / readme_html / counters): %',
      v_extra;
  end if;
  if v_missing is not null then
    raise exception 'RLS FAILURE: expected UPDATE column grants missing for authenticated: %', v_missing;
  end if;
  raise notice 'PASS: authenticated UPDATE grants on profiles/projects match the expected 12 columns exactly';

  -- 2a′. 0008 explicit: projects.enriched_at (AI-pipeline provenance) must
  -- never be API-role-writable — covered by 2a's exact match, asserted by
  -- name so a future grant fails with an unmistakable message.
  if exists (
    select 1 from information_schema.column_privileges
     where table_schema = 'public' and table_name = 'projects'
       and column_name = 'enriched_at'
       and grantee in ('anon', 'authenticated')
       and privilege_type in ('INSERT', 'UPDATE')
  ) then
    raise exception 'RLS FAILURE: projects.enriched_at is API-role-writable (0008: service-role only)';
  end if;
  raise notice 'PASS: projects.enriched_at is not API-role-writable';

  -- 2a‴. 0011: lists_count is trigger-written and github_pushed_at is
  -- sync-written. Both are covered by 2a's exact match; asserted by name so a
  -- future grant fails with an unmistakable message. A writable lists_count
  -- would let anyone forge a project's discovery signal outright.
  if exists (
    select 1 from information_schema.column_privileges
     where table_schema = 'public' and table_name = 'projects'
       and column_name in ('lists_count', 'github_pushed_at')
       and grantee in ('anon', 'authenticated')
       and privilege_type in ('INSERT', 'UPDATE')
  ) then
    raise exception 'RLS FAILURE: projects.lists_count/github_pushed_at are API-role-writable (0011: trigger/service-role only)';
  end if;
  raise notice 'PASS: projects.lists_count + github_pushed_at are not API-role-writable';

  -- 2a″. 0010 lists: exact column-grant surface for collections tables.
  with expected(table_name, privilege_type, column_name) as (
    values
      ('collections',      'INSERT', 'profile_id'),
      ('collections',      'INSERT', 'name'),
      ('collections',      'INSERT', 'slug'),
      ('collections',      'INSERT', 'description'),
      ('collections',      'INSERT', 'is_public'),
      ('collections',      'UPDATE', 'name'),
      ('collections',      'UPDATE', 'description'),
      ('collections',      'UPDATE', 'is_public'),
      ('collection_items', 'INSERT', 'collection_id'),
      ('collection_items', 'INSERT', 'project_id')
  ),
  actual as (
    select table_name::text, privilege_type::text, column_name::text
      from information_schema.column_privileges
     where table_schema   = 'public'
       and grantee        = 'authenticated'
       and privilege_type in ('INSERT', 'UPDATE')
       and table_name in ('collections', 'collection_items')
  )
  select
    (select string_agg(m.table_name || '.' || m.column_name || ' [' || m.privilege_type || ']', ', '
                       order by m.table_name, m.privilege_type, m.column_name)
       from (select * from expected except select * from actual) m),
    (select string_agg(x.table_name || '.' || x.column_name || ' [' || x.privilege_type || ']', ', '
                       order by x.table_name, x.privilege_type, x.column_name)
       from (select * from actual except select * from expected) x)
    into v_missing, v_extra;

  if v_extra is not null then
    raise exception 'RLS FAILURE: unexpected collections write grants: %', v_extra;
  end if;
  if v_missing is not null then
    raise exception 'RLS FAILURE: expected collections write grants missing: %', v_missing;
  end if;
  raise notice 'PASS: collections/collection_items write grants match exactly (10 columns)';

  -- 2a‴. 0010 explicit: collections.slug must never be API-role-UPDATEable
  -- (stable list URLs — suffixed once at creation, renames never re-slug).
  if exists (
    select 1 from information_schema.column_privileges
     where table_schema = 'public' and table_name = 'collections'
       and column_name = 'slug'
       and grantee in ('anon', 'authenticated')
       and privilege_type = 'UPDATE'
  ) then
    raise exception 'RLS FAILURE: collections.slug is API-role-updatable (breaks stable list URLs — 0010)';
  end if;
  raise notice 'PASS: collections.slug is not API-role-updatable';

  -- 2b. anon must hold zero write privileges anywhere in public.
  select string_agg(distinct table_name || ' (' || privilege_type || ')', ', ')
    into v_bad
    from information_schema.column_privileges
   where table_schema = 'public'
     and grantee      = 'anon'
     and privilege_type in ('INSERT', 'UPDATE', 'DELETE');

  if v_bad is not null then
    raise exception 'RLS FAILURE: anon holds write privileges: %', v_bad;
  end if;
  raise notice 'PASS: anon has no INSERT/UPDATE/DELETE privileges in public';

  -- 2c. authenticated must not be able to INSERT into profiles or projects
  --     (profile creation / claiming and project creation are service-role flows).
  select string_agg(distinct table_name, ', ')
    into v_bad
    from information_schema.column_privileges
   where table_schema   = 'public'
     and grantee        = 'authenticated'
     and privilege_type = 'INSERT'
     and table_name in ('profiles', 'projects');

  if v_bad is not null then
    raise exception 'RLS FAILURE: authenticated holds INSERT privilege on: %', v_bad;
  end if;
  raise notice 'PASS: authenticated cannot INSERT into profiles or projects';
end
$$;

-- service_role must hold full DML on every public table — 0001's revoke-all
-- hardening once stripped it (production onboarding 42501, fixed in 0003);
-- this assertion keeps that from regressing.
do $$
declare
  v_bad text;
begin
  select string_agg(t.table_name || ' (missing ' || p.privilege_type || ')', ', ')
    into v_bad
    from (values ('profiles'), ('projects'), ('project_updates'), ('likes'), ('saves'),
                 ('follows'), ('tags'), ('featured_slots'), ('claim_invites'),
                 ('collections'), ('collection_items')) as t(table_name)
   cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(privilege_type)
   where not exists (
     select 1 from information_schema.table_privileges tp
      where tp.table_schema = 'public'
        and tp.table_name   = t.table_name
        and tp.grantee      = 'service_role'
        and tp.privilege_type = p.privilege_type
   );

  if v_bad is not null then
    raise exception 'RLS FAILURE: service_role lacks DML privileges: %', v_bad;
  end if;
  raise notice 'PASS: service_role holds full DML on all 11 public tables';
end
$$;


-- ----------------------------------------------------------------------------
-- Section 3 — expected policy set (name + cmd), per table
-- ----------------------------------------------------------------------------

do $$
declare
  v_missing text;
  v_extra   text;
  v_count   int;
begin
  -- 3a. public schema: exact match in both directions.
  with expected(tablename, policyname, cmd) as (
    values
      ('profiles',        'profiles_select_all',              'SELECT'),
      ('profiles',        'profiles_update_own',              'UPDATE'),
      ('projects',        'projects_select_published_or_own', 'SELECT'),
      ('projects',        'projects_update_own',              'UPDATE'),
      ('projects',        'projects_delete_own',              'DELETE'),
      ('project_updates', 'project_updates_select',           'SELECT'),
      ('project_updates', 'project_updates_insert_own',       'INSERT'),
      ('project_updates', 'project_updates_update_own',       'UPDATE'),
      ('project_updates', 'project_updates_delete_own',       'DELETE'),
      ('likes',           'likes_select_own',                 'SELECT'),
      ('likes',           'likes_insert_own',                 'INSERT'),
      ('likes',           'likes_delete_own',                 'DELETE'),
      ('saves',           'saves_select_own',                 'SELECT'),
      ('saves',           'saves_insert_own',                 'INSERT'),
      ('saves',           'saves_delete_own',                 'DELETE'),
      ('follows',         'follows_select_all',               'SELECT'),
      ('follows',         'follows_insert_own',               'INSERT'),
      ('follows',         'follows_delete_own',               'DELETE'),
      ('tags',            'tags_select_all',                  'SELECT'),
      ('featured_slots',  'featured_slots_select_active',     'SELECT'),
      -- 0006 ingestion: star_imports is the one API-facing ingestion table
      -- (own-rows, like saves). The other three are deny-all with zero
      -- policies — asserted in rls_checks_ingestion.sql.
      ('star_imports',    'star_imports_select_own',          'SELECT'),
      ('star_imports',    'star_imports_insert_own',          'INSERT'),
      ('star_imports',    'star_imports_delete_own',          'DELETE'),
      -- 0010 lists: user-owned, RLS-first (saves pattern).
      ('collections',      'collections_select_public_or_own', 'SELECT'),
      ('collections',      'collections_insert_own',           'INSERT'),
      ('collections',      'collections_update_own',           'UPDATE'),
      ('collections',      'collections_delete_own',           'DELETE'),
      ('collection_items', 'collection_items_select',          'SELECT'),
      ('collection_items', 'collection_items_insert_own',      'INSERT'),
      ('collection_items', 'collection_items_delete_own',      'DELETE')
  ),
  actual as (
    select tablename::text, policyname::text, cmd::text
      from pg_policies
     where schemaname = 'public'
  )
  select
    (select string_agg(format('%s.%s [%s]', m.tablename, m.policyname, m.cmd), ', '
                       order by m.tablename, m.policyname)
       from (select * from expected except select * from actual) m),
    (select string_agg(format('%s.%s [%s]', x.tablename, x.policyname, x.cmd), ', '
                       order by x.tablename, x.policyname)
       from (select * from actual except select * from expected) x)
    into v_missing, v_extra;

  if v_missing is not null then
    raise exception 'RLS FAILURE: expected policies missing: %', v_missing;
  end if;
  if v_extra is not null then
    raise exception 'RLS FAILURE: unexpected policies present: %', v_extra;
  end if;
  raise notice 'PASS: public-schema policy set matches the expected 30 policies exactly';

  -- 3b. Deny-all tables must have ZERO policies (service-role only):
  --     claim_invites (0001), project_reports + moderation_screens (0009).
  --     Already implied by the exact match above, asserted explicitly anyway.
  select count(*) into v_count
    from pg_policies
   where schemaname = 'public'
     and tablename in ('claim_invites', 'project_reports', 'moderation_screens');

  if v_count <> 0 then
    raise exception 'RLS FAILURE: deny-all tables carry % policies; expected none (service-role only)', v_count;
  end if;
  raise notice 'PASS: deny-all tables (claim_invites, project_reports, moderation_screens) have zero policies';

  -- 3c. storage.objects: our three screenshots policies must exist
  --     (containment check — other buckets may add their own policies).
  select string_agg(format('%s [%s]', e.policyname, e.cmd), ', ' order by e.policyname)
    into v_missing
    from (values
            ('screenshots_public_read',  'SELECT'),
            ('screenshots_owner_insert', 'INSERT'),
            ('screenshots_owner_delete', 'DELETE')
         ) as e(policyname, cmd)
   where not exists (
           select 1 from pg_policies p
            where p.schemaname = 'storage'
              and p.tablename  = 'objects'
              and p.policyname = e.policyname
              and p.cmd        = e.cmd
         );

  if v_missing is not null then
    raise exception 'RLS FAILURE: storage.objects policies missing: %', v_missing;
  end if;
  raise notice 'PASS: storage.objects has the three screenshots policies';
end
$$;


-- ----------------------------------------------------------------------------
-- Section 4 — negative behavioral tests (rolled back)
-- ----------------------------------------------------------------------------
-- Impersonates a signed-in user by (a) creating a throwaway auth.users row,
-- (b) claiming the seeded @mollybuilds profile with it, then (c) switching to
-- the `authenticated` role with a matching JWT claim. Everything is undone by
-- the ROLLBACK at the end.
--
-- Fixed seed UUIDs used below:
--   mollybuilds profile: a1000000-0000-4000-8000-000000000001
--   gremlinworks draft project (prcrastinator): b2000000-0000-4000-8000-000000000009
--   throwaway auth user: f0000000-0000-4000-8000-00000000feed

begin;

-- Guard: seeds must be present.
do $$
begin
  if not exists (select 1 from public.profiles where username = 'mollybuilds') then
    raise exception 'SETUP FAILURE: seed.sql has not been applied (mollybuilds profile missing)';
  end if;
end
$$;

-- Setup (privileged): throwaway auth user + claim mollybuilds.
insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values ('f0000000-0000-4000-8000-00000000feed',
        '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        'rls-check@example.com', now(), now());

update public.profiles
   set user_id = 'f0000000-0000-4000-8000-00000000feed',
       claimed_at = now()
 where username = 'mollybuilds';

-- Become that user.
set local role authenticated;
set local request.jwt.claims =
  '{"sub": "f0000000-0000-4000-8000-00000000feed", "role": "authenticated"}';

-- T0 · sanity: JWT wiring resolves to the claimed profile. Without this, the
--      0-row negative tests below could pass vacuously.
do $$
declare
  v uuid;
begin
  v := public.current_profile_id();
  if v is distinct from 'a1000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'SETUP FAILURE: current_profile_id() = %, expected mollybuilds profile — JWT wiring broken', v;
  end if;
  raise notice 'PASS: T0 current_profile_id() resolves to the claimed profile';
end
$$;

-- T1 · positive control: updating OWN bio works (1 row).
do $$
declare
  n int;
begin
  update public.profiles set bio = 'rls-check own bio write' where username = 'mollybuilds';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'RLS FAILURE: T1 expected to update own bio (1 row), got % rows', n;
  end if;
  raise notice 'PASS: T1 own profile bio is updatable';
end
$$;

-- T2 · cannot update another profile's bio (RLS filters to 0 rows).
do $$
declare
  n int;
begin
  update public.profiles set bio = 'hijacked' where username = 'gremlinworks';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'RLS FAILURE: T2 updated % rows of another profile''s bio', n;
  end if;
  raise notice 'PASS: T2 cannot update another profile''s bio (0 rows)';
end
$$;

-- T3 · cannot set own is_admin (column not granted → insufficient_privilege).
do $$
begin
  begin
    update public.profiles set is_admin = true where username = 'mollybuilds';
    raise exception 'RLS FAILURE: T3 is_admin update was allowed for authenticated';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T3 is_admin update rejected (insufficient_privilege)';
  end;
end
$$;

-- T4 · cannot rebind own user_id (column not granted).
do $$
begin
  begin
    update public.profiles
       set user_id = '00000000-0000-0000-0000-000000000001'
     where username = 'mollybuilds';
    raise exception 'RLS FAILURE: T4 user_id update was allowed for authenticated';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T4 user_id update rejected (insufficient_privilege)';
  end;
end
$$;

-- T5 · cannot INSERT into projects (no grant; creation is service-role only).
do $$
begin
  begin
    insert into public.projects
      (profile_id, slug, github_repo_id, repo_full_name, repo_url, name)
    values
      ('a1000000-0000-4000-8000-000000000001', 'sneaky-project', 999999999,
       'mollybuilds/sneaky-project', 'https://github.com/mollybuilds/sneaky-project',
       'sneaky-project');
    raise exception 'RLS FAILURE: T5 direct project INSERT was allowed for authenticated';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T5 project INSERT rejected (insufficient_privilege)';
  end;
end
$$;

-- T6 · cannot write readme_html, even on OWN project (service-role-only column).
do $$
begin
  begin
    update public.projects
       set readme_html = '<script>alert(1)</script>'
     where slug = 'tinysynth'
       and profile_id = public.current_profile_id();
    raise exception 'RLS FAILURE: T6 readme_html update was allowed for authenticated';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T6 readme_html update rejected (insufficient_privilege)';
  end;
end
$$;

-- T7 · cannot inflate own stars_count (counter columns not granted).
do $$
begin
  begin
    update public.projects
       set stars_count = 999999
     where slug = 'tinysynth'
       and profile_id = public.current_profile_id();
    raise exception 'RLS FAILURE: T7 stars_count update was allowed for authenticated';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T7 stars_count update rejected (insufficient_privilege)';
  end;
end
$$;

-- T8 · positive control: updating OWN project tagline works (1 row).
do $$
declare
  n int;
begin
  update public.projects
     set tagline = 'a 2KB web synth you can play with your keyboard'
   where slug = 'tinysynth'
     and profile_id = public.current_profile_id();
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'RLS FAILURE: T8 expected to update own project tagline (1 row), got %', n;
  end if;
  raise notice 'PASS: T8 own project tagline is updatable';
end
$$;

-- T9 · cannot update someone else's project (0 rows).
do $$
declare
  n int;
begin
  update public.projects set tagline = 'hijacked' where slug = 'gitgoblin';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'RLS FAILURE: T9 updated % rows of another profile''s project', n;
  end if;
  raise notice 'PASS: T9 cannot update another profile''s project (0 rows)';
end
$$;

-- T10 · likes are private: no one else's rows visible; own rows are.
do $$
declare
  n_other int;
  n_own   int;
begin
  select count(*) into n_other
    from public.likes
   where profile_id is distinct from public.current_profile_id();
  if n_other > 0 then
    raise exception 'RLS FAILURE: T10 can see % like rows belonging to other profiles', n_other;
  end if;

  select count(*) into n_own
    from public.likes
   where profile_id = public.current_profile_id();
  if n_own < 1 then
    raise exception 'RLS FAILURE: T10 cannot see own like rows (seeded rows expected) — select policy too strict or JWT wiring broken';
  end if;
  raise notice 'PASS: T10 likes visibility limited to own rows (% own, 0 others)', n_own;
end
$$;

-- T11 · cannot like a draft project (WITH CHECK requires published → 42501).
do $$
begin
  begin
    insert into public.likes (profile_id, project_id)
    values (public.current_profile_id(), 'b2000000-0000-4000-8000-000000000009');
    raise exception 'RLS FAILURE: T11 liking a draft project was allowed';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T11 liking a draft project rejected (RLS with-check)';
  end;
end
$$;

-- T12 · another profile''s draft project is invisible.
do $$
declare
  n int;
begin
  select count(*) into n
    from public.projects
   where id = 'b2000000-0000-4000-8000-000000000009';
  if n <> 0 then
    raise exception 'RLS FAILURE: T12 another profile''s draft project is visible';
  end if;
  raise notice 'PASS: T12 other profiles'' drafts are invisible';
end
$$;

-- T13 · claim_invites is completely sealed (no grants → 42501 even on SELECT).
do $$
declare
  n int;
begin
  begin
    select count(*) into n from public.claim_invites;
    raise exception 'RLS FAILURE: T13 authenticated can select from claim_invites';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T13 claim_invites select rejected (insufficient_privilege)';
  end;
end
$$;

-- T14 · featured_slots exposes only the active window (seed has 1 active + 1 future).
do $$
declare
  n int;
begin
  select count(*) into n
    from public.featured_slots
   where now() < starts_at or now() > ends_at;
  if n > 0 then
    raise exception 'RLS FAILURE: T14 % out-of-window featured slots are visible', n;
  end if;
  raise notice 'PASS: T14 no out-of-window featured slots visible';
end
$$;

-- T17/T18 · 0010 lists: own list creation (public default + explicit private)
-- and adding published projects to them, all under RLS. Inserts use the
-- app-shaped column list — `id` is deliberately NOT in the INSERT grant
-- (gen_random_uuid default only), so later tests resolve ids by slug.
do $$
declare
  n int;
begin
  insert into public.collections (profile_id, name, slug)
  values (public.current_profile_id(), 'rls check public', 'rls-check-public');
  insert into public.collections (profile_id, name, slug, is_public)
  values (public.current_profile_id(), 'rls check private', 'rls-check-private', false);
  -- Items target a LIVE published project resolved at runtime — the seed
  -- fixture projects were unpublished on prod (P2.1 cleanup), so hardcoding
  -- b2000000-… ids here would trip the published-only WITH CHECK.
  insert into public.collection_items (collection_id, project_id)
  values ((select id from public.collections
            where slug = 'rls-check-public' and profile_id = public.current_profile_id()),
          (select id from public.projects
            where status = 'published' order by created_at asc limit 1)),
         ((select id from public.collections
            where slug = 'rls-check-private' and profile_id = public.current_profile_id()),
          (select id from public.projects
            where status = 'published' order by created_at asc limit 1));
  select count(*) into n
    from public.collections
   where profile_id = public.current_profile_id()
     and slug like 'rls-check-%';
  if n <> 2 then
    raise exception 'RLS FAILURE: T17 own list creation left % rows (expected 2)', n;
  end if;
  raise notice 'PASS: T17/T18 own public + private lists created with published items';
end
$$;

-- T25 · 0011 lists signal: PUBLIC membership counts, PRIVATE does not (D18).
--
-- T17/T18 above put the SAME published project into one public list AND one
-- private list, so the correct answer is exactly 1 — which makes this the
-- sharpest possible statement of the privacy rule: a naive `count(*)` over
-- collection_items would say 2. lists_count is written by the
-- trg_collection_items_signal trigger via recount_project_signals(), so this
-- also proves the trigger fired under the authenticated role.
--
-- The count is read through a privileged detour because projects.lists_count
-- is readable by anon, but we want the recount's own answer, not an RLS view.
do $$
declare
  v_project uuid;
  n int;
begin
  select id into v_project
    from public.projects where status = 'published' order by created_at asc limit 1;

  reset role;
  select lists_count into n from public.projects where id = v_project;
  set local role authenticated;

  if n <> 1 then
    raise exception 'RLS FAILURE: T25 (D18) lists_count = % for a project in 1 public + 1 private list (expected 1)', n;
  end if;
  raise notice 'PASS: T25 lists_count counts the public list only, not the private one (D18)';
end
$$;

-- T19 setup (privileged detour): a list owned by gremlinworks, then resume
-- the claimed mollybuilds identity.
reset role;
insert into public.collections (id, profile_id, name, slug)
values ('c0999999-0000-4000-8000-000000000001',
        'a1000000-0000-4000-8000-000000000002',
        'rls check other', 'rls-check-other');
set local role authenticated;
set local request.jwt.claims =
  '{"sub": "f0000000-0000-4000-8000-00000000feed", "role": "authenticated"}';

-- T19 · cannot add items to someone else's list (WITH CHECK owner guard).
-- Uses a LIVE published project so the rejection isolates ownership, not the
-- published-only clause.
do $$
begin
  begin
    insert into public.collection_items (collection_id, project_id)
    values ('c0999999-0000-4000-8000-000000000001',
            (select id from public.projects
              where status = 'published' order by created_at asc limit 1));
    raise exception 'RLS FAILURE: T19 adding an item to another profile''s list was allowed';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T19 cross-owner item insert rejected (RLS with-check)';
  end;
end
$$;

-- T20 · cannot add a DRAFT project to own list (published-only WITH CHECK,
-- mirrors T11's likes guard).
do $$
begin
  begin
    insert into public.collection_items (collection_id, project_id)
    values ((select id from public.collections
              where slug = 'rls-check-public' and profile_id = public.current_profile_id()),
            'b2000000-0000-4000-8000-000000000009');
    raise exception 'RLS FAILURE: T20 adding a draft project to a list was allowed';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T20 draft project rejected from lists (RLS with-check)';
  end;
end
$$;

-- T22 · owner cannot rewrite a list slug (column deliberately absent from the
-- UPDATE grant — stable URLs, 0010).
do $$
begin
  begin
    update public.collections
       set slug = 'hijacked-slug'
     where slug = 'rls-check-public' and profile_id = public.current_profile_id();
    raise exception 'RLS FAILURE: T22 collections.slug update was allowed';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T22 collections.slug update rejected (no column grant)';
  end;
end
$$;

-- T23 · cross-owner UPDATE/DELETE on someone else's list (P2.7).
--
-- Everything above tests INSERT `with check` clauses or column grants; before
-- this, NOTHING in either suite exercised the `using` clause of
-- collections_update_own, collections_delete_own, or
-- collection_items_delete_own. Section 3a compares policy name + cmd only,
-- never the expression — so rewriting any of those three to `using (true)`
-- passed every check in both files while letting any signed-in user rename or
-- delete any other user's list. That is not theoretical: renameList /
-- editListDescription / setListVisibility / deleteList all take the
-- collection id straight from a form field or positional arg and filter only
-- on `.eq('id', …)`, delegating authorization ENTIRELY to these policies
-- (see the header of src/app/(app)/u/[username]/lists/actions.ts).
--
-- Still gremlinworks' list from the T19 setup; session is mollybuilds.
do $$
declare
  victim constant uuid := 'c0999999-0000-4000-8000-000000000001';
  affected int;
  survived int;
begin
  update public.collections set name = 'hijacked' where id = victim;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS FAILURE: T23a renamed another profile''s list (% rows)', affected;
  end if;

  update public.collections set is_public = false where id = victim;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS FAILURE: T23b flipped visibility on another profile''s list (% rows)', affected;
  end if;

  delete from public.collections where id = victim;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS FAILURE: T23c deleted another profile''s list (% rows)', affected;
  end if;

  -- The row must still be there, under its original name.
  select count(*) into survived
    from public.collections where id = victim and name = 'rls check other';
  reset role;
  if survived <> 1 then
    raise exception 'RLS FAILURE: T23 victim list did not survive intact (% rows)', survived;
  end if;
  set local role authenticated;

  raise notice 'PASS: T23 cross-owner list rename/visibility/delete all rejected (0 rows)';
end
$$;

-- T24 · cannot delete items out of someone else's list (collection_items
-- _delete_own `using` clause — likewise previously uncovered).
do $$
declare
  victim constant uuid := 'c0999999-0000-4000-8000-000000000001';
  affected int;
  survived int;
begin
  -- Privileged detour to plant an item in the victim's list, then resume.
  reset role;
  insert into public.collection_items (collection_id, project_id)
  values (victim, (select id from public.projects
                    where status = 'published' order by created_at asc limit 1));
  set local role authenticated;

  delete from public.collection_items where collection_id = victim;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS FAILURE: T24 deleted items from another profile''s list (% rows)', affected;
  end if;

  reset role;
  select count(*) into survived from public.collection_items where collection_id = victim;
  set local role authenticated;
  if survived <> 1 then
    raise exception 'RLS FAILURE: T24 victim item did not survive (% rows)', survived;
  end if;

  raise notice 'PASS: T24 cross-owner item delete rejected (0 rows)';
end
$$;

-- Capture both list ids while the OWNER can still see them, so T21 can assert
-- against `collection_items` directly instead of through a join that the
-- collections policy already filters (P2.7 — see T21).
reset role;
create temp table rls_check_list_ids as
  select slug, id from public.collections
   where slug in ('rls-check-public', 'rls-check-private');
grant select on rls_check_list_ids to anon;

-- Switch to anon for the last checks.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

-- T15 · anon sees published projects but never drafts.
do $$
declare
  n_draft int;
  n_pub   int;
begin
  select count(*) filter (where status = 'draft'),
         count(*) filter (where status = 'published')
    into n_draft, n_pub
    from public.projects;
  if n_draft > 0 then
    raise exception 'RLS FAILURE: T15 anon can see % draft projects', n_draft;
  end if;
  if n_pub < 1 then
    raise exception 'RLS FAILURE: T15 anon sees no published projects (seeds expected) — select policy too strict';
  end if;
  raise notice 'PASS: T15 anon sees % published projects and 0 drafts', n_pub;
end
$$;

-- T16 · anon cannot write profiles at all.
do $$
begin
  begin
    update public.profiles set bio = 'anon was here' where username = 'mollybuilds';
    raise exception 'RLS FAILURE: T16 anon profile update was allowed';
  exception
    when insufficient_privilege then
      raise notice 'PASS: T16 anon profile update rejected (insufficient_privilege)';
  end;
end
$$;

-- T21 · anon sees public lists (and their items) but never private ones.
-- (Both T17/T18 lists carry exactly one item each — a visible total of 1
-- proves the private list's item is hidden along with the list itself.)
do $$
declare
  n_priv int;
  n_lists int;
  n_items int;
  n_priv_items int;
  n_pub_items int;
begin
  select count(*) filter (where slug = 'rls-check-private'), count(*)
    into n_priv, n_lists
    from public.collections
   where slug in ('rls-check-public', 'rls-check-private');
  if n_priv <> 0 or n_lists <> 1 then
    raise exception 'RLS FAILURE: T21 anon list visibility total=% private=% (expected 1/0)', n_lists, n_priv;
  end if;
  select count(*) into n_items
    from public.collection_items ci
    join public.collections c on c.id = ci.collection_id
   where c.slug in ('rls-check-public', 'rls-check-private');
  if n_items <> 1 then
    raise exception 'RLS FAILURE: T21 anon sees % list items (expected 1, the public list''s)', n_items;
  end if;

  -- The join above is a POSITIVE CONTROL only: it reads through
  -- `collections`, which `collections_select_public_or_own` has already
  -- filtered, so the private list's item drops out because its LIST is
  -- hidden — whatever `collection_items_select` says. Rewriting that policy
  -- to `using (true)` still produced n_items = 1 and a PASS, while anon could
  -- read /rest/v1/collection_items?collection_id=eq.<private-uuid> and
  -- enumerate exactly which projects sit in a private list. These two
  -- unjoined assertions are what actually pin the item policy (P2.7).
  select count(*) into n_priv_items
    from public.collection_items
   where collection_id = (select id from rls_check_list_ids where slug = 'rls-check-private');
  if n_priv_items <> 0 then
    raise exception 'RLS FAILURE: T21 anon read % item(s) of a PRIVATE list directly (expected 0)', n_priv_items;
  end if;

  select count(*) into n_pub_items
    from public.collection_items
   where collection_id = (select id from rls_check_list_ids where slug = 'rls-check-public');
  if n_pub_items <> 1 then
    raise exception 'RLS FAILURE: T21 anon read % item(s) of the PUBLIC list directly (expected 1)', n_pub_items;
  end if;

  raise notice 'PASS: T21 anon sees the public list + its item; private list and its items hidden (direct, unjoined)';
end
$$;

-- Undo everything from Section 4 (throwaway user, claim, bio writes).
rollback;

do $$
begin
  raise notice '=== ALL CHECKS PASSED (sections 1-4) — behavioral changes rolled back ===';
end
$$;
