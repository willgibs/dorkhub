-- ============================================================================
-- 0010: public lists (P3-A — docs/plans/p3-lists.md)
-- ============================================================================
-- User-owned, RLS-first tables (saves/star_imports pattern, not the admin
-- deny-all pattern): collections are named groupings of published projects a
-- profile curates; public by default, optionally private. No updated_at
-- trigger (house pattern: created_at-only off the projects table). No
-- position column v1 — items render added_at desc. User-facing copy says
-- "lists"; tables keep the board-approved "collections" name.

create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  name        text not null
              constraint collections_name_len
              check (char_length(name) between 1 and 60),
  slug        text not null
              constraint collections_slug_len
              check (char_length(slug) <= 80),
  description text
              constraint collections_description_len
              check (char_length(description) <= 280),
  is_public   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (profile_id, slug)
);

comment on table public.collections is
  'User-curated lists of published projects (P3-A). Own-rows + is_public RLS — mirrors saves/star_imports ownership.';
comment on column public.collections.slug is
  'Stable per-profile URL segment (/u/<username>/lists/<slug>). Renaming never re-slugs — suffixed once at creation (src/lib/lists/slug.ts). Deliberately absent from the UPDATE grant.';

create table public.collection_items (
  collection_id uuid not null references public.collections (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, project_id)
);

comment on table public.collection_items is
  'Membership rows. No position column v1 — rendered added_at desc.';

create index idx_collection_items_project on public.collection_items (project_id);

-- ----------------------------------------------------------------------------
-- Grants (first gate) + RLS (second gate)
-- ----------------------------------------------------------------------------

revoke all on table public.collections, public.collection_items from anon, authenticated;

grant select on public.collections to anon, authenticated;
grant insert (profile_id, name, slug, description, is_public) on public.collections to authenticated;
-- slug intentionally excluded from UPDATE — see column comment.
grant update (name, description, is_public) on public.collections to authenticated;
grant delete on public.collections to authenticated;

grant select on public.collection_items to anon, authenticated;
grant insert (collection_id, project_id) on public.collection_items to authenticated;
grant delete on public.collection_items to authenticated;

alter table public.collections      enable row level security;
alter table public.collection_items enable row level security;

create policy collections_select_public_or_own on public.collections
  for select to anon, authenticated
  using (is_public or profile_id = (select public.current_profile_id()));

create policy collections_insert_own on public.collections
  for insert to authenticated
  with check (profile_id = (select public.current_profile_id()));

create policy collections_update_own on public.collections
  for update to authenticated
  using      (profile_id = (select public.current_profile_id()))
  with check (profile_id = (select public.current_profile_id()));

create policy collections_delete_own on public.collections
  for delete to authenticated
  using (profile_id = (select public.current_profile_id()));

create policy collection_items_select on public.collection_items
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.collections c
       where c.id = collection_id
         and (c.is_public or c.profile_id = (select public.current_profile_id()))
    )
  );

create policy collection_items_insert_own on public.collection_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.collections c
       where c.id = collection_id and c.profile_id = (select public.current_profile_id())
    )
    and exists (
      select 1 from public.projects p where p.id = project_id and p.status = 'published'
    )
  );

create policy collection_items_delete_own on public.collection_items
  for delete to authenticated
  using (
    exists (
      select 1 from public.collections c
       where c.id = collection_id and c.profile_id = (select public.current_profile_id())
    )
  );
