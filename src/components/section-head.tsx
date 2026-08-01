import { cn } from '@/lib/utils';

export type SectionHeadProps = {
  /** Mono identity line, rendered with a leading "//". */
  kicker: string;
  title: string;
  /** Optional muted explainer under the title. */
  note?: string;
  className?: string;
};

/**
 * Section head (U2 R3: "section headers could be more visually bold" — the
 * mono kicker alone gets lost next to card-heavy content). Kicker stays as
 * the identity line; a display-weight title carries the visual anchor; the
 * optional note whispers under it.
 *
 * W3 promoted this out of `(app)/_discovery/` and retired the older
 * `SectionHeader`, which was the same component one accent and two font
 * weights behind — the /design pages and the manifesto had quietly kept the
 * pre-U2 treatment.
 */
export function SectionHead({ kicker, title, note, className }: SectionHeadProps) {
  return (
    <header className={cn('flex flex-col gap-2', className)}>
      <p className="font-mono text-[11.5px] uppercase tracking-widest text-primary">
        <span aria-hidden="true">{'// '}</span>
        {kicker}
      </p>
      <h2 className="font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">
        {title}
      </h2>
      {note ? <p className="max-w-[620px] text-[14px] text-muted-foreground">{note}</p> : null}
    </header>
  );
}
