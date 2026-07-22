'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copy } from '@/lib/copy';
import { type ProjectFieldsState, updateProjectFields } from './actions';

export type EditProjectFormProps = {
  projectId: string;
  tagline: string;
  /** Comma-joined for the input's defaultValue; parsed back out server-side. */
  tags: string;
  demoUrl: string;
};

/**
 * Per-project inline save form. Lives client-side (unlike the rest of the
 * settings page) so `useActionState` can surface validation errors without a
 * full page reload — pattern mirrors onboarding-form.tsx.
 */
export function EditProjectForm({ projectId, tagline, tags, demoUrl }: EditProjectFormProps) {
  const [state, formAction, pending] = useActionState<ProjectFieldsState, FormData>(
    updateProjectFields,
    null,
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="project_id" value={projectId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`tagline-${projectId}`} className="font-mono text-xs text-muted-foreground">
          tagline
        </Label>
        <Input
          id={`tagline-${projectId}`}
          name="tagline"
          defaultValue={tagline}
          maxLength={120}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`tags-${projectId}`} className="font-mono text-xs text-muted-foreground">
          tags
        </Label>
        <Input
          id={`tags-${projectId}`}
          name="tags"
          defaultValue={tags}
          placeholder="cli, rust, weekend-project"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`demo-${projectId}`} className="font-mono text-xs text-muted-foreground">
          demo url
        </Label>
        <Input
          id={`demo-${projectId}`}
          name="demo_url"
          defaultValue={demoUrl}
          placeholder="https://"
          autoComplete="off"
        />
      </div>

      {state?.error ? (
        <p aria-live="polite" className="text-sm text-destructive sm:col-span-3">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="secondary" size="sm" disabled={pending} className="w-fit">
        {pending ? 'saving…' : copy.actionSave}
      </Button>
    </form>
  );
}
