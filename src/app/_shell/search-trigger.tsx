'use client';

import { Search } from 'lucide-react';
import { openSearchPalette } from '@/app/_shell/search-palette-store';
import { Kbd } from '@/components/site-header';
import { copy } from '@/lib/copy';

/**
 * Header search affordance — opens the command palette (search-palette-store
 * + command-palette.tsx). Desktop (sm:+) is pixel-identical to the previous
 * decorative placeholder div (docs/plans/m5.5-curator.md Wave 2); below sm it
 * collapses to an icon-only size-9 bordered button so it fits the mobile
 * two-row header (site-header.tsx). `order-10 ml-auto sm:order-none sm:ml-0`
 * docks it to the right of the mobile nav row while returning it to its
 * flexible middle slot between nav and the CTA cluster on desktop.
 */
export function SearchTrigger() {
  return (
    <button
      type="button"
      aria-label="search projects"
      onClick={openSearchPalette}
      className="order-10 ml-auto flex size-9 items-center justify-center gap-2 rounded-lg border border-input bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:translate-y-px sm:order-none sm:ml-0 sm:size-auto sm:max-w-[260px] sm:flex-1 sm:justify-start sm:px-3 sm:py-1.5 sm:text-[13px]"
    >
      <Search className="size-4" aria-hidden="true" />
      <span className="hidden truncate sm:inline">{copy.searchPlaceholder}</span>
      <Kbd className="ml-auto hidden sm:inline-flex">⌘K</Kbd>
    </button>
  );
}
