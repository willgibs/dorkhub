import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type MarkdownProseProps = {
  /** Pre-sanitized HTML (never raw user input) — rendered via dangerouslySetInnerHTML. */
  html: string;
  /**
   * Header-bar label (e.g. "README.md"). Providing `label` or `forkHref` wraps the
   * prose in README card chrome (bg-card, border, edge highlight, header bar).
   * `label` defaults to "README.md" when only `forkHref` is given.
   */
  label?: string;
  /** Fork-nudge link in the header bar; renders copy.forkNudge. */
  forkHref?: string;
  className?: string;
};

/**
 * MarkdownProse — rendered README/markdown body on the bespoke `.prose` ruleset
 * (src/styles/prose.css). Bare by default; pass `label`/`forkHref` for the
 * README card variant from the reference.
 */
export function MarkdownProse({ html, label, forkHref, className }: MarkdownProseProps) {
  const prose = (
    <div
      className={cn('prose', label === undefined && forkHref === undefined && className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: html is sanitized upstream by contract
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  if (label === undefined && forkHref === undefined) return prose;

  return (
    <div
      className={cn(
        'edge-highlight rounded-lg border bg-card px-[34px] py-[30px] max-sm:px-5 max-sm:py-5',
        className,
      )}
    >
      <div className="mb-5 flex justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        <span>{label ?? 'README.md'}</span>
        {forkHref !== undefined && (
          <a
            href={forkHref}
            className="rounded-sm text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {copy.forkNudge}
          </a>
        )}
      </div>
      {prose}
    </div>
  );
}
