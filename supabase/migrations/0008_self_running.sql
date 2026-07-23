-- 0008: self-running gallery, wave 1 (P2.5 — docs/plans/p2.5-self-running.md)
--
-- projects.enriched_at: provenance + no-retry marker for the background
-- enrichment pipeline. The pipeline fills tagline only when NULL and tags
-- only when '{}' — it never overwrites human or GitHub data — and stamps
-- this column whenever the model genuinely answered (usable or not), so
-- duds never retry forever. syncProject never writes tagline/tags/this
-- column (verified P2.5 planning), so the daily sync cron can't collide.
--
-- NO grant changes: authenticated's projects UPDATE column-grant list must
-- NOT gain enriched_at — service-role-only via 0003 default privileges.
-- rls_checks.sql asserts the absence explicitly.

alter table public.projects add column enriched_at timestamptz;

comment on column public.projects.enriched_at is
  'When the AI enrichment pipeline last answered for this project (fill-only writes; set even when the reply was unusable, so batches don''t retry duds).';

-- Retro-moderation queue (publish-all, board 2026-07-23): auto-approved =
-- status 'approved' with decided_by NULL (human decisions always stamp
-- decided_by). This partial index serves the admin "published, unreviewed"
-- list, newest exposure first.
create index idx_ingest_candidates_retro
  on public.ingest_candidates (decided_at desc)
  where status = 'approved' and decided_by is null;
