import { cn } from '@/lib/utils';

/**
 * Section head v2 (R3: "section headers could be more visually bold" — the
 * mono kicker alone gets lost next to card-heavy content). Kicker stays as
 * the identity line; a display-weight title carries the visual anchor; the
 * optional note whispers under it.
 */
export function SectionHead({
  kicker,
  title,
  note,
  className,
}: {
  kicker: string;
  title: string;
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="font-mono text-[11.5px] uppercase tracking-widest text-primary">
        <span aria-hidden="true">{'// '}</span>
        {kicker}
      </p>
      <h2 className="font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">
        {title}
      </h2>
      {note ? <p className="text-[14px] text-muted-foreground">{note}</p> : null}
    </div>
  );
}
