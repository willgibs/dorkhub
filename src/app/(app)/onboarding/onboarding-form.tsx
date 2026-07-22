'use client';

import { useActionState, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fileToAvatarWebP } from '@/lib/avatars';
import { supabaseBrowser } from '@/lib/supabase/clients';
import { createProfile, type OnboardingState } from './actions';

export function OnboardingForm({
  login,
  suggestedDisplayName,
  githubAvatarUrl,
  userId,
  next,
}: {
  login: string;
  suggestedDisplayName: string;
  githubAvatarUrl: string | null;
  userId: string;
  next: string;
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createProfile,
    null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(githubAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const blob = await fileToAvatarWebP(file, 256);
      const path = `${userId}/avatar-${Date.now()}.webp`;
      const supabase = supabaseBrowser();
      const { error } = await supabase.storage.from('avatars').upload(path, blob, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch {
      setUploadError('upload broke on our end — keeping your github avatar for now');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="avatar_url" value={avatarUrl ?? ''} />

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          avatar <span className="opacity-60">· pulled from github · yours to change</span>
        </span>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // Cost rule: avatars render as plain <img> — GitHub CDN or our
            // bucket — never through an image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full border object-cover"
            />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full border bg-primary-soft font-mono text-xl font-bold text-primary">
              {login.charAt(0)}
            </span>
          )}
          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={uploading || pending}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'uploading…' : 'change'}
            </Button>
            {avatarUrl !== githubAvatarUrl && githubAvatarUrl ? (
              <button
                type="button"
                className="text-left font-mono text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => setAvatarUrl(githubAvatarUrl)}
              >
                use github avatar instead
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
        </div>
        {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
      </div>

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

      <Button type="submit" disabled={pending || uploading} className="w-fit">
        {pending ? 'saving…' : 'that’s me — let’s go'}
      </Button>
    </form>
  );
}
