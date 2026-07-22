'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { RepoStatsRow } from '@/components/repo-stats-row';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { copy } from '@/lib/copy';
import { languageColor } from '@/lib/lang-colors';
import { cn } from '@/lib/utils';
import { type CreateProjectState, createProject } from './actions';

export type PickerRepoStatus = 'available' | 'yours' | 'taken';

/**
 * Lean, serializable slice of GithubRepo the server hands to this client
 * component — never the raw GitHub payload (see docs/plans/m4-projects.md,
 * Wave 3E page.tsx notes).
 */
export type PickerRepo = {
  repoId: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
  fork: boolean;
  archived: boolean;
  status: PickerRepoStatus;
  /** Present only when status is 'yours' — the caller's own existing project slug. */
  existingSlug?: string;
};

export type RepoPickerProps = {
  repos: PickerRepo[];
  /** The caller's own username, for linking 'yours' rows to their live project page. */
  username: string;
};

const rowFocusRing =
  'rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/** Tiny row-local subcomponent so each row's "adding…" state reflects ONLY its own form submission, not every row sharing the same server action. */
function RowSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="shrink-0">
      {pending ? 'adding…' : 'add'}
    </Button>
  );
}

export function RepoPicker({ repos, username }: RepoPickerProps) {
  // Lifted to the picker level and shared across every row's <form> — cmdk
  // items only ever submit one at a time in practice, so a single shared
  // error slot (shown near the top, aria-live) is simpler than threading
  // per-row error state and still satisfies "errors are visible and quiet".
  const [state, formAction] = useActionState<CreateProjectState, FormData>(createProject, null);
  const [showHidden, setShowHidden] = useState(false);

  const visibleRepos = repos.filter((repo) => showHidden || (!repo.fork && !repo.archived));
  const hiddenCount = repos.length - visibleRepos.length;

  return (
    <div className="flex flex-col gap-4">
      <p aria-live="polite" className={cn('text-sm text-destructive', !state?.error && 'sr-only')}>
        {state?.error}
      </p>

      <div className="flex w-fit items-center gap-2">
        <Switch
          id="new-show-hidden"
          checked={showHidden}
          onCheckedChange={setShowHidden}
          size="sm"
        />
        <Label htmlFor="new-show-hidden" className="font-mono text-xs text-muted-foreground">
          include forks & archived
          {!showHidden && hiddenCount > 0 ? ` · ${hiddenCount} hidden` : null}
        </Label>
      </div>

      <Command className="rounded-lg border">
        <CommandInput placeholder="search your repos…" />
        <CommandList className="max-h-[520px]">
          <CommandEmpty>{copy.newNoRepos}</CommandEmpty>
          {visibleRepos.map((repo) => (
            <CommandItem
              key={repo.repoId}
              value={repo.name}
              keywords={repo.description ? [repo.description] : undefined}
              disabled={repo.status === 'taken'}
              className="items-start gap-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-mono text-sm text-foreground">{repo.name}</span>
                {repo.description ? (
                  <span className="truncate text-[13px] text-muted-foreground">
                    {repo.description}
                  </span>
                ) : null}
                <RepoStatsRow
                  language={repo.language ?? ''}
                  languageColor={languageColor(repo.language)}
                  stars={repo.stars > 0 ? repo.stars : null}
                />
              </div>

              {repo.status === 'available' ? (
                <form action={formAction} className="mt-0.5 shrink-0">
                  <input type="hidden" name="repo_id" value={repo.repoId} />
                  <RowSubmitButton />
                </form>
              ) : repo.status === 'yours' ? (
                <Link
                  href={`/u/${username}/${repo.existingSlug}`}
                  className={cn(
                    'mt-1.5 shrink-0 font-mono text-[12.5px] text-primary hover:underline',
                    rowFocusRing,
                  )}
                >
                  already on your page
                </Link>
              ) : (
                <span
                  className="mt-1.5 shrink-0 font-mono text-[12.5px] text-muted-foreground opacity-60"
                  title={copy.newRepoTaken}
                >
                  {copy.newRepoTaken}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </div>
  );
}
