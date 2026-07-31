# P4 — Launch round (IN FLIGHT; started 2026-07-30)

Plan of record: ~/.claude/plans/sparkling-herding-star.md. Board decisions
(Will, 2026-07-30): featured = mechanism only · big import during P4 behind
the seed-list gate · Vercel Pro at the launch window · orchestrator drafts
terms/privacy · Sentry on a DEDICATED account (separate from partyreel),
set up with Will · purge approved and executed.

## Shipped (all deployed; 752 tests, both RLS suites green on purged prod)

- **L0a backup**: first verified prod snapshot + restore runbook
  (docs/ops-backup.md, scripts/verify-restore.sh; 17/17 table parity).
- **L0b suites self-provision** (D44): zero seed.sql dependency, proven green
  BEFORE and AFTER the purge; throwaway github_ids sit outside GitHub's real
  id space (991…/9900000009xx bands).
- **L0c purge EXECUTED**: 5 fixture profiles + 9 draft projects + 2
  featured_slots + 1 claim_invite + seeded engagement, one guarded
  transaction; gallery intact at 207; the claimable fabricated-github_id
  hazard is gone. seed.sql remains for local dev.
- **L2a migration 0018** (D45): profiles SELECT is column-listed; is_admin
  off the API (wire-proven 42501). CAUGHT LIVE: four pages star-selected
  profiles and 404'd for ~10 min post-apply — fixed via PROFILE_COLUMNS /
  ProfileRow (src/lib/profiles/columns.ts); RULE: profiles may never be
  star-selected under an API role; grant changes get a projection grep first.
- **L2b Sentry code** (D49): instrumentation files, errors-only, inert until
  NEXT_PUBLIC_SENTRY_DSN lands (dedicated-account setup with Will).
- **L2c headers + CSP** (D47): report-only live (CSP_ENFORCE=1 flips);
  script/style keep 'unsafe-inline' (nonces can't live in ISR-cached HTML);
  img-src https:-wide ON PURPOSE (README bodies embed arbitrary https
  images); connect-src + report-uri derive from env; headers in
  next.config.ts, never proxy.ts.
- **L2d migration 0019** (D46): per-IP search limiter, fixed window, ledger
  pattern, fail-OPEN (deliberate inverse of the AI budget — availability for
  a read-only public endpoint; only a literal `false` 429s). Wire-proven
  60×200→3×429; 429s carry copy and both search surfaces say so. Prune rides
  the pipeline cron. I15a–f pin posture + behavior.
- **L2e audits**: advisors = zero new findings (the documented
  accepted-by-design set); pnpm audit = 4 transitive build-tool findings via
  Next (postcss/sharp), runtime-unreachable (no next/image by cost rule),
  unfixed at latest Next — accepted, re-check at L5. Next 16.2.12.
- **L3 SEO + pages**: dynamic sitemap (1,103 URLs exact = 10+207+197+689) ·
  JSON-LD (SoftwareSourceCode/ProfilePage/WebSite) · /search page-level
  noindex that SURVIVES the flip (D50) · tag meta descriptions · real
  404/error/global-error pages (Sentry-wired) · /terms + /privacy DRAFTS
  (board review at launch-go; contact hi@willgibs.com pending confirmation)
  · apple-icon + manifest · SITE_URL single source (src/lib/site.ts).
- **L1 featured mechanism** (D48): /admin/featured CRUD (parse/window
  helpers unit-tested), FeaturedStrip of REAL cards labeled on-card
  (sponsor_label or 'featured'), page-1 display dedupe only (cursor
  untouched), published-only enforced at create AND by the !inner embed
  (a moderated-away feature vanishes by construction), T29 window matrix.
  E2E on prod data: 1 labeled card, 0 duplicates, 24 total. **Will nod
  pending: the default label wording ('featured').**
- **L4 polish**: createList exhaustion names the cause; deleteList failure
  stays on the lists page with a visible error; EditListForm per-field
  failure + 'saved' state + throw-catch; surrogate-safe reason clip; admin
  ReportGroupRow shows ' · unpublished'; flagged chip mono treatment; `//`
  kickers aria-hidden; profile list rail matches the index idiom; lists
  index <title> names its owner.

## Seed-list PROPOSAL (board gate — awaiting Will)

Sized ≈4–5k candidates ≈ 1–1.5 days of pipeline drain; upsert dedupes,
decisions stay sticky, blocklist honored on every path. Skew: hobbyist soul
over mega-frameworks.

- **Topic crawls** (≤100 repos each): cli · tui · terminal · developer-tools
  · game-dev · roguelike · godot · pico-8 · generative-art · creative-coding
  · p5js · shaders · procedural-generation · selfhosted · homelab ·
  raspberry-pi · esp32 · arduino · e-ink · automation · discord-bot ·
  telegram-bot · synthesizer · midi · audio · mechanical-keyboard · qmk ·
  data-visualization · emulator · retrocomputing · demoscene · note-taking ·
  obsidian-plugin · browser-extension · userscript · wasm · neovim-plugin ·
  vscode-extension · side-project · toy · experiment · useless
- **Awesome lists** (≤100 resolved refs each): awesome-selfhosted ·
  awesome-cli-apps · awesome-tuis · awesome-creative-coding ·
  awesome-generative-art · awesome-raspberry-pi · awesome-mechanical-keyboard
  · awesome-neovim · awesome-userscripts · open-source-games lists (pick at
  run time by README quality)

## L5 as-executed (2026-07-31 — see D54/D55 for the full record)

EXECUTED at $0 under the D54 no-Pro pivot (supersedes this file's original
Pro+cron-swap steps — GH Actions is the permanent scheduler; vercel.json
dailies stay as fallback). Order run: snapshot+gates+baselines → toolbar off
→ CSP ENFORCE (burn-in clean) → domain attach (Cloudflare grey-cloud CNAMEs
→ per-project vercel-dns-017 target; mail untouched) → Supabase site_url →
robots flip + per-route canonicals + @vercel/analytics + comment hygiene →
GSC domain-property verify (dorkhub1 account, manual TXT) + sitemap submit
(36,202 URLs, arithmetic-exact) → Sentry uptime monitor → backup launchd
agent. Launch-verify caught 4 real defects (root '/index' canonical; 1k-row
sitemap truncation; 50k-cap overflow; embed-paged walk cutoff) — all fixed
and live same-session. Earlier board gates (Sentry account, featured label,
terms/privacy, seed list) had already cleared in D49/D52. Remaining:
Will's `p4`-tag green light + announce, on his clock.
