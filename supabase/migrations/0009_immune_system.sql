-- ============================================================================
-- 0009: immune system — user reports + AI moderation screens (P2.6,
-- docs/plans/p2.6-immune-system.md)
-- ============================================================================
-- Both tables are moderation-sensitive (forgeable / brigade-visible if
-- client-writable) — deny-all: RLS on, zero policies, zero grants.
-- service_role DML flows from 0003's default privileges. Asserted in
-- rls_checks_ingestion.sql I8-I12.

create table public.project_reports (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  reporter_profile_id uuid not null references public.profiles (id) on delete cascade,
  reason              text not null
                      constraint project_reports_reason_valid
                      check (reason in ('spam', 'malware', 'not-a-project', 'abuse', 'other')),
  note                text
                      constraint project_reports_note_len
                      check (char_length(note) <= 500),
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz,
  resolved_by         uuid references public.profiles (id) on delete set null,
  unique (project_id, reporter_profile_id)
);

comment on table public.project_reports is
  'User reports on a published project. Deny-all RLS — service role behind reportProject()/requireAdmin() only. Unique (project,reporter) is lifetime: no re-report path (accepted v1).';
comment on column public.project_reports.reason is
  'Same enum lives in src/lib/moderation/report-policy.ts (client Select + server action validation).';

create index idx_project_reports_open
  on public.project_reports (created_at desc)
  where resolved_at is null;

create table public.moderation_screens (
  project_id uuid primary key references public.projects (id) on delete cascade,
  source     text not null
             constraint moderation_screens_source_valid
             check (source in ('retro', 'report')),
  verdict    text not null
             constraint moderation_screens_verdict_valid
             check (verdict in ('ok', 'review', 'flagged')),
  reason     text
             constraint moderation_screens_reason_len
             check (char_length(reason) <= 240),
  model      text,
  created_at timestamptz not null default now()
);

comment on table public.moderation_screens is
  'One AI triage verdict per project — re-screens upsert-overwrite (on conflict project_id). Triage only: AI never auto-unpublishes (P2.6 ADR). Deny-all RLS.';

revoke all on table public.project_reports, public.moderation_screens from anon, authenticated;

alter table public.project_reports    enable row level security;  -- no policies → deny all
alter table public.moderation_screens enable row level security;  -- no policies → deny all
