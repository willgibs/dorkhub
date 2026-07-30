import * as Sentry from '@sentry/nextjs';

/**
 * Server + edge error monitoring (P4 L2b). DSN-driven and deliberately INERT
 * until NEXT_PUBLIC_SENTRY_DSN exists in the environment (`enabled: false`
 * no-ops every capture) — the code ships ahead of the account decision, the
 * same degrade-quietly posture as GithubConfigError.
 *
 * Errors only: tracesSampleRate 0 keeps the free-tier quota for defects, not
 * performance envelopes. No replay, no PII. The DSN is a publishable key
 * (safe in NEXT_PUBLIC_*); CSP's connect-src derives its Sentry entry from
 * this same var in next.config.ts — one source of truth.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.VERCEL_ENV ?? 'development',
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

// RSC / server-action / route-handler errors (Next 15+ hook).
export const onRequestError = Sentry.captureRequestError;
