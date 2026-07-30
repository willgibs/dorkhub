'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import { copy } from '@/lib/copy';

import './globals.css';

/**
 * Catastrophic boundary — replaces the ROOT layout, so it must render its own
 * <html>/<body> and re-import globals.css (the root layout's import is gone
 * with it). :root in globals.css IS the dark theme (dark-first), so tokens
 * work without ThemeProvider; next/font variables are layout-bound and
 * unavailable here — the font stack degrades to the CSS fallbacks, which is
 * acceptable for a page whose job is admitting the app fell over.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center text-foreground">
          <p className="text-lg font-semibold tracking-tight">
            dorkhub<span className="text-primary">_</span>
          </p>
          <p className="max-w-md text-[15px] text-muted-foreground">{copy.error}</p>
          <a
            href="/"
            className="rounded-md border px-4 py-2 font-mono text-[12.5px] text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px"
          >
            {copy.notFoundCta}
          </a>
        </div>
      </body>
    </html>
  );
}
