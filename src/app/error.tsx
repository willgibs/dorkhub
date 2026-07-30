'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

import { copy } from '@/lib/copy';

/**
 * Root error boundary. Deliberately minimal chrome — the SiteHeader sits
 * inside the subtree that just crashed, so this renders its own wordmark
 * instead of re-mounting components that may be the problem. Errors report
 * to Sentry (inert without a DSN, src/instrumentation-client.ts).
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="bg-bloom flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <Link href="/" className="font-display text-lg font-semibold tracking-tight">
        dorkhub<span className="text-primary">_</span>
      </Link>
      <p className="max-w-md text-[15px] text-muted-foreground">{copy.error}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border px-4 py-2 font-mono text-[12.5px] text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px"
      >
        {copy.errorRetry}
      </button>
    </div>
  );
}
