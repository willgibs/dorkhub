/**
 * Canonical site origin — the single source for every absolute URL the app
 * emits (metadataBase, robots' sitemap pointer, sitemap entries, JSON-LD).
 * Hardcoded on purpose: this IS the canonical domain, decided ahead of the
 * DNS attach (P4 L5); auth redirects deliberately do NOT use it — they
 * derive from x-forwarded-host so previews and the vercel.app alias keep
 * working (src/lib/auth/redirects.ts).
 */
export const SITE_URL = 'https://dorkhub.com';
