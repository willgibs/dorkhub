import { cn } from '@/lib/utils';

export type SectionHeaderProps = {
  /** Mono kicker rendered with a leading "//" (e.g. "05 · discovery feed"). */
  kicker: string;
  title: string;
  /** Optional muted explainer under the title. */
  note?: string;
  className?: string;
};

export function SectionHeader({ kicker, title, note, className }: SectionHeaderProps) {
  return (
    <header className={cn(className)}>
      <p className="mb-2 font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
        <span aria-hidden="true">{'// '}</span>
        {kicker}
      </p>
      <h2 className="font-display text-[27px] font-bold tracking-[-0.01em] text-foreground">
        {title}
      </h2>
      {note ? <p className="mt-2 max-w-[620px] text-sm text-muted-foreground">{note}</p> : null}
    </header>
  );
}
