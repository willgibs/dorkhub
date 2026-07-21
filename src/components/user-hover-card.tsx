'use client';

import type { ReactNode } from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type { FixtureAuthor } from '@/lib/fixtures';
import { cn } from '@/lib/utils';

export type UserHoverCardProps = {
  user: FixtureAuthor;
  /** The trigger — must be a single element (rendered via asChild). */
  children: ReactNode;
  className?: string;
};

/**
 * Wraps its trigger in a hover-card showing a mini profile: initial avatar,
 * display name, @username, bio, and a mono stat line.
 */
export function UserHoverCard({ user, children, className }: UserHoverCardProps) {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent align="start" className={cn('w-72 shadow-overlay', className)}>
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-base font-bold text-primary"
          >
            {user.initial}
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm leading-tight font-bold">{user.displayName}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed">{user.bio}</p>
        <p className="mt-3 font-mono text-[12.5px] text-muted-foreground tabular-nums">
          {user.projects} projects · {user.followers} followers
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
