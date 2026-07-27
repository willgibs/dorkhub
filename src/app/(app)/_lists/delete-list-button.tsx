'use client';

import type { FormEvent } from 'react';
import { deleteList } from '@/app/(app)/u/[username]/lists/actions';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';

export type DeleteListButtonProps = {
  collectionId: string;
};

/** Structural mirror of settings/projects/delete-button.tsx: wraps
 * `deleteList` behind a native confirm() — the only client-side gate this
 * action needs. */
export function DeleteListButton({ collectionId }: DeleteListButtonProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(copy.listDeleteConfirm)) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteList} onSubmit={handleSubmit}>
      <input type="hidden" name="collection_id" value={collectionId} />
      <Button type="submit" variant="destructive" size="sm">
        {copy.actionRemove}
      </Button>
    </form>
  );
}
