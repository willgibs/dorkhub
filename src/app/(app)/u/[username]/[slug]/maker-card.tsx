import Link from 'next/link';
import type { ReactNode } from 'react';

import { AvatarBadge } from '@/components/avatar-badge';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type MakerCardProps = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followers: number;
  /** True when no GitHub account has claimed this profile (16,971 of 16,972 today). */
  unclaimed: boolean;
  /** FollowButtonIsland slot — kept outside so this stays a server component. */
  followButton?: ReactNode;
  className?: string;
};

/**
 * The maker, as a companion to the README rather than a byline above it.
 *
 * This is also where the project page finally tells the truth about the
 * dominant case: nearly every project on dorkhub was curated from public
 * GitHub data and its maker has never signed in. The profile page has
 * disclosed that since P3-B; the project page — the surface people actually
 * arrive on from search — has not. Vision principle 4 wants the disclosure
 * AND the route to act on it, so the badge ships with the claim link.
 */
export function MakerCard({
  username,
  displayName,
  avatarUrl,
  bio,
  followers,
  unclaimed,
  followButton,
  className,
}: MakerCardProps) {
  return (
    <section
      className={cn('edge-highlight flex flex-col gap-3 rounded-lg border bg-card p-5', className)}
    >
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
        <span aria-hidden="true">{'// '}</span>
        {copy.projectMadeBy}
      </p>

      <Link
        href={`/u/${username}`}
        className="group flex items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        <AvatarBadge
          src={avatarUrl}
          initial={displayName.charAt(0).toLowerCase()}
          sizeClassName="size-11"
          initialClassName="text-[17px]"
        />
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-display text-[15px] font-bold transition-colors group-hover:text-primary">
            {displayName}
          </span>
          <span className="truncate font-mono text-[12px] text-muted-foreground">@{username}</span>
        </span>
      </Link>

      {bio ? <p className="line-clamp-3 text-[13.5px] text-muted-foreground">{bio}</p> : null}

      {followers > 0 ? (
        <p className="tabular-nums font-mono text-[12px] text-muted-foreground">
          {followers} {followers === 1 ? copy.followerUnitOne : copy.followerUnit}
        </p>
      ) : null}

      {followButton ? <div className="pt-0.5">{followButton}</div> : null}

      {unclaimed ? (
        <div className="flex flex-col gap-1.5 border-t pt-3">
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            {copy.unclaimedBadge}
          </p>
          <Link
            href="/claim"
            className="w-fit rounded-sm font-mono text-[11.5px] text-link outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {copy.unclaimedIsThisYou}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
