-- ============================================================================
-- dorkhub.com — initial database layer
-- ============================================================================
-- Target: Supabase (Postgres 15+).
--
-- Design notes:
--   * Admin path is service-role only. There are deliberately NO admin RLS
--     policies — the service role bypasses RLS entirely, so anything an admin
--     or backend job needs (creating projects after GitHub ownership checks,
--     writing sanitized readme_html, syncing stars, managing featured slots,
--     claim invites) happens server-side with the service key.
--   * Defense in depth: column-level GRANTs are the first gate (what a role
--     may write at all), RLS policies are the second (which rows). Users can
--     never write is_admin, github_id, user_id, counters, readme_html, or
--     star counts — those columns are simply not granted.
--   * current_profile_id() is wrapped in `(select ...)` inside policies so
--     the planner evaluates it once per statement (initplan), not per row.
--   * Counters (likes_count / saves_count / followers_count) are recounted
--     from scratch in triggers — self-healing, no drift.
--   * trending_score is Reddit-style: log-scaled engagement plus a recency
--     term (epoch seconds / 45000 ≈ 1.92 points per day). Decay is baked in
--     as recency, so no cron is needed and the stored column is indexable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extensions
-- ----------------------------------------------------------------------------

create extension if not exists citext  with schema extensions;
create extension if not exists pg_trgm with schema extensions; -- for future search

-- ----------------------------------------------------------------------------
-- 2. Types
-- ----------------------------------------------------------------------------

create type public.project_status as enum ('draft', 'published');

-- ----------------------------------------------------------------------------
-- 3. Tables
-- ----------------------------------------------------------------------------

-- profiles ------------------------------------------------------------------
-- A profile can exist before anyone signs up (seeded / scraped showcase
-- pages). user_id is null until the GitHub user claims it; github_id is the
-- immutable claim key that links a claim attempt to the right row.
create table public.profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique references auth.users (id) on delete set null,
  username        citext not null unique
                  constraint profiles_username_format
                  check (username::text ~ '^[a-zA-Z0-9](?:-?[a-zA-Z0-9]){1,38}$'),
  display_name    text
                  constraint profiles_display_name_len
                  check (char_length(display_name) <= 80),
  avatar_url      text,
  bio             text
                  constraint profiles_bio_len
                  check (char_length(bio) <= 500),
  links           jsonb not null default '[]'::jsonb
                  constraint profiles_links_is_array
                  check (jsonb_typeof(links) = 'array'),
  github_id       bigint not null unique,
  github_username text not null,
  is_admin        boolean not null default false,
  followers_count integer not null default 0,
  claimed_at      timestamptz,           -- null = unclaimed seeded profile
  created_at      timestamptz not null default now()
);

comment on table  public.profiles           is 'Showcase profiles. May exist unclaimed (user_id null) until the matching GitHub user signs in.';
comment on column public.profiles.github_id is 'Immutable claim key: numeric GitHub user id. Never user-writable.';
comment on column public.profiles.is_admin  is 'Service-role-managed only. No grant path for authenticated users.';

-- projects ------------------------------------------------------------------
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  slug             text not null
                   constraint projects_slug_format
                   check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  github_repo_id   bigint not null unique,
  repo_full_name   text not null,
  repo_url         text not null,
  name             text not null,
  tagline          text
                   constraint projects_tagline_len
                   check (char_length(tagline) <= 120),
  description_md   text
                   constraint projects_description_len
                   check (char_length(description_md) <= 10000),
  readme_html      text,                 -- sanitized at write; service-role-write-only (no column grant)
  repo_etag        text,
  readme_etag      text,
  primary_language text,
  topics           text[] not null default '{}',
  tags             text[] not null default '{}',
  demo_url         text,
  stars_count      integer not null default 0,
  forks_count      integer not null default 0,
  license          text,
  screenshots      jsonb not null default '[]'::jsonb
                   constraint projects_screenshots_shape
                   check (jsonb_typeof(screenshots) = 'array'
                          and jsonb_array_length(screenshots) <= 6),
  sort_order       integer not null default 0,
  status           public.project_status not null default 'draft',
  likes_count      integer not null default 0,
  saves_count      integer not null default 0,
  trending_score   double precision not null default 0,
  published_at     timestamptz,
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (profile_id, slug)
);

comment on table  public.projects             is 'Showcased GitHub projects. Rows are created server-side (service role) after GitHub ownership verification.';
comment on column public.projects.readme_html is 'Pre-sanitized HTML. Only the service role may write it (no column grant to authenticated) so XSS-unsafe markup can never enter via the API.';

