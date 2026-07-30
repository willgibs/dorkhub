# P3-C — Scale hardening (shipped 2026-07-29/30)

207 → 10k → 50k projects. Everything here was **measured, not guessed**:
synthetic 10k projects / 100k ingest candidates inside rolled-back
transactions against prod, EXPLAIN ANALYZE on every hot path, prod integrity
re-verified after every simulation. The harness that produced the numbers is
committed as `supabase/tests/scale_probe.sql` (D36) — re-measure any future
change in one command instead of re-deriving.

## Board decisions (Will)

1. **Pay for AI throughput, with a hard budget.** Bulk imports are mostly
   above the 20-star auto-approve threshold, so they skip retro-screening —
   the round builds the ceiling (D33), not over-provisioned throughput.
2. **Trending: accept for now** — recency-dominated by construction
   (engagement term maxes ~2.5 vs ~1.92/day recency); at import scale
   trending ≈ newest. Rebalance waits for real engagement data.
3. **Storage: monitor now, Pro when forced.** 49 MB of 500 at round start
   (~14 KB/project marginal → ceiling near 35–40k projects).

## Locked decisions

- **D31 — feed seek is an RPC** (`feed_page`, migration 0014). The generated
  sort-key alternative is impossible (`to_char` is STABLE, not IMMUTABLE —
  Postgres rejects the expression). Dynamic SQL from CONSTANT fragments with
  `USING` binds, on purpose: static plpgsql with `IS NULL OR` guards goes
  generic after ~5 calls and the row comparison degrades back to a filter —
  the exact bug being fixed. No user-shaped value ever reaches SQL text.
- **D32 — `feed_page` is SECURITY INVOKER.** RLS applies as the caller;
  proven: anon sees zero drafts through it. Must never become DEFINER.
- **D33 — the AI budget is a DB ledger** (`ai_usage` + atomic
  `claim_ai_call(p_max)`, migration 0013). Serverless instances share no
  memory, so only a shared row can enforce a ceiling. Fail-closed at every
  layer: no slot → no call; unreachable ledger → no call; `AI_DAILY_MAX=0`
  is a real kill-switch (INSERT arm guarded too). Execute revoked from API
  roles — an anon caller could otherwise drain the day's budget as a DoS.
- **D34 — import and moderation split** (`/api/cron/ingest` vs
  `/api/cron/pipeline`). Four passes cost ~61 s against one 50 s window;
  now each worker owns a window. Resolves P2.7's pass-3 starvation
  structurally. Actions pings pipeline first (safety), then ingest with
  `if: always()`. Vercel's 2 Hobby fallback crons stay on sync + pipeline —
  if Actions dies, imports pause, safety doesn't.
- **D35 — `/weird` picks via uuid pivot**, not count(*)+OFFSET (was 7,020
  buffers/6.6 ms per request at 10k, force-dynamic). `id >= random uuid`
  seeks the pkey O(log n); rare miss wraps around. Retires that route's
  documented OFFSET exception. Gap-weighted rather than exactly uniform —
  invisible for serendipity.
- **D36 — the scale harness is a committed artifact** —
  `supabase/tests/scale_probe.sql`, deterministic data (no `random()`),
  self-rolling-back, with pass/fail tells in the header.
- **D37 — generated columns are excluded from the counters guard.**
  REGRESSION FOUND BY THIS ROUND'S VERIFICATION: in BEFORE UPDATE triggers,
  generated columns are NULL on NEW (they compute after), so 0012's
  `language_slug` made EVERY update of a language-having project read as an
  edit — likes/saves/list toggles bumped `updated_at` ("just shipped on
  every like", the 0001 bug reintroduced silently that same day). Fixed in
  0016; pinned by negative-controlled T26.
- **D38 — the ingest route materializes demand-first** (`demand_count desc,
  stars_count desc`): matches `idx_ingest_candidates_queue` (the stars-only
  order cost 267–318 ms at 100k pending, parallel seq scan — probe P8b) AND
  matches the order the admin queue shows humans. Demand = real user
  requests; they should outrank raw stars anyway.

## Measured before → after (scale_probe.sql, 10k/100k)

| Path | Before | After |
| --- | --- | --- |
| Deep feed page (full shape) | `.or()`: `Rows Removed by Filter: 7001`, **3.57 ms**, O(offset) | `Index Cond: ROW(...)`, **0.64–0.75 ms warm**, flat with depth (first call in a session ~2.6 ms plpgsql compile) |
| One profile's project list (live payload) | `select('*')`: **219,774 B** | card projection: **556 B** |
| `/weird` per request | count seq scan + OFFSET: **~6.6 ms**, 7,020 buffers | two pkey seeks: **O(log n)** |
| `/tags` per revalidation | O(projects) rows over the wire | O(distinct tags); revalidate 300→900 |
| Ingest candidate select at 100k | stars-only order: **267–318 ms** parallel seq scan | index order: **0.1 ms** |
| 10k-gallery sync refresh | 200/day fixed → **50 days** | deadline-governed daily walk + 50/tick slice ≈ 5,800/day → **~2 days** |
| Visibility flip recount | ≤400 function calls ≈ 1,200 subqueries | one set-based UPDATE (lateral indexed counts) |
| AI spend ceiling | none anywhere | ledger-enforced `AI_DAILY_MAX` (default 800), all three call paths claim first |

Validated as healthy at scale (do NOT "optimize"): trigram indexes get chosen
at 10k (they idle at 216 rows because a seq scan wins — correct); ingest
queue index-only at 100k (0.1 ms); language facet 0.1 ms; feed page 1
0.06 ms.

## Verification highlights

- **Row parity before speed** (C1): zero mismatches old-vs-RPC across both
  sorts × both cursor depths × tag/language/following × author columns
  (psql), then live HTTP parity local-new vs deployed-old including
  **cross-implementation cursor interchange** (an in-flight client's cursor
  survives the deploy) and full-row equality.
- **Budget fail-closed, layered**: I14 (atomic ceiling + zero-ceiling refusal
  on an empty ledger, in-DB), the real PostgREST wire (service `p_max=0` →
  `false`; anon → 42501), unit tests (any non-`true` payload refuses), and
  code-path review. The live pipeline-refusal drill deliberately NOT run by
  setting prod `AI_DAILY_MAX=0` — that would disable the immune system for a
  redundant proof; the first real budget-pressure day exercises it.
- **T26 negative-controlled**: the broken 0011 guard was temporarily restored
  inside a rolled-back transaction and the assertion demonstrably fires.
- Prod integrity after every simulation: 216 projects, 0 probe leftovers
  (integrity predicate uses exact synthetic id ranges — a broad `>= 9e11`
  sweep would false-positive on the seed fixtures at 900287465110+).

## Known / deferred

- No per-call AI timeout (a hung provider call still eats a run's window) —
  unchanged from P2.7's deferral list.
- No search rate limiter (D29) — though `ai_usage` is now the shared-state
  pattern one would reuse.
- Enrich-selection seq scan (probe P9): ~4 ms at 10k × ~200/day — measured,
  left alone; revisit only if the enrichable backlog becomes permanent.
- `idx_profiles_username_trgm` still unused — flagged; needs an EXPLAIN at
  real profile scale before dropping.
- The screen-vs-admin decided_at ASC/DESC divergence, README truncation,
  facet counts, `/browse` — all unchanged from prior deferral lists.
- `dbSizeMb` includes bloat until autovacuum reclaims (58 MB right after the
  probe churn vs 49 MB baseline) — read trends, not single samples.
