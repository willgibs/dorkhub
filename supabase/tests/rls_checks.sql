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
            ('tags'), ('featured_slots'), ('claim_invites')
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
  raise notice 'PASS: RLS enabled on all 9 expected tables';
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
                 ('follows'), ('tags'), ('featured_slots'), ('claim_invites')) as t(table_name)
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
  raise notice 'PASS: service_role holds full DML on all 9 public tables';
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
      ('featured_slots',  'featured_slots_select_active',     'SELECT')
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
  raise notice 'PASS: public-schema policy set matches the expected 20 policies exactly';

  -- 3b. claim_invites must have ZERO policies (deny-all; service-role only).
  --     Already implied by the exact match above, asserted explicitly anyway.
  select count(*) into v_count
    from pg_policies
   where schemaname = 'public' and tablename = 'claim_invites';

  if v_count <> 0 then
    raise exception 'RLS FAILURE: claim_invites has % policies; expected none (service-role only)', v_count;
  end if;
  raise notice 'PASS: claim_invites has zero policies (deny-all for API roles)';

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

-- Switch to anon for the last two checks.
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

-- Undo everything from Section 4 (throwaway user, claim, bio writes).
rollback;

do $$
begin
  raise notice '=== ALL CHECKS PASSED (sections 1-4) — behavioral changes rolled back ===';
end
$$;