-- project_updates -----------------------------------------------------------
create table public.project_updates (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title      text
             constraint project_updates_title_len
             check (char_length(title) <= 120),
  body_md    text not null
             constraint project_updates_body_len
             check (char_length(body_md) <= 5000),
  created_at timestamptz not null default now()
);

-- likes / saves -------------------------------------------------------------
create table public.likes (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, project_id)
);

create table public.saves (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, project_id)
);

-- follows -------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self check (follower_id <> followee_id)
);

-- tags ----------------------------------------------------------------------
-- Curated taxonomy (service-role managed). projects.tags is a free text[]
-- that usually — but not necessarily — references these slugs.
create table public.tags (
  slug       text primary key
             constraint tags_slug_format
             check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  label      text not null,
  kind       text not null
             constraint tags_kind_valid
             check (kind in ('stack', 'topic')),
  created_at timestamptz not null default now()
);

-- featured_slots ------------------------------------------------------------
create table public.featured_slots (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  sponsor_label text,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  created_at    timestamptz not null default now(),
  constraint featured_slots_window_valid check (ends_at > starts_at)
);

-- claim_invites -------------------------------------------------------------
-- Service-role only end to end: no grants, no policies. Tokens are minted
-- server-side and redeemed server-side during the GitHub claim flow.
create table public.claim_invites (
  token      uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days',
  used_at    timestamptz
);

comment on table public.claim_invites is 'Profile-claim tokens. Service-role only: zero grants and zero RLS policies for API roles.';

-- ----------------------------------------------------------------------------
-- 4. Indexes
-- ----------------------------------------------------------------------------

-- Public feeds only ever query published rows → partial indexes.
create index idx_projects_published_feed on public.projects (published_at desc, id desc)
  where status = 'published';
create index idx_projects_trending       on public.projects (trending_score desc, id desc)
  where status = 'published';
create index idx_projects_tags_gin       on public.projects using gin (tags)
  where status = 'published';
create index idx_projects_language       on public.projects (primary_language, published_at desc)
  where status = 'published';
-- Profile pages show drafts too → no partial.
create index idx_projects_profile_sort   on public.projects (profile_id, sort_order);
-- GitHub sync worker: pick published projects that were synced longest ago
-- (never-synced first).
create index idx_projects_sync_queue     on public.projects (last_synced_at asc nulls first)
  where status = 'published';

create index idx_project_updates_project on public.project_updates (project_id, created_at desc);
create index idx_likes_project           on public.likes (project_id);
create index idx_saves_project           on public.saves (project_id);
create index idx_follows_followee        on public.follows (followee_id);
create index idx_featured_slots_window   on public.featured_slots (starts_at, ends_at);

-- ----------------------------------------------------------------------------
-- 5. Functions
-- ----------------------------------------------------------------------------

-- Map the calling JWT to its claimed profile (null for anon / unclaimed).
-- SECURITY DEFINER so policy evaluation never recurses into profiles RLS.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from profiles where user_id = auth.uid();
$$;

grant execute on function public.current_profile_id() to anon, authenticated;

-- Reddit-style rank: log-scaled engagement + recency term. A save counts
-- double a like. epoch/45000 rises ~1.92 points/day, so 10x engagement is
-- worth roughly half a day of freshness. Declared immutable so it could back
-- an expression index; the now() branch only fires for unpublished rows,
-- whose score is recomputed at publish time anyway.
create or replace function public.compute_trending(likes int, saves int, pub timestamptz)
returns double precision
language sql
immutable
as $$
  select (
    log(10::numeric, (1 + greatest(likes, 0) + 2 * greatest(saves, 0))::numeric)
    + extract(epoch from coalesce(pub, now())) / 45000.0
  )::double precision;
$$;

-- projects_before_update() calls this while running as the updating user
-- (trigger functions execute with caller privileges unless SECURITY DEFINER),
-- so the API roles need EXECUTE explicitly.
grant execute on function public.compute_trending(int, int, timestamptz) to anon, authenticated;

