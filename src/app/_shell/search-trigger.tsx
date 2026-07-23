'use client';

import { Search } from 'lucide-react';
import { openSearchPalette } from '@/app/_shell/search-palette-store';

/**
 * Header search affordance — opens the command palette (search-palette-store
 * + command-palette.tsx). P2 demotes search to icon-only at ALL widths
 * (docs/plans/p2-discovery.md: discovery over lookup, locked decision 1) —
 * the old sm:+ text-pill treatment (m5.5-curator.md Wave 2) implied "search
 * is how you find things here"; dorkhub leads with browsing/serendipity
 * instead. `order-10 ml-auto` docks it to the right of the mobile nav row
 * while returning it to its slot between nav and the CTA cluster on desktop
 * (`sm:order-none sm:ml-0` — unrelated to the old pill sizing removed here).
 */
export function SearchTrigger() {
  return (
    <button
      type="button"
      aria-label="search projects"
      title="search — ⌘K"
      onClick={openSearchPalette}
      className="order-10 ml-auto flex size-9 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:translate-y-px sm:order-none sm:ml-0"
    >
      <Search className="size-4" aria-hidden="true" />
    </button>
  );
}
