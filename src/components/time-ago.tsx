import { cn } from '@/lib/utils';

export type TimeAgoProps = {
  /** Preformatted relative-time string, e.g. "3 days ago" or "just shipped". */
  value: string;
  /** Absolute timestamp shown on hover, e.g. "2026-07-18 14:02 UTC". */
  title?: string;
  /** Machine-readable timestamp; when present, renders a semantic <time> element. */
  dateTime?: string;
  className?: string;
};

export function TimeAgo({ value, title, dateTime, className }: TimeAgoProps) {
  const classes = cn('font-mono text-xs text-muted-foreground tabular-nums', className);
  if (dateTime) {
    return (
      <time dateTime={dateTime} title={title} className={classes}>
        {value}
      </time>
    );
  }
  return (
    <span title={title} className={classes}>
      {value}
    </span>
  );
}