-- Recount likes/saves for the affected project and refresh trending_score.
-- Full recount (not +-1) → self-healing if counters ever drift.
-- SECURITY DEFINER: the caller's RLS only lets them see their own likes/saves,
-- but the recount must see everyone's.
create or replace function public.bump_project_engagement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid := coalesce(new.project_id, old.project_id);
begin
  update projects p
     set likes_count    = c.n_likes,
         saves_count    = c.n_saves,
         trending_score = compute_trending(c.n_likes, c.n_saves, p.published_at)
    from (
      select
        (select count(*)::int from likes  where project_id = v_project_id) as n_likes,
        (select count(*)::int from saves  where project_id = v_project_id) as n_saves
    ) c
   where p.id = v_project_id;
  return null; -- AFTER trigger: return value ignored
end;
$$;

-- Same recount pattern for follower counts.
create or replace function public.bump_followers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_followee_id uuid := coalesce(new.followee_id, old.followee_id);
begin
  update profiles
     set followers_count = (select count(*)::int from follows
                             where followee_id = v_followee_id)
   where id = v_followee_id;
  return null;
end;
$$;

-- Housekeeping on every projects update: touch updated_at; on the
-- draft→published transition, stamp published_at (kept across re-publishes)
-- and seed the trending score.
create or replace function public.projects_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if old.status = 'draft' and new.status = 'published' then
    new.published_at   := coalesce(new.published_at, now());
    new.trending_score := compute_trending(new.likes_count, new.saves_count, new.published_at);
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Triggers
-- ----------------------------------------------------------------------------

create trigger trg_likes_engagement
  after insert or delete on public.likes
  for each row execute function public.bump_project_engagement();

create trigger trg_saves_engagement
  after insert or delete on public.saves
  for each row execute function public.bump_project_engagement();

create trigger trg_follows_counter
  after insert or delete on public.follows
  for each row execute function public.bump_followers();

create trigger trg_projects_before_update
  before update on public.projects
  for each row execute function public.projects_before_update();

-- ----------------------------------------------------------------------------
-- 7. Grants (first gate — column-level write control)
-- ----------------------------------------------------------------------------
-- Supabase default privileges grant ALL on new tables to anon/authenticated.
-- Start from zero for the API roles, then grant back exactly what the product
-- needs. (This subsumes the required `revoke update on profiles, projects`.)
-- service_role keeps its default full grants + BYPASSRLS.

revoke all on table
  public.profiles,
  public.projects,
  public.project_updates,
  public.likes,
  public.saves,
  public.follows,
  public.tags,
  public.featured_slots,
  public.claim_invites
from anon, authenticated;

-- profiles: public read; owners may edit presentation fields only.
-- NOT granted: user_id, github_id, github_username, is_admin,
-- followers_count, claimed_at, created_at, id.
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, links, avatar_url)
  on public.profiles to authenticated;

-- projects: public read; owners may edit presentation fields + publish state.
-- NOT granted: readme_html, stars/forks, counters, trending_score,
-- github_repo_id, repo_*, profile_id, slug, published_at, timestamps.
-- INSERT is intentionally absent — creation is service-role only, after
-- GitHub ownership verification.
grant select on public.projects to anon, authenticated;
grant update (tagline, description_md, tags, demo_url, screenshots, sort_order, status)
  on public.projects to authenticated;
grant delete on public.projects to authenticated;

-- project_updates: public read (RLS narrows to published/owned parents);
-- owners write. Column-limited insert/update so id/project_id/created_at
-- can't be forged or repointed after creation.
grant select on public.project_updates to anon, authenticated;
grant insert (project_id, title, body_md) on public.project_updates to authenticated;
grant update (title, body_md)             on public.project_updates to authenticated;
grant delete on public.project_updates to authenticated;

-- likes / saves: authenticated only; column-limited insert (created_at from
-- default).
grant select, delete on public.likes to authenticated;
grant insert (profile_id, project_id) on public.likes to authenticated;
grant select, delete on public.saves to authenticated;
grant insert (profile_id, project_id) on public.saves to authenticated;

