'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createProfile, type OnboardingState } from './actions';

export function OnboardingForm({
  login,
  suggestedDisplayName,
  next,
}: {
  login: string;
  suggestedDisplayName: string;
  next: string;
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createProfile,
    null,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted-foreground">username · locked to github</span>
        <p className="edge-highlight w-fit rounded-lg border bg-card px-4 py-2 font-mono text-sm">
          u/<span className="text-foreground">{login}</span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="display_name" className="font-mono text-xs text-muted-foreground">
          display name <span className="opacity-60">· optional</span>
        </Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={suggestedDisplayName}
          maxLength={80}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio" className="font-mono text-xs text-muted-foreground">
          bio <span className="opacity-60">· optional · 500 max</span>
        </Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          placeholder="builds small loud things"
        />
      </div>

      {state?.error ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? 'saving…' : 'that’s me — let’s go'}
      </Button>
    </form>
  );
}
