import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type SkeletonCardProps = {
  /** Hide the media block for image-less card slots. */
  showMedia?: boolean;
  className?: string;
};

/**
 * Loading shape of ProjectCard — media block, title line at 55%, tagline line
 * at 85%, then a mono-meta-sized row. Shimmer comes from ui/skeleton.
 */
export function SkeletonCard({ showMedia = true, className }: SkeletonCardProps) {
  return (
    <div aria-hidden="true" className={cn('flex w-full flex-col gap-2.5', className)}>
      {showMedia ? <Skeleton className="aspect-[1200/630] w-full rounded-md bg-surface-2" /> : null}
      <Skeleton className="h-3.5 w-[55%] bg-surface-2" />
      <Skeleton className="h-[11px] w-[85%] bg-surface-2" />
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-3 w-20 bg-surface-2" />
        <Skeleton className="h-3 w-12 bg-surface-2" />
      </div>
    </div>
  );
}
