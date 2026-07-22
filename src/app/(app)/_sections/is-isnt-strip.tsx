import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type IsIsntColumn = {
  title: string;
  tone: 'positive' | 'destructive';
  mark: string;
  items: readonly string[];
};

const COLUMNS: readonly IsIsntColumn[] = [
  { title: 'dorkhub is', tone: 'positive', mark: '✓', items: copy.isList },
  { title: "dorkhub isn't", tone: 'destructive', mark: '✗', items: copy.isntList },
];

/** The "is / isn't" strip — sets expectations right under the hero, exploration-05 verbatim. */
export function IsIsntStrip() {
  return (
    <PageShell as="section" className="pb-16 sm:pb-20">
      <div className="mx-auto grid max-w-[720px] gap-5 sm:grid-cols-2">
        {COLUMNS.map((col) => (
          <div key={col.title} className="edge-highlight rounded-lg border bg-card px-6 py-5">
            <h2
              className={cn(
                'font-mono text-xs font-semibold tracking-[0.1em] uppercase',
                col.tone === 'positive' ? 'text-positive' : 'text-destructive',
              )}
            >
              {col.title}
            </h2>
            <ul className="mt-3 flex flex-col gap-1.5">
              {col.items.map((item) => (
                <li key={item} className="flex items-baseline gap-2.5 text-[14.5px]">
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
