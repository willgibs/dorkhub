# P3-A — Lists (public collections)

## Why

Board-approved P3 opener: user lists of projects, GitHub-lists-familiar
("user lists for saves to stay organized"). Public by default with a per-list
privacy toggle, per the board's "public collections" call. Full execution
detail lives in the orchestrator handoff master plan (session plan file);
this doc records the shape and locked decisions.

## Locked decisions

1. **Naming (D7)**: DB tables `collections`/`collection_items`; every
   user-facing string says "lists". Routes `/u/[username]/lists` +
   `/u/[username]/lists/[slug]`.
2. **RLS-first user-owned** (0010, saves/star_imports pattern — NOT the
   deny-all admin pattern): select is `is_public OR own`; insert/update/
   delete own; items require owner-of-parent AND target project published
   (mirrors saves_insert_own). Cookie-bound client does the mutations — RLS
   is the real boundary.
3. **Stable slugs (D8)**: slugified once at creation, `-2`/`-3`… collision
   suffixing (≤5 attempts); renames never re-slug; `slug` is EXCLUDED from
   the authenticated UPDATE column grant (asserted by name in rls_checks
   §2a‴ + behavioral T22).
4. **Reserved project slug `lists` (D9)**: the new static route segment
   shadows `/u/[username]/[slug]` — `RESERVED_PROJECT_SLUGS` in
   src/lib/projects/slug.ts auto-suffixes; live data pre-flighted clean
   (0 rows) before 0010.
5. **Caps (D10)**: 50 lists/profile, 400 items/list — action-level count
   checks; races past the cap accepted v1.
6. **toggleListItem is a server action (D11)** — needs the cap check +
   revalidatePath; only its optimistic-UI shape mirrors toggleSave.
   createList/deleteList are FormData actions; rename/description/
   visibility/toggle take positional args.
7. **Add-to-list control (D12)**: project page action row only v1.
   DropdownMenuCheckboxItem + "new list…" opening the Dialog as a SIBLING
   (Radix nesting race). Creating from the dropdown auto-adds the current
   project; the index page's "+ new list" does not.
8. **No GitHub star-list import (D13)** — no public API exists; revisit if
   one ships.
9. **Private list = 404** to non-owners (RLS empty read → notFound) —
   indistinguishable from nonexistent, on purpose.
10. **"appears in N lists" discovery signal**: P3-B note only (D16).

## Shape

- **0010_lists.sql** — collections + collection_items, 7 policies, narrow
  column grants (no slug UPDATE). Suites: rls_checks §1/§2a″/§2a‴/§3a
  (23→30 policies) + behavioral T17–T22 (own create public+private,
  cross-owner item 42501, draft item rejected, anon public-only, slug
  update rejected).
- **Lib/actions**: src/lib/lists/slug.ts (pure suffix helper) +
  /u/[username]/lists/actions.ts (createList, renameList,
  editListDescription, setListVisibility, deleteList, toggleListItem).
- **Routes**: /api/me/lists (membership overlay for the dropdown),
  lists index + detail pages (supabaseServer + revalidate 300, project-page
  pattern — RLS does the owner/visitor split with zero app branching).
- **Islands** (src/app/(app)/_lists/): create-list-dialog,
  add-to-list-control, delete-list-button, edit-list-form, new-list-button.
- **Integration**: project page action row + header user-menu "lists" item
  + profile page public-lists section (anon client, defensive
  .eq('is_public', true)).

## Not in this round

Add-to-list on feed/saved cards (render-cards has no menu slot — feed-wide
change) · item reordering (added_at desc only) · list-count trending signal
(P3-B) · toasts (no Toaster mounted).
