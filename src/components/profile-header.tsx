import type { ReactNode } from 'react';
import { TagChip } from '@/components/tag-chip';
import type { FixtureAuthor } from '@/lib/fixtures';
import { cn } from '@/lib/utils';

export type ProfileLink = {
  label: string;
  href: string;
};

export type ProfileHeaderProps = {
  author: FixtureAuthor;
  /**
   * Avatar image (GitHub CDN or our storage bucket). Rendered as a plain img
   * per the cost rules — never through an image optimizer. Falls back to the
   * initial-letter avatar when absent.
   */
  avatarUrl?: string | null;
  /** Personal links rendered as clean chips (no hash prefix). */
  links?: ProfileLink[];
  /** Slot for a FollowButton (kept outside — this component holds no state). */
  followButton?: ReactNode;
  className?: string;
};

/**
 * ProfileHeader — 76px initial avatar, display name + mono @username + follow
 * slot, muted bio, mono stats row, link chips. Matches the reference
 * `.profile-header`; zero counts render as absence, never "0".
 */
export function ProfileHeader({
  author,
  avatarUrl,
  links,
  followButton,
  className,
}: ProfileHeaderProps) {
  return (
    <header className={cn('flex items-start gap-[22px] max-md:flex-col', className)}>
      {avatarUrl ? (
        // biome-ignore lint/performance/noImgElement: cost rule — user images never go through the image optimizer (docs/architecture.md)
        <img
          src={avatarUrl}
          alt=""
          width={76}
          height={76}
          className="size-[76px] flex-none rounded-full border object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-[76px] flex-none items-center justify-center rounded-full bg-primary-soft font-mono text-[30px] font-bold text-primary"
        >
          {author.initial}
        </span>
      )}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3.5">
          <h1 className="font-display text-[26px] font-extrabold">{author.displayName}</h1>
          <span className="font-mono text-sm text-muted-foreground">@{author.username}</span>
          {followButton}
        </div>
        <p className="max-w-[520px] text-[15px] text-muted-foreground">{author.bio}</p>
        {(author.projects > 0 || author.followers > 0) && (
          <div className="tabular-nums flex gap-[18px] font-mono text-[12.5px] text-muted-foreground">
            {author.projects > 0 && <span>{countLabel(author.projects, 'project')}</span>}
            {author.followers > 0 && <span>{countLabel(author.followers, 'follower')}</span>}
          </div>
        )}
        {links !== undefined && links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <TagChip key={link.href} tag={link.label} href={link.href} />
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function countLabel(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}
