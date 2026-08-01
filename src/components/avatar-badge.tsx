import { cn } from '@/lib/utils';

export type AvatarBadgeProps = {
  src?: string | null;
  /** Single-glyph fallback — also what shows while the image loads, and if it never does. */
  initial: string;
  /** Circle size utility (default `size-6`). */
  sizeClassName?: string;
  className?: string;
};

/**
 * Avatar with a zero-JS fallback (U2): the initial circle renders BEHIND the
 * image rather than instead of it, which covers three cases without a client
 * boundary or an onError handler —
 * - no `src`: no `<img>` at all, the initial is the avatar;
 * - slow load: the initial holds the space until the image paints over it
 *   (a lazy image used to leave an empty ring here);
 * - dead URL (renamed org, deleted user — inevitable across 14k synced
 *   profiles): an `alt=""` image that fails renders nothing, so the initial
 *   underneath simply stays visible.
 *
 * The image is opaque and covers the circle exactly, so the layering is
 * invisible whenever the avatar does load.
 */
export function AvatarBadge({
  src,
  initial,
  sizeClassName = 'size-6',
  className,
}: AvatarBadgeProps) {
  return (
    <span
      className={cn(
        'relative inline-flex flex-none overflow-hidden rounded-full',
        sizeClassName,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-primary-soft font-mono text-[11px] font-bold text-primary"
      >
        {initial}
      </span>
      {src ? (
        // biome-ignore lint/performance/noImgElement: cost rule — user images never go through the image optimizer (docs/architecture.md)
        <img
          src={src}
          alt=""
          loading="lazy"
          className="relative size-full rounded-full border object-cover"
        />
      ) : null}
    </span>
  );
}
