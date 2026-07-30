import * as Sentry from '@sentry/nextjs';

/**
 * Browser error monitoring — same contract as src/instrumentation.ts: inert
 * without NEXT_PUBLIC_SENTRY_DSN, errors only (no tracing, no replay — both
 * cost bundle bytes and quota that a pre-launch gallery has no use for).
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  tracesSampleRate: 0,
  sendDefaultPii: false,
});
