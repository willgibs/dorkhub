'use client';

import { type ReactNode, useState } from 'react';

export type CardMediaProps = {
  /** og-image hotlink (see `@/lib/projects/github-og`). */
  src: string;
  /** Placeholder rendered underneath — revealed on load failure via onError. */
  children: ReactNode;
};

/**
 * Fills its parent (a fixed-aspect container set by the caller) with a lazy
 * hotlinked `<img>` layered over a placeholder. `onError` hides the img via
 * state rather than unmounting it, so a later successful load (e.g. a
 * revisit) isn't needed to recover — the placeholder just shows through once
 * hidden (docs/plans/p2-discovery.md Wave 1A decision 2).
 */
export function CardMedia({ src, children }: CardMediaProps) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Underlay is absolutely positioned: CSS aspect-ratio is only a
          preferred ratio, and an in-flow placeholder SVG's intrinsic height
          would stretch the caller's aspect box past it (caught in P2 QA). */}
      <div className="absolute inset-0">{children}</div>
      {broken ? null : (
        // biome-ignore lint/performance/noImgElement: cost rule — user images never go through the image optimizer (docs/architecture.md)
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
