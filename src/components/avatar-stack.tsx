import { cn } from '@/lib/utils';

export type AvatarStackUser = {
  username: string;
  initial: string;
};

export type AvatarStackProps = {
  users: AvatarStackUser[];
  /** How many avatars to show before collapsing into a +N chip. Default 4. */
  max?: number;
  className?: string;
};

/**
 * Overlapping initial-avatars (exploration `.avatar`: primary-soft circle,
 * primary mono initial) with a +N overflow chip past `max`.
 */
export function AvatarStack({ users, max = 4, className }: AvatarStackProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((user) => (
        <span
          key={user.username}
          title={`@${user.username}`}
          className="-ml-2 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-[11px] font-bold text-primary ring-2 ring-background first:ml-0"
        >
          <span aria-hidden="true">{user.initial}</span>
          <span className="sr-only">@{user.username}</span>
        </span>
      ))}
      {overflow > 0 && (
        <span className="-ml-2 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-secondary px-1 font-mono text-[10.5px] text-muted-foreground ring-2 ring-background tabular-nums">
          +{overflow}
        </span>
      )}
    </div>
  );
}
