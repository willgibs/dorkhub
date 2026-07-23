/**
 * Tiny module-level external store for the command palette's open state.
 * Shared between the server-rendered header's <SearchTrigger> (in the
 * (app)/(marketing) layout tree) and the root-mounted <CommandPalette />
 * dialog (src/app/layout.tsx) without a context provider spanning both
 * layouts — same module-cache precedent as site-header-auth.tsx's
 * `cachedState`. Consumed via `useSyncExternalStore` so both subscribers stay
 * in sync with zero prop drilling and no DOM CustomEvents.
 */

let open = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeSearchPalette(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSearchPaletteSnapshot(): boolean {
  return open;
}

export function openSearchPalette(): void {
  setSearchPaletteOpen(true);
}

export function closeSearchPalette(): void {
  setSearchPaletteOpen(false);
}

export function setSearchPaletteOpen(next: boolean): void {
  if (open === next) return;
  open = next;
  emit();
}
