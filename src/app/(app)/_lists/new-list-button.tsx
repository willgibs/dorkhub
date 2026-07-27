'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { CreateListDialog } from './create-list-dialog';

/** Lists index page "new list" entry point (D12 — unlike AddToListControl's
 * dropdown, creating here never auto-adds a project, so `onCreated` just
 * refreshes the (server-rendered) index to pick up the new row). */
export function NewListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        {copy.listNew}
      </Button>
      <CreateListDialog open={open} onOpenChange={setOpen} onCreated={() => router.refresh()} />
    </>
  );
}
