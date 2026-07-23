-- ============================================================================
-- 0006: ingestion / import engine (P1 — docs/plans/p1-gallery-engine.md)
-- ============================================================================
-- New tables are admin/system machinery, deny-all for API roles by default
-- (claim_invites pattern) — the ONE exception is star_imports: genuinely
-- user-owned data (a user's imported GitHub stars), so it mirrors saves/likes
-- with narrow own-rows RLS. service_role DML on all four is covered by 0003's
-- default privileges; rls_checks asserts it so the 0003 bug class can't
-- regress silently.

-- ----------------------------------------------------------------------------
-- ingest_candidates — one row per external repo not (yet) a dorkhub project
-- ----------------------------------------------------------------------------
-- PK is the immutable numeric GitHub id (same convention as
-- projects.github_repo_id): renames self-heal, and approval re-fetches fresh
-- by this id — candidate metadata is a disposable snapshot, never the
-- write-time source of truth.

create table public.ingest_candidates (
  github_repo_id    bigint primary key,
  owner_github_id   bigint not null,
  owner_login       text not null,
  repo_full_name    text not null,
  repo_url          text not null,
  name              text not null,
  description       text
                    constraint ingest_candidates_description_len
                    check (char_length(description) <= 500),
  primary_language  text,
  topics            text[] not null default '{}',
  license           text,
  stars_count       integer not null default 0,
  forks_count       integer not null default 0,
  fetched_at        timestamptz not null default now(),
  source            text not null
                    constraint ingest_candidates_source_valid
                    check (source in ('star_import', 'topic_crawl', 'awesome_list', 'admin_manual')),
  demand_count      integer not null default 0,
  status            text not null default 'pending'
                    constraint ingest_candidates_status_valid
                    check (status in ('pending', 'approved', 'rejected', 'superseded')),
  rejection_reason  text,
  decided_by        uuid references public.profiles (id) on delete set null,
  decided_at        timestamptz,
  materialized_project_id uuid references public.projects (id) on delete set null,
  created_at        timestamptz not null default now()
);

comment on table public.ingest_candidates is
  'Pre-review pool of external GitHub repos (star import / crawls / manual). Deny-all RLS — service role behind requireAdmin() only.';
comment on column public.ingest_candidates.demand_count is
  'Distinct importing profiles, recounted by trg_star_imports_demand — self-healing, never drifts. Accrues even on rejected rows (resurfacing signal).';

create index idx_ingest_candidates_queue
  on public.ingest_candidates (demand_count desc, stars_count desc, github_repo_id)
  where status = 'pending';
create index idx_ingest_candidates_owner
  on public.ingest_candidates (owner_github_id);

-- ----------------------------------------------------------------------------
-- star_imports — ledger of a dorkhub user's imported public GitHub stars
-- ----------------------------------------------------------------------------
-- github_repo_id is deliberately NOT an FK: it may reference
-- projects.github_repo_id (already live) OR ingest_candidates.github_repo_id
-- (pending review) — no single FK covers both, and the row must survive a
-- candidate's approval (it then also materializes a saves row).

create table public.star_imports (
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  github_repo_id  bigint not null,
  starred_at      timestamptz not null,
  imported_at     timestamptz not null default now(),
  primary key (profile_id, github_repo_id)
);

comment on table public.star_imports is
  'One row per (user, starred repo). Drives candidate demand ranking and retroactive save-materialization at approval.';

create index idx_star_imports_repo on public.star_imports (github_repo_id);

-- ----------------------------------------------------------------------------
-- ingest_blocklist — consent: never (re-)ingest a repo or owner
-- ----------------------------------------------------------------------------

create table public.ingest_blocklist (
  id               uuid primary key default gen_random_uuid(),
  scope            text not null check (scope in ('repo', 'owner')),
  github_repo_id   bigint,
  github_owner_id  bigint,
  reason           text,
  requested_by     text,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  constraint ingest_blocklist_scope_shape check (
    (scope = 'repo'  and github_repo_id  is not null and github_owner_id is null) or
    (scope = 'owner' and github_owner_id is not null and github_repo_id  is null)
  )
);

comment on table public.ingest_blocklist is
  'Owner-/repo-scoped removal requests. Checked by EVERY candidate-creating write path — blocked entries are silently never (re-)surfaced.';

create unique index idx_ingest_blocklist_repo
  on public.ingest_blocklist (github_repo_id) where scope = 'repo';
create unique index idx_ingest_blocklist_owner
  on public.ingest_blocklist (github_owner_id) where scope = 'owner';

-- ----------------------------------------------------------------------------
-- ingest_crawl_runs — audit/observability for admin-triggered crawls
-- ----------------------------------------------------------------------------

create table public.ingest_crawl_runs (
  id                  uuid primary key default gen_random_uuid(),
  source              text not null check (source in ('topic_crawl', 'awesome_list')),
  params              jsonb not null default '{}'::jsonb,
  triggered_by        uuid references public.profiles (id) on delete set null,
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  status              text not null default 'running'
                      check (status in ('running', 'done', 'error')),
  candidates_created  integer not null default 0,
  candidates_touched  integer not null default 0,
  error_detail        text
);

create index idx_ingest_crawl_runs_started on public.ingest_crawl_runs (started_at desc);

-- ----------------------------------------------------------------------------
-- Functions & triggers
-- ----------------------------------------------------------------------------

-- Self-healing demand recount (template: bump_project_engagement).
create or replace function public.bump_candidate_demand()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_repo_id bigint := coalesce(new.github_repo_id, old.github_repo_id);
begin
  update ingest_candidates
     set demand_count = (
       select count(distinct profile_id)::int
       from star_imports
       where github_repo_id = v_repo_id
     )
   where github_repo_id = v_repo_id;
  return null;
end;
$$;

revoke execute on function public.bump_candidate_demand() from public, anon, authenticated;

create trigger trg_star_imports_demand
  after insert or delete on public.star_imports
  for each row execute function public.bump_candidate_demand();

-- Queue hygiene: any path that turns a repo into a real project (approval OR
-- an owner self-adding via /new) flips a still-pending candidate off the
-- queue. Decided rows ('approved'/'rejected') are never silently rewritten.
create or replace function public.supersede_pending_candidate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update ingest_candidates
     set status = 'superseded',
         materialized_project_id = new.id,
         decided_at = now()
   where github_repo_id = new.github_repo_id
     and status = 'pending';
  return null;
end;
$$;

revoke execute on function public.supersede_pending_candidate() from public, anon, authenticated;

create trigger trg_projects_supersede_candidate
  after insert on public.projects
  for each row execute function public.supersede_pending_candidate();

-- ----------------------------------------------------------------------------
-- Grants (first gate) + RLS (second gate)
-- ----------------------------------------------------------------------------

revoke all on table
  public.ingest_candidates,
  public.star_imports,
  public.ingest_blocklist,
  public.ingest_crawl_runs
from anon, authenticated;

grant select on public.star_imports to authenticated;
grant insert (profile_id, github_repo_id, starred_at) on public.star_imports to authenticated;
grant delete on public.star_imports to authenticated;

alter table public.ingest_candidates enable row level security;  -- no policies → deny all
alter table public.star_imports      enable row level security;
alter table public.ingest_blocklist  enable row level security;  -- no policies → deny all
alter table public.ingest_crawl_runs enable row level security;  -- no policies → deny all

create policy star_imports_select_own on public.star_imports
  for select to authenticated
  using (profile_id = (select public.current_profile_id()));

create policy star_imports_insert_own on public.star_imports
  for insert to authenticated
  with check (profile_id = (select public.current_profile_id()));

create policy star_imports_delete_own on public.star_imports
  for delete to authenticated
  using (profile_id = (select public.current_profile_id()));
