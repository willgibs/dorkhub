# Serving cost — what it looks like when it's healthy

Written after the 2026-08-03 incident, so the next regression is visible in a
dashboard rather than on a bill.

## What happened

Three days after launch (robots flipped, 36,206-URL sitemap submitted), a
crawler walking the sitemap effectively exhausted a free Vercel team's monthly
resources.

**Cause:** every URL in that sitemap resolved to a dynamic route that Vercel
served `cache-control: private, no-cache, no-store`. Each hit was a full
function invocation with React SSR — including a ~15 KB README render on every
project page. Nothing was cached, so a crawler and a human cost the same.

**Why it was invisible:** the routes *looked* cached. They used the cookie-free
anon client, they exported `revalidate`, and the profile page carried a comment
explaining how carefully it stayed "static/cacheable". All true, all
insufficient. A dynamic segment (`[tag]`, `[username]`, `[slug]`) with no
`generateStaticParams` never enters Next's full route cache at all.

## The one-line diagnostic

```bash
python3 -c "import json;print(json.load(open('.next/prerender-manifest.json'))['dynamicRoutes'].keys())"
```

Empty output = **no dynamic route is cacheable**. That was the symptom, in one
line, and it was true for months.

At runtime, the same thing shows as:

```bash
curl -sI https://dorkhub.com/t/rust | grep -iE 'cache-control|x-vercel-cache'
```

Healthy: `public, max-age=0, must-revalidate` and `HIT` on a second request.
Broken: `private, no-cache, no-store` and `MISS` every time.

## The meter, read at the peak (2026-08-03, Hobby, rolling 30 days)

The runtime logs said WHICH routes. Only the dashboard says which LIMIT.

| metric | used | Hobby | |
|---|---|---|---|
| **Fluid Active CPU** | **5h 50m** | **4h** | **146% — the binding constraint** |
| ISR Writes | 165K | 200K | 83% |
| Fast Origin Transfer | 8.25 GB | 10 GB | 82% |
| Function Invocations | 784K | 1M | 78% |
| Edge Requests | 425K | 1M | 43% |
| ISR Reads | 87K | 1M | 9% |
| Fast Data Transfer | 7.97 GB | 100 GB | 8% |

Two lessons in that table. **Active CPU is what runs out first** — not
invocations, not bandwidth — so the thing to protect is *renders*, not
requests. And **ISR Writes had nothing to do with the crawl**: four global
feed pages revalidating at a 60-second window produce ~230 writes an hour,
which is 165K over thirty days almost exactly. A short window on a page
nobody is watching is a standing cost.

Firewall (same day): 7.5k requests/hour, Bot Protection **inactive**, 2 IPs
denied by DDoS mitigation. Hobby exposes no user-agent breakdown, so whether
the crawler is Googlebot or something ruder is still unproven.

## Baseline (post-fix, 2026-08-03)

Route-level invocations from Vercel runtime logs, grouped by `route`.

| route | before (per 3h) | notes |
|---|---|---|
| `/t/[tag]` | 5,505 | ~1,800/hour, every one a MISS |
| `/u/[username]` | 1,036 | |
| `/u/[username]/[slug]` | 403 | crawler hadn't reached these in bulk yet |
| `/auth/signin` | 163 | crawlers bouncing off gated routes |

Healthy shape after the fix: first hit on a URL renders, every hit inside the
revalidate window is a CDN `HIT`. Watch for `/t/[tag]` climbing back toward
four figures per hour — that means caching broke again.

## The rules that keep it healthy

1. **A dynamic route needs `generateStaticParams` to be cacheable.** The list
   can be short (100 entries); `dynamicParams` stays default-true so the long
   tail renders on demand and is cached after. The point is opting the ROUTE
   in, not prerendering the corpus.
2. **A route's effective revalidate is the MINIMUM across every cache it
   reads.** This bit us three times in one day: `/t/[tag]` declared 3600 and
   re-rendered every 60s because `getFeedPage`'s `unstable_cache` said 60;
   the project page would have been held to 300 by `getRelatedProjects`. When
   you set a page's `revalidate`, check every `unstable_cache` beneath it.
3. **Cookie-free is necessary but not sufficient.** Reading `cookies()`
   anywhere in the tree forces dynamic rendering — but removing the cookie
   read does not by itself make anything cache (see rule 1).
4. **Size cache windows by how many URLs they back.** The five global feed
   sorts can afford a minute; a tagged feed backs ~24,700 crawlable URLs and
   cannot.
5. **A short revalidate on an unwatched page is a standing cost**, paid in
   ISR writes and CPU forever, whether or not anyone visits. Size the window
   by how much the content actually moves.
6. **Anything crawlable is a cost.** Adding a route family or lowering a
   sitemap threshold multiplies renders. `src/app/robots.ts` and the
   thresholds in `src/app/sitemap.ts` are cost controls; both say so.

## Known, still open

- **Soft 404s**: a nonexistent project or profile URL returns HTTP 200 with
  404 content, because `loading.tsx` flushes the shell before `notFound()`
  runs. Pre-existing (confirmed on prod before the fix). Crawler-visible and
  worth fixing.
- **On-demand revalidation** from the pipeline cron would let the hour go much
  longer with no staleness. See the note in `src/app/api/cron/pipeline/route.ts`.
- **The tag long tail is closed to crawlers** (`Disallow: /t/` + 280
  `$`-anchored Allows in `src/app/robots.ts`) and the sitemap thresholds are
  aggressive (tags ≥50, profiles ≥5). Both were set under duress and both are
  meant to be relaxed: nothing is noindexed, the pages work and stay linked.
  Lower the threshold when the CPU number says there's room — with numbers,
  not by feel.
- **Web Analytics is not actually enabled** (the API 404s), so there is no
  human-vs-crawler traffic split. Worth turning on before tuning further.
