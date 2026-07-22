import Link from 'next/link';
import { cn } from '@/lib/utils';

export type TagChipProps = {
  tag: string;
  /** Defaults to `/t/${tag}`. Pass explicitly for filter chips or external profile links. */
  href?: string;
  active?: boolean;
  /**
   * Leading "#" at 55% opacity. True on project cards/pages; false (default) for
   * filter chips and profile links.
   */
  hashPrefix?: boolean;
  className?: string;
};

export function TagChip({
  tag,
  href,
  active = false,
  hashPrefix = false,
  className,
}: TagChipProps) {
  return (
    <Link
      href={href ?? `/t/${encodeURIComponent(tag)}`}
      className={cn(
        'inline-flex items-center rounded-md border bg-surface-2 px-[11px] py-1 font-mono text-xs leading-[1.4] text-muted-foreground transition-colors hover:text-foreground',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        hashPrefix && "before:mr-px before:opacity-55 before:content-['#']",
        active && 'border-primary bg-primary-soft text-primary hover:text-primary',
        className,
      )}
    >
      {tag}
    </Link>
  );
}
