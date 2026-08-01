import Link from 'next/link';
import type { ReactNode } from 'react';

import { copy } from '@/lib/copy';

export type ListRowProps = {
  name: string;
  href: string;
  description: string | null;
  /** VISIBLE members only (P3-D) — an unpublished member drops out of both. */
  itemCount: number;
  /** e.g. the owner-only "private" badge on the lists index. */
  badge?: ReactNode;
};

/**
 * One list, as a quiet typographic row.
 *
 * Shared by the lists index and the profile page on purpose: these two
 * renderings had already drifted once (P2.7 — one grew the app's only
 * `hover:text-primary`, the other's count span went sans/text-xs) and were
 * re-synced by hand with a comment asking the next person to keep the class
 * strings identical. A component keeps that promise without the comment.
 *
 * Absence rule: 0 items renders nothing, never "0 items".
 */
export function ListRow({ name, href, description, itemCount, badge }: ListRowProps) {
  return (
    <li className="flex flex-col gap-1 py-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          href={href}
          className="rounded-sm font-mono text-[15px] font-semibold outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {name}
        </Link>
        {badge}
        {itemCount > 0 ? (
          <span className="tabular-nums font-mono text-[12.5px] text-muted-foreground">
            {itemCount} {itemCount === 1 ? copy.listItemUnitOne : copy.listItemUnit}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="line-clamp-1 max-w-[560px] text-[13.5px] text-muted-foreground">
          {description}
        </p>
      ) : null}
    </li>
  );
}
