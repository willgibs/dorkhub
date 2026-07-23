'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import {
  getSearchPaletteSnapshot,
  setSearchPaletteOpen,
  subscribeSearchPalette,
} from '@/app/_shell/search-palette-store';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { copy } from '@/lib/copy';

// Local mirror of src/lib/search/queries.ts's SearchResults (a `server-only`
// module — not imported here so this stays a plain client-safe type). Keep
// in sync with the /api/search response shape.
type SearchProjectHit = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  profiles: { username: string; display_name: string | null };
};

type SearchProfileHit = {
  id: string;
  username: string;
  display_name: string | null;
};

type SearchTagHit = {
  slug: string;
  label: string;
};

type SearchResults = {
  projects: SearchProjectHit[];
  profiles: SearchProfileHit[];
  tags: SearchTagHit[];
};

const EMPTY_RESULTS: SearchResults = { projects: [], profiles: [], tags: [] };

/**
 * Global command palette — mounted once in src/app/layout.tsx
 * (docs/plans/m5.5-curator.md Wave 2). Hand-composes Dialog + Command instead
 * of ui/command.tsx's `CommandDialog` (locked decision 2): CommandDialog
 * doesn't forward `shouldFilter`, and results here are already server-ranked
 * by /api/search, so cmdk's client-side fuzzy filter must stay off. The
 * DialogHeader/DialogContent/Command scaffolding below — including the
 * sr-only DialogTitle (Radix requires one) — is copied verbatim from
 * CommandDialog for a11y + style parity.
 *
 * `animated={false}` on DialogContent: ⌘K is a high-frequency action (opened
 * many times a day) — docs/motion.md bans animation on it regardless of what
 * Dialog does elsewhere.
 */
export function CommandPalette() {
  const open = useSyncExternalStore(subscribeSearchPalette, getSearchPaletteSnapshot, () => false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [settled, setSettled] = useState(false);
  const router = useRouter();

  // ⌘K / Ctrl+K toggles from anywhere in the app. Registered once — reads the
  // store directly (not the `open` state above) so the handler never closes
  // over a stale value.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchPaletteOpen(!getSearchPaletteSnapshot());
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Closing resets query + results — reopening always starts from a blank
  // palette rather than resuming the last search.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(EMPTY_RESULTS);
      setSettled(false);
    }
  }, [open]);

  // 150ms debounce; AbortController cancels a still-in-flight request from a
  // prior keystroke. Below the 2-char floor (mirrors normalizeSearchQuery
  // server-side), skip the network entirely and clear any stale results.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY_RESULTS);
      setSettled(false);
      return;
    }

    setSettled(false);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      (async () => {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
          });
          const data: SearchResults = response.ok ? await response.json() : EMPTY_RESULTS;
          setResults(data);
          setSettled(true);
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error('[command-palette] search failed', error);
          setResults(EMPTY_RESULTS);
          setSettled(true);
        }
      })();
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleSelect(href: string) {
    setSearchPaletteOpen(false);
    router.push(href);
  }

  const hasQuery = query.trim().length >= 2;
  const isEmpty =
    results.projects.length === 0 && results.profiles.length === 0 && results.tags.length === 0;
  // Never flash "nothing yet" while typing or mid-flight — only once a fetch
  // for the CURRENT query has actually resolved.
  const showEmpty = hasQuery && settled && isEmpty;

  return (
    <Dialog open={open} onOpenChange={setSearchPaletteOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>search</DialogTitle>
        <DialogDescription>search projects, people, and tags</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0" animated={false}>
        <Command
          shouldFilter={false}
          className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={copy.searchPlaceholder}
          />
          <CommandList>
            {showEmpty ? <CommandEmpty>{copy.searchEmpty}</CommandEmpty> : null}

            {results.projects.length > 0 ? (
              <CommandGroup heading={copy.searchGroupProjects}>
                {results.projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`project-${project.id}`}
                    onSelect={() => handleSelect(`/u/${project.profiles.username}/${project.slug}`)}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-display">{project.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {project.tagline ?? ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {results.profiles.length > 0 ? (
              <CommandGroup heading={copy.searchGroupPeople}>
                {results.profiles.map((profile) => (
                  <CommandItem
                    key={profile.id}
                    value={`profile-${profile.id}`}
                    onSelect={() => handleSelect(`/u/${profile.username}`)}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-mono">@{profile.username}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {profile.display_name ?? ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {results.tags.length > 0 ? (
              <CommandGroup heading={copy.searchGroupTags}>
                {results.tags.map((tag) => (
                  <CommandItem
                    key={tag.slug}
                    value={`tag-${tag.slug}`}
                    onSelect={() => handleSelect(`/t/${tag.slug}`)}
                  >
                    <span className="font-mono">
                      <span aria-hidden="true" className="opacity-55">
                        #
                      </span>
                      {tag.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
