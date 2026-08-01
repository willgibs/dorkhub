import Link from 'next/link';

import { AvatarStack } from '@/components/avatar-stack';
import { copy } from '@/lib/copy';
import type { RisingMaker } from '@/lib/discovery/queries';

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Makers ranked by recent engagement on their work — AvatarStack's first
 * production seat. Built ONLY on aggregates (rising_makers RPC, migration
 * 0022): who liked what never reaches this component (board: likes stay
 * private). Absence rule: an empty window renders nothing.
 */
export function RisingMakers({ makers }: { makers: RisingMaker[] }) {
  if (makers.length === 0) return null;

  return (
    <aside className="edge-highlight flex flex-col gap-4 rounded-lg border bg-card px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
          <span aria-hidden="true">{'// '}</span>
          {copy.risingKicker}
        </p>
        <AvatarStack
          users={makers.map((maker) => ({
            username: maker.username,
            initial: maker.displayName.charAt(0).toLowerCase(),
          }))}
          max={4}
        />
      </div>

      <ol className="flex flex-col">
        {makers.map((maker, i) => (
          <li key={maker.profileId}>
            <Link
              href={`/u/${maker.username}`}
              className={`group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent ${focusRing}`}
            >
              <span className="tabular-nums w-5 font-mono text-[11px] text-muted-foreground">
                {String(i + 1).padStart(2, '0')}
              </span>
              {maker.avatarUrl ? (
                // eslint-free plain img (house rule: no next/image)
                <img
                  src={maker.avatarUrl}
                  alt=""
                  loading="lazy"
                  className="size-7 shrink-0 rounded-full border object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-[11px] font-bold text-primary"
                >
                  {maker.displayName.charAt(0).toLowerCase()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] text-foreground">
                  {maker.displayName}
                </span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                  @{maker.username}
                </span>
              </span>
              <span className="tabular-nums font-mono text-xs text-primary">++{maker.score}</span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
