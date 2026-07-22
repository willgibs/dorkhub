'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copy } from '@/lib/copy';
import { createProfile, type OnboardingState } from './actions';

export function OnboardingForm({ suggested, next }: { suggested: string; next: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createProfile,
    null,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="username" className="font-mono text-xs text-muted-foreground">
          username
        </Label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">u/</span>
          <Input
            id="username"
            name="username"
            defaultValue={suggested}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={39}
            required
            className="font-mono"
          />
        </div>
      </div>
      {state?.error ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? 'saving…' : copy.ctaPrimary}
      </Button>
    </form>
  );
}