-- follows: public read of the graph; authenticated manage their own edges.
grant select on public.follows to anon, authenticated;
grant insert (follower_id, followee_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

-- tags / featured_slots: read-only through the API.
grant select on public.tags           to anon, authenticated;
grant select on public.featured_slots to anon, authenticated;

-- claim_invites: no grants at all — service-role only.

-- ----------------------------------------------------------------------------
-- 8. Row Level Security (second gate — row-level control)
-- ----------------------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_updates enable row level security;
alter table public.likes           enable row level security;
alter table public.saves           enable row level security;
alter table public.follows         enable row level security;
alter table public.tags            enable row level security;
alter table public.featured_slots  enable row level security;
alter table public.claim_invites   enable row level security; -- no policies → deny all

-- profiles --------------------------------------------------------------

create policy profiles_select_all on public.profiles
  for select to anon, authenticated
  using (true);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- (no INSERT/DELETE policies: profile creation/claiming and deletion are
-- service-role flows)

-- projects --------------------------------------------------------------

create policy projects_select_published_or_own on public.projects
  for select to anon, authenticated
  using (
    status = 'published'
    or profile_id = (select public.current_profile_id())
  );

create policy projects_update_own on public.projects
  for update to authenticated
  using      (profile_id = (select public.current_profile_id()))
  with check (profile_id = (select public.current_profile_id()));

create policy projects_delete_own on public.projects
  for delete to authenticated
  using (profile_id = (select public.current_profile_id()));

-- (no INSERT policy: creation is service-role only)

-- project_updates -------------------------------------------------------

create policy project_updates_select on public.project_updates
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.projects p
       where p.id = project_id
         and (p.status = 'published'
              or p.profile_id = (select public.current_profile_id()))
    )
  );

create policy project_updates_insert_own on public.project_updates
  for insert to authenticated
  with check (
    exists (
      select 1 from public.projects p
       where p.id = project_id
         and p.profile_id = (select public.current_profile_id())
    )
  );

create policy project_updates_update_own on public.project_updates
  for update to authenticated
  using (
    exists (
      select 1 from public.projects p
       where p.id = project_id
         and p.profile_id = (select public.current_profile_id())
    )
  )
  with check (
    exists (
      select 1 from public.projects p
       where p.id = project_id
         and p.profile_id = (select public.current_profile_id())
    )
  );

create policy project_updates_delete_own on public.project_updates
  for delete to authenticated
  using (
    exists (
      select 1 from public.projects p
       where p.id = project_id
         and p.profile_id = (select public.current_profile_id())
    )
  );

-- likes -----------------------------------------------------------------
-- Own rows only, even for reads: whether a user liked something is theirs;
-- aggregate counts are exposed via projects.likes_count.

create policy likes_select_own on public.likes
  for select to authenticated
  using (profile_id = (select public.current_profile_id()));

create policy likes_insert_own on public.likes
  for insert to authenticated
  with check (
    profile_id = (select public.current_profile_id())
    and exists (
      select 1 from public.projects p
       where p.id = project_id and p.status = 'published'
    )
  );

create policy likes_delete_own on public.likes
  for delete to authenticated
  using (profile_id = (select public.current_profile_id()));

-- saves -----------------------------------------------------------------

create policy saves_select_own on public.saves
  for select to authenticated
  using (profile_id = (select public.current_profile_id()));

create policy saves_insert_own on public.saves
  for insert to authenticated
  with check (
    profile_id = (select public.current_profile_id())
    and exists (
      select 1 from public.projects p
       where p.id = project_id and p.status = 'published'
    )
  );

create policy saves_delete_own on public.saves
  for delete to authenticated
  using (profile_id = (select public.current_profile_id()));

-- follows ---------------------------------------------------------------

create policy follows_select_all on public.follows
  for select to anon, authenticated
  using (true);

create policy follows_insert_own on public.follows
  for insert to authenticated
  with check (follower_id = (select public.current_profile_id()));

create policy follows_delete_own on public.follows
  for delete to authenticated
  using (follower_id = (select public.current_profile_id()));

-- tags ------------------------------------------------------------------

create policy tags_select_all on public.tags
  for select to anon, authenticated
  using (true);

-- featured_slots --------------------------------------------------------
-- Only currently-active slots are visible; scheduling stays private.

create policy featured_slots_select_active on public.featured_slots
  for select to anon, authenticated
  using (now() between starts_at and ends_at);

-- claim_invites: intentionally zero policies (deny-all for API roles).

-- ----------------------------------------------------------------------------
-- 9. Storage — screenshots bucket
-- ----------------------------------------------------------------------------
-- Public-read bucket, 2 MiB cap, images only. Object paths are namespaced by
-- profile id: `<profile_id>/<project-slug>/<file>` — the first path segment
-- must match the caller's claimed profile for writes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  true,
  2097152, -- 2 MiB
  array['image/webp', 'image/png', 'image/jpeg']
)
on conflict (id) do nothing;

create policy screenshots_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'screenshots');

create policy screenshots_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = (select public.current_profile_id())::text
  );

create policy screenshots_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = (select public.current_profile_id())::text
  );
