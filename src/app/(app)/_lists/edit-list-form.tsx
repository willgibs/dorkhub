'use client';

import { useState } from 'react';
import {
  editListDescription,
  type ListActionResult,
  renameList,
  setListVisibility,
} from '@/app/(app)/u/[username]/lists/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { copy } from '@/lib/copy';

export type EditListFormProps = {
  collectionId: string;
  name: string;
  description: string;
  isPublic: boolean;
};

/**
 * Inline list-settings form (lists detail page, owner-only). Compact layout
 * mirrors EditProjectForm (settings/projects/edit-form.tsx), but rename/
 * description/visibility are three positional-arg actions (D6) rather than
 * one FormData submit — `handleSave` fires only the ones whose value
 * actually changed, in parallel.
 */
export function EditListForm({ collectionId, name, description, isPublic }: EditListFormProps) {
  const [nameValue, setNameValue] = useState(name);
  const [descriptionValue, setDescriptionValue] = useState(description);
  const [isPublicValue, setIsPublicValue] = useState(isPublic);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);

    const calls: Promise<ListActionResult>[] = [];
    if (nameValue !== name) calls.push(renameList(collectionId, nameValue));
    if (descriptionValue !== description) {
      calls.push(editListDescription(collectionId, descriptionValue));
    }
    if (isPublicValue !== isPublic) calls.push(setListVisibility(collectionId, isPublicValue));

    try {
      const results = await Promise.all(calls);
      const failed = results.find((result) => result && 'error' in result);
      setError(failed && 'error' in failed ? failed.error : null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`list-name-${collectionId}`}
          className="font-mono text-xs text-muted-foreground"
        >
          name
        </Label>
        <Input
          id={`list-name-${collectionId}`}
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          maxLength={60}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`list-description-${collectionId}`}
          className="font-mono text-xs text-muted-foreground"
        >
          description
        </Label>
        <Textarea
          id={`list-description-${collectionId}`}
          value={descriptionValue}
          onChange={(event) => setDescriptionValue(event.target.value)}
          maxLength={280}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id={`list-visibility-${collectionId}`}
          checked={isPublicValue}
          onCheckedChange={setIsPublicValue}
        />
        <Label
          htmlFor={`list-visibility-${collectionId}`}
          className="text-sm text-muted-foreground"
        >
          {isPublicValue ? copy.listVisibilityPublic : copy.listVisibilityPrivate}
        </Label>
      </div>

      {error ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={saving}
        onClick={handleSave}
        className="w-fit"
      >
        {copy.actionSave}
      </Button>
    </div>
  );
}
