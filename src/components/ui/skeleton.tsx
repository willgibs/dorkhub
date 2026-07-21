import { cn } from '@/lib/utils';

/**
 * Shimmer sweep (docs/motion.md) — a moving highlight band on `::after`
 * instead of a flat opacity pulse; `overflow-hidden` clips it to the
 * skeleton's own radius. Pure CSS keyframe, so the global reduced-motion
 * kill switch in globals.css neutralizes it automatically (no extra JS).
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden rounded-md bg-accent',
        "after:absolute after:inset-0 after:animate-shimmer-sweep after:bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--foreground)_10%,transparent),transparent)] after:content-['']",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
