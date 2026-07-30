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
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    // Fires only the changed fields, in parallel (D6) — and REPORTS per
    // field (P4 L4; the P2.7 finding: one generic error hid which field
    // failed and that the others actually saved).
    const attempts: Array<{ field: string; call: Promise<ListActionResult> }> = [];
    if (nameValue !== name) {
      attempts.push({ field: 'name', call: renameList(collectionId, nameValue) });
    }
    if (descriptionValue !== description) {
      attempts.push({
        field: 'description',
        call: editListDescription(collectionId, descriptionValue),
      });
    }
    if (isPublicValue !== isPublic) {
      attempts.push({ field: 'visibility', call: setListVisibility(collectionId, isPublicValue) });
    }

    try {
      const results = await Promise.all(attempts.map((attempt) => attempt.call));
      const failedFields = attempts
        .filter((_, i) => {
          const result = results[i];
          return result !== null && result !== undefined && 'error' in result;
        })
        .map((attempt) => attempt.field);

      if (failedFields.length === 0) {
        setError(null);
        setSaved(attempts.length > 0);
      } else {
        const partial = failedFields.length < attempts.length;
        setError(
          `${copy.listSaveFailedLead} ${failedFields.join(' + ')} ${
            partial ? copy.listSavePartialTail : copy.listSaveAllTail
          }`,
        );
      }
    } catch {
      // A THROWN action (vs a returned {error}) previously escaped as an
      // unhandled rejection — the add-to-list control's P2.7 lesson, same
      // fix: catch and land on the generic error.
      setError(copy.error);
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
          onChange={(event) => {
            setNameValue(event.target.value);
            setSaved(false);
          }}
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
          onChange={(event) => {
            setDescriptionValue(event.target.value);
            setSaved(false);
          }}
          maxLength={280}
        />
      </div>

      {/* The label names what the switch CONTROLS and never changes; the
          switch position carries the state. It used to swap public/private
          with the value, so "off / private" read as "private is off, so it's
          public" — flipping it then showed "public", which is the opposite of
          what you just asked for (D30). */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Switch
            id={`list-visibility-${collectionId}`}
            checked={isPublicValue}
            onCheckedChange={(checked) => {
              setIsPublicValue(checked);
              setSaved(false);
            }}
          />
          <Label
            htmlFor={`list-visibility-${collectionId}`}
            className="text-sm text-muted-foreground"
          >
            {copy.listVisibilityPublic}
          </Label>
        </div>
        {!isPublicValue ? (
          <p className="text-[12.5px] text-muted-foreground">{copy.listVisibilityHelp}</p>
        ) : null}
      </div>

      {error ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
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
        {/* Success confirmation (P4 L4 — the form previously confirmed
            nothing). Cleared by the next edit; text-only, deliberately
            unanimated (motion policy: no animation on rapid form feedback). */}
        {saved ? (
          <span aria-live="polite" className="font-mono text-[12.5px] text-positive">
            {copy.actionSaved}
          </span>
        ) : null}
      </div>
    </div>
  );
}
