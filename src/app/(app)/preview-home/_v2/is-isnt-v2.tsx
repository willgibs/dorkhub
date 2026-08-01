import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type Column = {
  title: string;
  tone: 'positive' | 'destructive';
  mark: string;
  items: readonly string[];
};

const COLUMNS: readonly Column[] = [
  { title: 'dorkhub is', tone: 'positive', mark: '✓', items: copy.isList },
  { title: "dorkhub isn't", tone: 'destructive', mark: '✗', items: copy.isntList },
];

/**
 * Is/Isn't v2 (U2 R1): the two symmetric cards become ONE split panel with
 * the manifesto's ghost-glyph energy — an oversized ✓/✗ sits behind each
 * half at whisper opacity. Same copy, same tones; the composition carries
 * the argument instead of two identical boxes.
 */
export function IsIsntV2() {
  return (
    <PageShell as="section" className="py-12 sm:py-16">
      <div className="edge-highlight mx-auto grid max-w-[860px] overflow-hidden rounded-lg border bg-card sm:grid-cols-2">
        {COLUMNS.map((col, i) => (
          <div
            key={col.title}
            className={cn(
              'relative overflow-hidden px-7 py-7',
              i === 1 && 'border-t sm:border-t-0 sm:border-l',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute -top-10 -right-2 select-none font-mono text-[9rem] font-bold leading-none',
                col.tone === 'positive'
                  ? 'text-[color-mix(in_oklab,var(--positive)_11%,transparent)]'
                  : 'text-[color-mix(in_oklab,var(--destructive)_11%,transparent)]',
              )}
            >
              {col.mark}
            </span>
            <h2
              className={cn(
                'font-mono text-xs font-semibold tracking-[0.1em] uppercase',
                col.tone === 'positive' ? 'text-positive' : 'text-destructive',
              )}
            >
              {col.title}
            </h2>
            <ul className="relative mt-4 flex flex-col gap-2">
              {col.items.map((item) => (
                <li key={item} className="flex items-baseline gap-2.5 text-[15px]">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'font-mono',
                      col.tone === 'positive' ? 'text-positive' : 'text-destructive',
                    )}
                  >
                    {col.mark}
                  </span>
                  <span className="text-card-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
