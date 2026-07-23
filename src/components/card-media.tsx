'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

export type CardMediaProps = {
  /** og-image hotlink (see `@/lib/projects/github-og`). */
  src: string;
  /** Placeholder rendered underneath — revealed on load failure via onError. */
  children: ReactNode;
};

/** One delayed retry before giving up — see the onError note below. */
const RETRY_DELAY_MS = 1500;

/**
 * Fills its parent (a fixed-aspect container set by the caller) with a lazy
 * hotlinked `<img>` layered over a placeholder.
 *
 * onError retries ONCE after a short delay before falling back (P2.5.1,
 * first-user QA: a big import renders 100+ og hotlinks in one burst and a
 * few transient load failures were latching cards onto the placeholder until
 * the next visit). The retry busts the browser's negative cache with a query
 * param — GitHub's og CDN ignores unknown params. A second failure hides the
 * img for good; the placeholder shows through (docs/plans/p2-discovery.md
 * Wave 1A decision 2).
 */
export function CardMedia({ src, children }: CardMediaProps) {
  const [attempt, setAttempt] = useState(0);
  const [broken, setBroken] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  function handleError() {
    if (attempt === 0) {
      retryTimer.current = setTimeout(() => setAttempt(1), RETRY_DELAY_MS);
    } else {
      setBroken(true);
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Underlay is absolutely positioned: CSS aspect-ratio is only a
          preferred ratio, and an in-flow placeholder SVG's intrinsic height
          would stretch the caller's aspect box past it (caught in P2 QA). */}
      <div className="absolute inset-0">{children}</div>
      {broken ? null : (
        // biome-ignore lint/performance/noImgElement: cost rule — user images never go through the image optimizer (docs/architecture.md)
        <img
          key={attempt}
          src={attempt === 0 ? src : `${src}?retry=1`}
          alt=""
          loading="lazy"
          decoding="async"
          onError={handleError}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
