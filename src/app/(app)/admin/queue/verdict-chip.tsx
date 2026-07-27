import { Badge } from '@/components/ui/badge';
import { verdictLabel } from '@/lib/moderation/verdict';

export type VerdictChipProps = { verdict: 'ok' | 'review' | 'flagged' | null };

/**
 * AI triage verdict marker for the admin queue (P2.6 "immune system",
 * docs/plans/p2.6-immune-system.md). 'ok' and null (unscreened) render
 * nothing — absence convention (CLAUDE.md: zero-stat content shows absence,
 * never a filler value), and an unscreened row is already visually distinct
 * by its position in the sort (src/lib/moderation/verdict.ts sortByVerdict).
 * No bespoke "warning" color exists in the design system, so 'review' reuses
 * the page's existing plain muted outline (matches "needs content" / source
 * badges in page.tsx) and only 'flagged' gets the destructive-tinted
 * treatment — the one locked exception. Label text comes from
 * `verdictLabel` so the chip and the lib it renders can't drift apart.
 */
export function VerdictChip({ verdict }: VerdictChipProps) {
  if (verdict === 'flagged') {
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive">
        {verdictLabel(verdict)}
      </Badge>
    );
  }

  if (verdict === 'review') {
    return (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
      >
        {verdictLabel(verdict)}
      </Badge>
    );
  }

  return null;
}
