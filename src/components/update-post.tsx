import { TimeAgo } from '@/components/time-ago';
import { cn } from '@/lib/utils';

export type UpdatePostProps = {
  title: string;
  /** Relative date string, e.g. "3 days ago". */
  date: string;
  body: string;
  className?: string;
};

/**
 * UpdatePost — a small changelog/devlog card: display title, mono TimeAgo date,
 * muted body. Matches the reference `.update-post`.
 */
export function UpdatePost({ title, date, body, className }: UpdatePostProps) {
  return (
    <article
      className={cn('edge-highlight rounded-lg border bg-card px-[22px] py-[18px]', className)}
    >
      <div className="mb-2 flex flex-wrap items-baseline gap-3">
        <h3 className="font-display text-[15.5px] font-bold">{title}</h3>
        <TimeAgo value={date} />
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
    </article>
  );
}
