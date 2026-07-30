# P3-D — Spend guardrails + honesty fixes + design/motion QA (shipped 2026-07-30)

Board directives: green light for tags p3b/p3c (applied), and a **tight AI
budget — "~$5 max or $1 daily — so we don't accidentally rack up a bill if a
bug slips through."** Plus the round that was next in line: the design/motion
QA sweep and two honesty fixes.

## D1 — dollar-honest budget (migration 0017)

The dollar math, verified against shipped code: both prompt builders clip
README input to 4,000 chars (the only unbounded-input door — closed), so
worst case ≈ 1,500 tokens in + ≤300 out ≈ **≤$0.0006/call** at
flash-lite-class pricing with a 2× margin. Implemented BOTH halves of Will's
"or" (belt and braces, each one env var to raise):

- `AI_DAILY_MAX` stays **800** → ≤ **$0.48/day** (under the $1 target; it's
  the schedule-derived number the pipeline was budgeted against).
- `AI_TOTAL_MAX` **new, default 5,000 lifetime** → ≤ **$3** (under $5).
  Enforced in `claim_ai_call(p_max, p_total_max)` under the same day-row
  lock (race-free: past days are immutable, today's count is lock-held).
  `0` = kill-switch on either ceiling, writing nothing — proven by I14/I14e
  in-DB and over the real PostgREST wire (service → `false`, anon → 42501).
- **Per-call timeout** — the last spend door: `AbortSignal.timeout` (30 s,
  `AI_CALL_TIMEOUT_MS`) in `chatCompletion`. A hung metered call now costs
  one ledger slot, not a whole cron window; surfaces through the existing
  error path so engines stop WITHOUT stamping.
- Refusals name the tripped ceiling (`describeRefusal` — "raise
  AI_TOTAL_MAX" vs "resets at UTC midnight"). Pipeline responses report
  `aiCallsToday` / `aiCallsTotal` next to `dbSizeMb`.
- Today's `GEMINI_API_KEY` free tier bills $0 regardless — the caps are the
  insurance already armed the day a paid key appears. Re-run the mapping if
  the model, pricing, or clip constants change.

## D2 — honesty fixes

- **List item counts count what the viewer can see.** `collection_items(count)`
  counted every member row while the detail page renders through an
  RLS-filtered `projects!inner` join — proven mismatch on real data (naive 2
  vs visible 1 with one drafted member). Both count surfaces (lists index +
  profile rail) now count the same RLS-filtered id-only embed, so the number
  is by construction what that viewer's detail page renders.
- **Screen-engine vs admin ordering: same population, intentionally different
  order.** Engine drains `decided_at` ASC (oldest debt first); admin shows
  DESC (newest exposure first). Clarified at all three sites (p2.6 record,
  screen.ts, admin page) so nobody "aligns" them. No behavior change.

## D3 — design/motion QA sweep (review-animations gate)

Loaded `.agents/skills/emil-design-eng/SKILL.md` first, audited the surfaces
shipped since M2.5's motion retrofit (P3-A list dialogs + add-to-list
control, P3-B project pages + /search + facet chips, S4 switch) against
docs/motion.md + docs/design-system.md.

### Findings table (required format)

| Before | After | Why |
| --- | --- | --- |
| — | — | **No findings.** Repo-wide static scan: zero `transition: all`, zero `ease-in`, zero raw hex/rgb in classNames, zero >300 ms UI durations, zero keyframes on rapidly-triggered elements, zero `motion`-library imports anywhere (all motion is CSS on the M2.5 tokens). |

### Verdict: **Approve**

- The new surfaces deliberately added no bespoke motion — they ride the
  M2.5-retuned primitives (dialog/dropdown/switch on `--motion-*` +
  `ease-quiet`); every new pressable carries the system press feedback
  (`active:translate-y-px`); the ⌘K palette remains animation-free.
- Reduced motion: because zero JS-driven motion exists, the globals.css
  kill switch (with the `.animate-spin` carve-out) covers 100% of app
  motion **by construction** — verified intact.
- Hover states are gated by Tailwind v4's default `(hover: hover)` variant.
- Browser passes: dark + desktop + 375px on /search (chips wrap, facets
  narrow in SQL, active styling + "clear filters" appear), project page
  (action row, honest recency, README badges), /tags, profile — zero
  console errors.

### Tooling note (not an app finding)

The in-app browser pane's synthetic clicks did not register on this page at
a non-1:1 screenshot scale (event probe: zero events reached the button;
`elementFromPoint` = the button; direct DOM dispatch runs the full
functional chain: URL → SQL-faceted results → active styling). Coordinate-
scale artifact of the pane — remember before re-diagnosing "broken" clicks
in future sessions.

## Verified

- `pnpm verify` · 732 tests · clean build · both RLS suites green (incl.
  new I14e lifetime matrix) · policy count 30 unchanged.
- Lifetime cap behavioral matrix on prod, rolled back: at-cap refuses /
  one-under claims then refuses / null = no lifetime cap / 0 refuses and
  writes nothing / daily still enforced independently.
- Wire: service `p_total_max: 0` → `false`; anon → 42501.
- Local pipeline E2E: `aiCallsToday: 0, aiCallsTotal: 0, dbSizeMb` reported.

## Known / deferred (unchanged unless noted)

- The live "pipeline refuses under real budget pressure" drill is
  deliberately not simulated on prod (it would disable the immune system to
  prove a proven path); the first real at-cap day exercises it, and the
  refusal will read as `stopKind: 'budget'` with the ceiling named.
- Search rate limiter (D29), multi-word search, facet counts, README
  full-text, trending rebalance, Supabase Pro — all unchanged.
- P4 launch round is next; carries board gates (fixture purge, robots flip,
  featured slots, launch go).
