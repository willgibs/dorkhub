'use client';

import { useActionState, useEffect, useRef } from 'react';
import { type CreateListState, createList } from '@/app/(app)/u/[username]/lists/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { copy } from '@/lib/copy';

export type CreateListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (list: { id: string; name: string; slug: string }) => void;
};

/**
 * Dialog form for `createList` (D6/D10, docs/plans/p3-lists.md). Structural
 * mirror of ReportButtonIsland's dialog + `useActionState` house pattern
 * (report-button-island.tsx) — controlled `open`/`onOpenChange` here instead
 * of an owned trigger, since this dialog is mounted from multiple places
 * (AddToListControl's dropdown, NewListButton).
 */
export function CreateListDialog({ open, onOpenChange, onCreated }: CreateListDialogProps) {
  const [state, formAction, pending] = useActionState<CreateListState, FormData>(createList, null);

  // Guards the `onCreated`/close side effect against re-firing when the
  // dialog is reopened with a stale success state still sitting in
  // `useActionState` (it only resets on the next real submit).
  const lastHandledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (state && 'list' in state && state.list.id !== lastHandledIdRef.current) {
      lastHandledIdRef.current = state.list.id;
      onCreated?.(state.list);
      onOpenChange(false);
    }
  }, [state, onCreated, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.listNew}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {/* Labels, not placeholder-only: a placeholder is not a reliable
              accessible name and disappears on the first keystroke. Mirrors
              report-button-island.tsx's Label + htmlFor pairing. */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="list-name" className="font-mono text-xs text-muted-foreground">
              {copy.listNameLabel}
            </Label>
            <Input
              id="list-name"
              name="name"
              placeholder={copy.listNewPlaceholder}
              maxLength={60}
              required
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="list-description" className="font-mono text-xs text-muted-foreground">
              {copy.listDescriptionLabel}
            </Label>
            <Textarea
              id="list-description"
              name="description"
              placeholder={copy.listDescriptionPlaceholder}
              maxLength={280}
            />
          </div>

          {state && 'error' in state ? (
            <p aria-live="polite" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-fit">
            {copy.listNew}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
