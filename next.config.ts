import type { NextConfig } from 'next';

/**
 * Security headers (P4 L2c). Set here — NOT in src/proxy.ts — so the
 * auth-critical proxy stays scoped to its documented job (session refresh +
 * presence gating only) and headers apply uniformly, including to paths the
 * proxy matcher excludes.
 *
 * CSP shape, and why it is what it is:
 * - script-src keeps 'unsafe-inline': the app is ISR/static-heavy by design
 *   (the $0 posture) and per-request nonces cannot live inside cached HTML;
 *   hashing is impossible for Next's per-page RSC bootstrap scripts. The
 *   backstop value lives in everything else: no eval, no external script
 *   hosts, object/base/frame/form all locked.
 * - style-src keeps 'unsafe-inline': React style={} attributes SSR to literal
 *   style="…" (language-dot, screenshot-gallery, card stagger).
 * - img-src is deliberately https:-wide, NOT an enumerated host list —
 *   sanitized README bodies embed arbitrary https images (badges,
 *   screenshots); the sanitizer is scheme-restricted by design.
 * - connect-src derives from env: the Supabase origin from
 *   NEXT_PUBLIC_SUPABASE_URL, the Sentry ingest origin from
 *   NEXT_PUBLIC_SENTRY_DSN (absent DSN → no entry; one source of truth with
 *   src/instrumentation.ts).
 * - Violations report to Sentry's security endpoint (derived from the same
 *   DSN), which is what makes the report-only burn-in observable.
 *
 * Rollout: Content-Security-Policy-Report-Only by default; set CSP_ENFORCE=1
 * in Vercel env after a clean burn-in to flip the header name (env change =
 * redeploy, no commit). CSP ships only in production builds — Next dev uses
 * eval and would drown the console in false violations.
 */
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin;
  } catch {
    return null;
  }
})();

const sentryFromDsn = (() => {
  try {
    const dsn = new URL(process.env.NEXT_PUBLIC_SENTRY_DSN ?? '');
    return {
      ingestOrigin: `https://${dsn.host}`,
      // https://<host>/api/<project-id>/security/?sentry_key=<public-key>
      reportUri: `https://${dsn.host}/api${dsn.pathname}/security/?sentry_key=${dsn.username}`,
    };
  } catch {
    return null;
  }
})();

const connectSrc = ["'self'", supabaseOrigin, sentryFromDsn?.ingestOrigin]
  .filter(Boolean)
  .join(' ');

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data:",
  'media-src https:',
  "font-src 'self'",
  `connect-src ${connectSrc}`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  ...(sentryFromDsn ? [`report-uri ${sentryFromDsn.reportUri}`] : []),
].join('; ');

const cspHeader = {
  key:
    process.env.CSP_ENFORCE === '1'
      ? 'Content-Security-Policy'
      : 'Content-Security-Policy-Report-Only',
  value: csp,
};

const securityHeaders = [
  ...(process.env.NODE_ENV === 'production' ? [cspHeader] : []),
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
