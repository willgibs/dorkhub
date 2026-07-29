/**
 * Avatar URL policy. Only two hosts may ever land in profiles.avatar_url:
 * GitHub's avatar CDN (the pulled default) and our own storage bucket (user
 * uploads). Everything else is rejected server-side — avatar_url reaches the
 * DB via service-role code, so this allowlist is the whole defense.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;

export function isAllowedAvatarUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  if (url.hostname === 'avatars.githubusercontent.com') return true;
  try {
    const storageHost = new URL(SUPABASE_URL).hostname;
    return (
      url.hostname === storageHost && url.pathname.startsWith('/storage/v1/object/public/avatars/')
    );
  } catch {
    return false;
  }
}

/** Rendered avatar size for the pulled GitHub default — matches ProfileHeader's 76px at 2x. */
const GITHUB_AVATAR_SIZE = 200;

/**
 * The public GitHub avatar for a numeric account id, or null if the result
 * somehow fails the allowlist (it can't today, but building the URL and then
 * validating it keeps `isAllowedAvatarUrl` the single gate — a bare
 * string-concat at the call site would quietly route around the one defense
 * `avatar_url` has).
 *
 * Derived from `github_id` alone, so it costs no API call and stays correct
 * across username changes — the same immutable-numeric-id rule the claim flow
 * is built on.
 */
export function githubAvatarUrl(githubId: number): string | null {
  const url = `https://avatars.githubusercontent.com/u/${githubId}?s=${GITHUB_AVATAR_SIZE}`;
  return isAllowedAvatarUrl(url) ? url : null;
}

/** Client-side: center-crop + resize an image file to a square WebP blob. */
export async function fileToAvatarWebP(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))),
      'image/webp',
      0.85,
    );
  });
}
