import Link from 'next/link';
import type { ReactNode } from 'react';

import { AvatarBadge } from '@/components/avatar-badge';
import { LanguageDot } from '@/components/language-dot';
import { PageShell } from '@/components/page-shell';
import { type Stat, StatBlock } from '@/components/stat-block';
import { TagChip } from '@/components/tag-chip';
import { copy } from '@/lib/copy';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';

export type ProfileLink = {
  label: string;
  href: string;
};

export type ProfileMastheadProps = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  /** Personal links, rendered as clean chips (no hash prefix). */
  links?: ProfileLink[];
  /** dorkhub follows, not GitHub followers. */
  followers: number;
  projectCount: number;
  /** Summed stars across the projects listed here — attention, not authorship. */
  totalStars: number;
  /** Languages they actually ship in, derived from their listed projects. */
  languages: Array<{ name: string; color: string }>;
  githubUsername: string | null;
  /** True when no GitHub account has claimed this page. */
  unclaimed: boolean;
  /** FollowButtonIsland slot — kept outside so this stays a server component. */
  followButton?: ReactNode;
  className?: string;
};

const quietLink =
  'rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * The maker masthead — same spine as the project page (identity left, labeled
 * figures right, actions along a hairline below), so moving between a project
 * and the person who made it feels like one product rather than two templates.
 *
 * What it adds over the old ProfileHeader: the page says what someone is INTO,
 * not just who they are. Languages and the star total are derived from the
 * projects already fetched for the grid below — no extra query — and they are
 * the fastest read on whether this is a maker worth following.
 */
export function ProfileMasthead({
  username,
  displayName,
  avatarUrl,
  bio,
  links,
  followers,
  projectCount,
  totalStars,
  languages,
  githubUsername,
  unclaimed,
  followButton,
  className,
}: ProfileMastheadProps) {
  const stats: Stat[] = [];
  if (projectCount > 0)
    stats.push({ label: copy.statsUnitProjects, tone: 'figure', value: String(projectCount) });
  if (followers > 0)
    stats.push({ label: copy.followerUnit, tone: 'figure', value: formatCount(followers) });
  if (totalStars > 0)
    stats.push({ label: copy.profileTotalStars, tone: 'figure', value: formatCount(totalStars) });

  return (
    <header className={cn('relative isolate border-b', className)}>
      <div
        aria-hidden="true"
        className="bg-halftone pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(620px_240px_at_28%_30%,black,transparent_72%)] [-webkit-mask-image:radial-gradient(620px_240px_at_28%_30%,black,transparent_72%)]"
      />
      <PageShell className="flex flex-col gap-7 pt-8 pb-7 sm:pt-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-1 gap-5">
            <AvatarBadge
              src={avatarUrl}
              initial={displayName.charAt(0).toLowerCase()}
              sizeClassName="size-16 sm:size-[84px]"
              initialClassName="text-[26px] sm:text-[32px]"
              className="border"
            />
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="font-display text-[32px] leading-[1.05] font-extrabold tracking-tight sm:text-[40px]">
                  {displayName}
                </h1>
                <p className="font-mono text-[13px] text-muted-foreground">@{username}</p>
              </div>

              {bio ? (
                <p className="max-w-[52ch] text-[15.5px] leading-relaxed text-muted-foreground">
                  {bio}
                </p>
              ) : null}

              {links !== undefined && links.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {links.map((link) => (
                    <TagChip key={link.href} tag={link.label} href={link.href} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <StatBlock stats={stats} className="lg:w-[260px] lg:shrink-0" />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-6">
          {followButton}
          {githubUsername ? (
            <a
              href={`https://github.com/${githubUsername}`}
              target="_blank"
              rel="noopener"
              className={cn('font-mono text-[12.5px] text-muted-foreground', quietLink)}
            >
              github.com/{githubUsername}
            </a>
          ) : null}
          {languages.length > 0 ? (
            <p className="flex flex-wrap items-center gap-3 sm:ml-auto">
              <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                {copy.profileWorksIn}
              </span>
              {languages.map((language) => (
                <LanguageDot
                  key={language.name}
                  language={language.name}
                  color={language.color}
                  className="text-[12.5px]"
                />
              ))}
            </p>
          ) : null}
        </div>

        {/* Unclaimed honesty (vision principle 4): the page says it was curated
            rather than authored, and the claim link is the "and here is what
            you can do about it" half — a badge with no route to act on it is
            disclosure without agency. */}
        {unclaimed ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed px-4 py-3">
            <p className="font-mono text-[11.5px] text-muted-foreground">{copy.unclaimedBadge}</p>
            <Link
              href="/claim"
              className={cn('font-mono text-[11.5px] text-link hover:underline', quietLink)}
            >
              {copy.unclaimedIsThisYou}
            </Link>
          </div>
        ) : null}
      </PageShell>
    </header>
  );
}
