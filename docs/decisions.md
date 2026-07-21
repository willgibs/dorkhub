# Decisions (append-only, one dated line each)

- 2026-07-21 · v1 = full shaped scope (profiles, GitHub connect, project pages, feed, like/save/follow); featured-slot monetization deferred but schema anticipates it.
- 2026-07-21 · Cold start = seed + open launch: admin-seeded unclaimed profiles; claim authorized ONLY by immutable GitHub numeric id match in one atomic UPDATE; invite tokens are UX, never authorization.
- 2026-07-21 · Stack: Next.js 16 / Tailwind v4 / shadcn / Supabase / Vercel / Biome / pnpm. Single app, route groups, no monorepo.
- 2026-07-21 · Auth-decoupled profiles: profiles.id standalone uuid, nullable unique user_id → auth.users; enables pre-claim seeded content.
- 2026-07-21 · GitHub provider_token deliberately unused — one server PAT (public read-only) for ALL GitHub reads; Supabase OAuth = identity only.
- 2026-07-21 · Trending = write-time Reddit-style score (log10 engagement + epoch/45000); indexable, no cron.
- 2026-07-21 · Screenshots never touch Vercel image optimization: client-side resize → WebP renditions → Supabase public bucket → unoptimized serving (top cost trap on both platforms).
- 2026-07-21 · Design locked: "quiet dev-native" (01+02 hybrid) — Instrument Sans / Geist / JetBrains Mono, ice-cyan accent, charcoal neutral, 0.45rem radius, dark-first. Refs: paper.design, resend.com, basehub.com, cosmos.network.
- 2026-07-21 · Micro-details are intentional product surface (Will: "minor design details make a product feel special") — preserve, don't minimalize.
- 2026-07-21 · DB on hold: Supabase free slots 2/2 (hopper, qrcdn); Will declined pausing either or upgrading. SQL ships in-repo, unapplied.
- 2026-07-21 · Frugality: execution subagents run sonnet/haiku; Fable orchestrates. TypeScript pinned to 5.x (7.0 preview breaks Next 16 build worker).
- 2026-07-21 · Vercel Hobby during build; Pro ($20/mo) at public launch (Hobby ToS is non-commercial); Spend Management on day one of Pro.
- 2026-07-21 · `/design/components` styleguide rule "fed ONLY by fixtures+copy" applies strictly to the 24 design-system components; raw shadcn primitives (Button, Select, etc.) may use self-describing labels (e.g. a button reading "outline") since they carry no product voice of their own.
- 2026-07-21 · `.claude/launch.json`'s `app` dev-server config got `"autoPort": true` — port 3000 is frequently held by a sibling project (qrcdn) on this machine.
