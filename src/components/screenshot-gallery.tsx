import { cn } from '@/lib/utils';

export type GalleryShot = {
  id: string;
  /** CSS aspect-ratio (e.g. "16 / 10.5"). Defaults: main shot "16 / 10.5"; stacked shots size from the grid rows (desktop) / intrinsic SVG ratio (mobile). */
  aspect?: string;
  /** Short caption drawn inside the placeholder + used as the accessible name. */
  label?: string;
};

export type ScreenshotGalleryProps = {
  /** First shot renders as the main image (1.8fr, spanning 2 rows); the rest stack beside it. */
  shots: GalleryShot[];
  className?: string;
};

/**
 * ScreenshotGallery — project-page media grid from the reference: one main shot
 * plus two stacked shots on desktop, single column on mobile. Renders decorative
 * placeholder SVGs for now (real images later).
 */
export function ScreenshotGallery({ shots, className }: ScreenshotGalleryProps) {
  if (shots.length === 0) return null;

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 md:grid-cols-[1.8fr_1fr] md:grid-rows-[1fr_1fr]',
        className,
      )}
    >
      {shots.map((shot, i) => {
        const isMain = i === 0;
        return (
          <div
            key={shot.id}
            className={cn(
              'overflow-hidden rounded-lg border bg-surface-2',
              isMain && 'md:row-span-2',
            )}
            style={{ aspectRatio: shot.aspect ?? (isMain ? '16 / 10.5' : undefined) }}
          >
            <PlaceholderShot shot={shot} index={i} />
          </div>
        );
      })}
    </div>
  );
}

/** Decorative stand-in art, ported from the reference exploration's placeholder SVGs. */
function PlaceholderShot({ shot, index }: { shot: GalleryShot; index: number }) {
  const ariaLabel = shot.label ?? `${shot.id} screenshot placeholder`;

  if (index === 0) {
    return (
      <svg viewBox="0 0 560 368" role="img" aria-label={ariaLabel} className="block h-full w-full">
        <rect width="560" height="368" fill="var(--surface-2)" />
        <rect x="40" y="240" width="56" height="88" rx="4" fill="var(--primary)" />
        <rect x="102" y="204" width="56" height="124" rx="4" fill="var(--primary-soft)" />
        <rect x="164" y="262" width="56" height="66" rx="4" fill="var(--primary)" />
        <rect x="226" y="182" width="56" height="146" rx="4" fill="var(--primary-soft)" />
        <rect x="288" y="230" width="56" height="98" rx="4" fill="var(--primary)" />
        <rect x="350" y="252" width="56" height="76" rx="4" fill="var(--primary-soft)" />
        <rect x="412" y="196" width="56" height="132" rx="4" fill="var(--primary)" />
        <polyline
          points="40,120 110,80 180,132 250,64 320,118 390,88 460,124 520,72"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="5"
        />
        {shot.label !== undefined && (
          <text
            x="40"
            y="44"
            fontFamily="var(--font-mono)"
            fontSize="16"
            fill="var(--muted-foreground)"
          >
            {shot.label}
          </text>
        )}
      </svg>
    );
  }

  const wave =
    index % 2 === 1
      ? 'M20 88 q 30 -60 60 0 t 60 0 t 60 0 t 60 0'
      : 'M20 118 h40 v-60 h40 v60 h40 v-60 h40 v60 h40 v-60 h40';

  return (
    <svg viewBox="0 0 280 176" role="img" aria-label={ariaLabel} className="block h-full w-full">
      <rect width="280" height="176" fill="var(--surface-2)" />
      <path d={wave} fill="none" stroke="var(--primary)" strokeWidth="4" />
      {shot.label !== undefined && (
        <text
          x="20"
          y="150"
          fontFamily="var(--font-mono)"
          fontSize="13"
          fill="var(--muted-foreground)"
        >
          {shot.label}
        </text>
      )}
    </svg>
  );
}
