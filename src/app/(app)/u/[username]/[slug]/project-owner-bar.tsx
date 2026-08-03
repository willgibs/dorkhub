'use client';

import Link from 'next/link';

import { useHeaderAuth } from '@/app/_shell/use-header-auth';
import { refreshProjectFromGithub, setProjectStatus } from '@/app/(app)/settings/projects/actions';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type ProjectOwnerBarProps = {
  projectId: string;
  /** The page's owner; compared against the signed-in viewer. */
  ownerUsername: string;
};

const quietLink =
  'rounded-sm font-mono text-[12.5px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Owner controls, as a client island (2026-08-03 cost fix).
 *
 * They used to be server-rendered behind an `isOwner` check, which meant the
 * page had to read cookies, which meant it could never be cached — and every
 * one of 16,972 project pages re-rendered on every crawler hit. The controls
 * are for exactly one signed-in person; the page is for everyone else. So the
 * page went cookie-free and cacheable, and the controls moved here.
 *
 * `useHeaderAuth` is the same resolver the header already mounts on every
 * page, with a module-level cache and in-flight dedupe — so this costs no
 * extra auth round trip, and it renders nothing at all until it knows.
 *
 * Publish/unpublish stays a plain server-action form: a throttled or failed
 * refresh silently no-ops on this surface, and /settings/projects is the
 * full-feedback one (unchanged from the server version).
 */
export function ProjectOwnerBar({ projectId, ownerUsername }: ProjectOwnerBarProps) {
  const auth = useHeaderAuth();

  if (auth.status !== 'signed-in') return null;
  // `username` is a citext column — match how the database compares it.
  const viewer = auth.profile?.username?.toLowerCase();
  if (!viewer || viewer !== ownerUsername.toLowerCase()) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={setProjectStatus}>
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="intent" value="unpublish" />
        <Button type="submit" variant="secondary" size="sm">
          {copy.actionUnpublish}
        </Button>
      </form>

      <form action={refreshProjectFromGithub}>
        <input type="hidden" name="project_id" value={projectId} />
        <Button type="submit" variant="ghost" size="sm">
          {copy.actionRefresh}
        </Button>
      </form>

      <Link href="/settings/projects" className={cn(quietLink)}>
        {copy.projectManageInSettings}
      </Link>
    </div>
  );
}
