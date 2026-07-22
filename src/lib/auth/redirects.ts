/**
 * Open-redirect guard for ?next= params (attacker-reachable query string).
 * Only same-origin relative paths survive; anything else falls back to "/".
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/'; // protocol-relative escape
  if (raw.includes(':') || raw.includes('\\')) return '/';
  return raw;
}

/**
 * Request origin for building absolute redirect URLs. Behind Vercel's proxy the
 * forwarded host is authoritative; locally request.url is.
 */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return url.origin;
}
