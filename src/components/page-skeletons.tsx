import { MastheadBand } from '@/components/masthead-band';
import { PageShell } from '@/components/page-shell';
import { SkeletonCard } from '@/components/skeleton-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Enough cards to fill the fold at desktop width without paying for a full page. */
const GRID_CARDS = 6;

/**
 * Route-level loading shapes (W4).
 *
 * The U2 bar asked for designed states and this was the last one missing: a
 * navigation to a feed or a project page showed the previous page until the
 * server answered, then swapped wholesale. These render the LAYOUT — a
 * masthead band, a filter row, a card grid — so the page assembles in place
 * instead of jumping when the data lands. Shapes, never spinners.
 *
 * `aria-hidden` throughout with `aria-busy` on the region: a screen reader
 * gets "busy", not a description of fake content.
 */
function Region({ children }: { children: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-live="polite">
      {children}
    </div>
  );
}

/** Masthead band: kicker, headline, a line of prose, and the right-hand figures. */
export function MastheadSkeleton({ lines = 1 }: { lines?: number }) {
  return (
    <MastheadBand>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col gap-4">
          <Skeleton className="h-3 w-24 bg-surface-2" />
          <Skeleton className="h-9 w-[42%] bg-surface-2" />
          {Array.from({ length: lines }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder
            <Skeleton key={i} className="h-4 w-[62%] bg-surface-2" />
          ))}
        </div>
        <div aria-hidden="true" className="flex gap-6 lg:w-[260px] lg:shrink-0">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-16 bg-surface-2" />
            <Skeleton className="h-5 w-12 bg-surface-2" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-16 bg-surface-2" />
            <Skeleton className="h-5 w-12 bg-surface-2" />
          </div>
        </div>
      </div>
    </MastheadBand>
  );
}

/** The gallery grid, at the same rhythm FeedSection renders. */
export function FeedGridSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      {Array.from({ length: GRID_CARDS }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** A feed route: filter chips over the gallery. */
export function FeedPageSkeleton() {
  return (
    <Region>
      <PageShell className="flex flex-col gap-6 py-10">
        <div aria-hidden="true" className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-20 bg-surface-2" />
          <Skeleton className="h-7 w-16 bg-surface-2" />
          <Skeleton className="h-7 w-16 bg-surface-2" />
        </div>
        <FeedGridSkeleton />
      </PageShell>
    </Region>
  );
}

/** A tag route: masthead band, then the same feed shape. */
export function TagPageSkeleton() {
  return (
    <Region>
      <MastheadSkeleton />
      <PageShell className="flex flex-col gap-6 py-10">
        <div aria-hidden="true" className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-20 bg-surface-2" />
          <Skeleton className="h-7 w-16 bg-surface-2" />
        </div>
        <FeedGridSkeleton />
      </PageShell>
    </Region>
  );
}

/** A project page: masthead, then the reading column beside its rail. */
export function ProjectPageSkeleton() {
  return (
    <Region>
      <MastheadSkeleton lines={2} />
      <PageShell className="flex flex-col gap-16 py-10 sm:gap-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div
            aria-hidden="true"
            className="edge-highlight flex min-w-0 flex-1 flex-col gap-3 rounded-lg border bg-card p-8 lg:max-w-[780px]"
          >
            <Skeleton className="h-3 w-24 bg-surface-2" />
            <Skeleton className="h-6 w-[45%] bg-surface-2" />
            {Array.from({ length: 6 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder
              <Skeleton key={i} className="h-3.5 w-full bg-surface-2" />
            ))}
            <Skeleton className="h-3.5 w-[70%] bg-surface-2" />
          </div>
          <div
            aria-hidden="true"
            className="edge-highlight flex flex-col gap-3 rounded-lg border bg-card p-5 lg:w-[260px] lg:shrink-0"
          >
            <Skeleton className="h-2.5 w-16 bg-surface-2" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full bg-surface-2" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-[70%] bg-surface-2" />
                <Skeleton className="h-3 w-[45%] bg-surface-2" />
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </Region>
  );
}

/**
 * A lists page: heading over divided rows.
 *
 * Exists because `u/[username]/loading.tsx` would otherwise cover the lists
 * routes underneath it, and a profile masthead over a card grid is the wrong
 * promise for a page that renders a typographic list. Route-level loading
 * boundaries inherit downward — the shape has to be checked per subtree, not
 * per page (the same trap the root `not-found` fell into in U2).
 */
export function ListsPageSkeleton() {
  return (
    <Region>
      <PageShell className="flex flex-col gap-8 py-10">
        <Skeleton aria-hidden="true" className="h-7 w-40 bg-surface-2" />
        <div aria-hidden="true" className="flex flex-col divide-y divide-border">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder
            <div key={i} className="flex flex-col gap-2 py-4">
              <Skeleton className="h-4 w-[30%] bg-surface-2" />
              <Skeleton className="h-3 w-[55%] bg-surface-2" />
            </div>
          ))}
        </div>
      </PageShell>
    </Region>
  );
}

/** A profile: masthead with an avatar, then the project grid. */
export function ProfilePageSkeleton() {
  return (
    <Region>
      <MastheadBand>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
          <div aria-hidden="true" className="flex min-w-0 flex-1 gap-5">
            <Skeleton className="size-16 shrink-0 rounded-full bg-surface-2 sm:size-[84px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <Skeleton className="h-9 w-[38%] bg-surface-2" />
              <Skeleton className="h-3.5 w-24 bg-surface-2" />
              <Skeleton className="h-4 w-[55%] bg-surface-2" />
            </div>
          </div>
          <div aria-hidden="true" className="flex gap-6 lg:w-[260px] lg:shrink-0">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-2.5 w-16 bg-surface-2" />
              <Skeleton className="h-5 w-10 bg-surface-2" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-2.5 w-16 bg-surface-2" />
              <Skeleton className="h-5 w-10 bg-surface-2" />
            </div>
          </div>
        </div>
      </MastheadBand>
      <PageShell className="flex flex-col gap-6 py-10">
        <div aria-hidden="true" className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20 bg-surface-2" />
          <Skeleton className="h-7 w-[30%] bg-surface-2" />
        </div>
        <FeedGridSkeleton />
      </PageShell>
    </Region>
  );
}
