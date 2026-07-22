'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { deleteProject } from './actions';

export type DeleteProjectButtonProps = {
  projectId: string;
};

/** Wraps `deleteProject` behind a native confirm() — the only client-side gate this action needs. */
export function DeleteProjectButton({ projectId }: DeleteProjectButtonProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(copy.settingsDeleteConfirm)) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteProject} onSubmit={handleSubmit}>
      <input type="hidden" name="project_id" value={projectId} />
      <Button type="submit" variant="destructive" size="sm">
        {copy.actionRemove}
      </Button>
    </form>
  );
}
