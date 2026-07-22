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
