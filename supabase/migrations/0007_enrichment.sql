-- 0007: AI enrichment columns (P2) — docs/plans/p2-discovery.md.
-- ingest_candidates is a zero-grant table (0006): anon/authenticated hold no
-- privileges, so new columns inherit the deny-all posture automatically;
-- service_role DML flows from 0003's default privileges. No grants, no
-- policies here — rls_checks_ingestion.sql section I8 asserts all of this.
--
-- ai_tagline/ai_tags are FALLBACKS, written by the admin enrichment action
-- (Vercel AI Gateway) only for candidates missing a GitHub description or
-- topics. At approval, real GitHub data always wins: description beats
-- ai_tagline, topics beat ai_tags. Admin reviews ai_* on the queue row
-- before approving; in P2.5 the same fields become the automatic
-- pre-publish quality floor.

alter table public.ingest_candidates
  add column ai_tagline text
    constraint ingest_candidates_ai_tagline_len check (char_length(ai_tagline) <= 120),
  add column ai_tags text[] not null default '{}',
  add column enriched_at timestamptz;

comment on column public.ingest_candidates.ai_tagline is
  'AI-generated fallback tagline — used at approval only when the GitHub description is absent; reviewed on the queue row first.';
comment on column public.ingest_candidates.ai_tags is
  'AI-suggested tags (normalized slugs, ≤6) — used at approval only when GitHub topics are empty.';
comment on column public.ingest_candidates.enriched_at is
  'When the enrichment pass last ran for this candidate (set even when the model returned nothing usable, so batches don''t retry forever).';
