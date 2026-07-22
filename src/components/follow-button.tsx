'use client';

import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type FollowButtonProps = {
  following: boolean;
  onToggle?: () => void;
  /** True while follow/unfollow isn't wired up yet (M5) — renders inert. */
  disabled?: boolean;
  className?: string;
};

/**
 * Follow toggle: primary CTA (with the phosphor halo primary buttons get) when
 * not yet following; quiet surface-2 "following" state once you are.
 */
export function FollowButton({ following, onToggle, disabled, className }: FollowButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={following ? 'secondary' : 'default'}
      aria-pressed={following}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'text-[13px] font-semibold active:translate-y-px',
        following
          ? 'border bg-surface-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          : 'shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent),0_4px_18px_color-mix(in_oklab,var(--primary)_20%,transparent)] hover:bg-primary hover:brightness-[1.07]',
        className,
      )}
    >
      {following ? copy.following : copy.follow}
    </Button>
  );
}
