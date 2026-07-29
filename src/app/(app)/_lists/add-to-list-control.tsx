'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toggleListItem } from '@/app/(app)/u/[username]/lists/actions';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { copy } from '@/lib/copy';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { CreateListDialog } from './create-list-dialog';

export type AddToListControlProps = {
  projectId: string;
};

type ListRow = { id: string; name: string; hasProject: boolean };

/**
 * Trigger shell mirrors StatButton's visual language (rounded-lg border
 * pill, mono 12.5px, hover/focus/press treatment — see stat-button.tsx)
 * without importing StatButton itself: this isn't a count/active engagement
 * stat, just a quiet menu trigger.
 */
const TRIGGER_CLASS =
  'inline-flex items-center gap-1.5 rounded-lg border bg-transparent px-[11px] py-[5px] font-mono text-[12.5px] leading-[1.4] text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px';

/**
 * Add-to-list control (D12, docs/plans/p3-lists.md) — project page action
 * row only, v1. Deliberately self-contained rather than routed through
 * EngagementProvider: the shared `/api/me/engagement` overlay stays
 * untouched (it has no notion of lists), and this control only ever mounts
 * on the project page, so it doesn't need the provider's cross-card id
 * registration machinery — its own mount effect resolves auth and fetches
 * the per-project list membership straight from `/api/me/lists`.
 */
export function AddToListControl({ projectId }: AddToListControlProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [lists, setLists] = useState<ListRow[] | null>(null);
  // `lists === null` is the LOADING state, so a failed fetch needs its own
  // flag — otherwise a 5xx leaves the menu on a permanent placeholder that
  // never retries (the mount effect is keyed on projectId).
  const [loadFailed, setLoadFailed] = useState(false);
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [lastError, setLastError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getClaims();
      const claims = data?.claims;

      if (!claims) {
        if (!cancelled) setSignedIn(false);
        return;
      }

      if (!cancelled) setSignedIn(true);

      try {
        const res = await fetch(`/api/me/lists?projectId=${projectId}`);
        if (!res.ok) {
          console.error('[lists] membership fetch failed', res.status);
          if (!cancelled) setLoadFailed(true);
          return;
        }
        const body = (await res.json()) as { lists: ListRow[] };
        if (!cancelled) setLists(body.lists);
      } catch (err) {
        console.error('[lists] membership fetch failed', err);
        if (!cancelled) setLoadFailed(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function runToggle(collectionId: string, next: boolean) {
    // House guard (cf. toggleSave): `disabled` on the item is UI-only and
    // doesn't cover the onCreated auto-add path.
    if (pending.has(collectionId)) return;

    const revert = () =>
      setLists((prev) =>
        prev
          ? prev.map((list) => (list.id === collectionId ? { ...list, hasProject: !next } : list))
          : prev,
      );

    setPending((prev) => new Set(prev).add(collectionId));
    setLists((prev) =>
      prev
        ? prev.map((list) => (list.id === collectionId ? { ...list, hasProject: next } : list))
        : prev,
    );

    try {
      const result = await toggleListItem(collectionId, projectId, next);
      if (result && 'error' in result) {
        revert();
        setLastError(result.error);
      } else {
        setLastError(null);
      }
    } catch (err) {
      // A THROWN server action (network drop, 500, deserialization failure)
      // used to skip the revert entirely and escape as an unhandled
      // rejection, leaving the checkbox claiming a write that never landed.
      // The toggleSave idiom this mirrors can't hit that: supabase-js returns
      // `{ error }` rather than throwing.
      console.error('[lists] toggleListItem threw', err);
      revert();
      setLastError(copy.error);
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    }
  }

  // Derived from state already in hand — recomputed on every optimistic
  // toggle, so the trigger updates the instant a checkbox flips rather than
  // waiting on the server round trip.
  const memberCount = (lists ?? []).filter((list) => list.hasProject).length;

  return (
    <>
      <DropdownMenu
        open={menuOpen}
        onOpenChange={(next) => {
          if (next) {
            // Unresolved: `ready` can't tell signed-out from still-loading
            // yet — a no-op click, same idiom as ReportButtonIsland.
            if (signedIn === null) return;
            if (signedIn === false) {
              router.push(`/auth/signin?next=${encodeURIComponent(pathname)}`);
              return;
            }
          }
          setMenuOpen(next);
        }}
      >
        <DropdownMenuTrigger asChild>
          <button type="button" className={TRIGGER_CLASS}>
            {/* Membership at a glance, so checking whether you already have a
                project doesn't mean opening the menu on every project page.
                Costs NOTHING extra: the control already fetches
                /api/me/lists?projectId= on mount to render the checkmarks, so
                the count comes from data that was previously unused. This is
                the caller's OWN membership (private lists included) — the
                global public signal lives on cards, not here. */}
            {memberCount > 0
              ? `${copy.listedInLabel} ${memberCount} ${
                  memberCount === 1 ? copy.listedInUnitOne : copy.listedInUnit
                }`
              : copy.listAdd}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {loadFailed ? (
            <DropdownMenuItem disabled className="text-destructive">
              {copy.error}
            </DropdownMenuItem>
          ) : lists === null ? (
            <DropdownMenuItem disabled className="text-muted-foreground">
              {copy.loadingMore}
            </DropdownMenuItem>
          ) : lists.length === 0 ? (
            <DropdownMenuItem disabled className="text-muted-foreground">
              {copy.listsEmptyMenu}
            </DropdownMenuItem>
          ) : (
            lists.map((list) => (
              <DropdownMenuCheckboxItem
                key={list.id}
                checked={list.hasProject}
                disabled={pending.has(list.id)}
                onCheckedChange={(checked) => runToggle(list.id, checked)}
                onSelect={(event) => event.preventDefault()}
              >
                {list.name}
              </DropdownMenuCheckboxItem>
            ))
          )}

          {lastError ? (
            <DropdownMenuItem disabled className="text-destructive">
              {lastError}
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setMenuOpen(false);
              setCreateOpen(true);
            }}
          >
            {copy.listNew}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rendered as a SIBLING of DropdownMenu, not nested inside its
          content — Radix tears down the menu's portal the instant an item's
          default `onSelect` fires (the same tick "new list…" is chosen),
          which races a Dialog mounted inside that content and can eat its
          open state before it ever paints. Sibling placement sidesteps the
          race entirely (D12, docs/plans/p3-lists.md). */}
      <CreateListDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(list) => {
          // D12: creating from this control never dead-ends in an empty
          // list — append it optimistically-off, then immediately run the
          // same toggle-on flow used for existing lists.
          setLists((prev) => [
            ...(prev ?? []),
            { id: list.id, name: list.name, hasProject: false },
          ]);
          runToggle(list.id, true);
        }}
      />
    </>
  );
}
