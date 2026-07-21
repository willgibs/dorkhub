import type { ReactNode } from 'react';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type EmptyStateProps = {
  /** Plain-text message; ignored when children are provided. */
  message?: string;
  /** Rich content (e.g. message + CTA) rendered instead of `message`. */
  children?: ReactNode;
  className?: string;
};

/** Dashed-border invitation box — empty states invite, they never scold. */
export function EmptyState({ message = copy.emptyFeed, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'w-full rounded-lg border-[1.5px] border-dashed px-[26px] py-[34px] text-center text-[14.5px] text-muted-foreground',
        className,
      )}
    >
      {children ?? message}
    </div>
  );
}
