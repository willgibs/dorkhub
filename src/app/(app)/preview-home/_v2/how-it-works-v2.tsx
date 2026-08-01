import Link from 'next/link';

import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import { SectionHead } from './section-head';

/**
 * How-it-works v2.1 (R2.5): one closing section instead of two — the three
 * connected steps, then the is/isn't split panel folded in beneath them
 * (R2: expectation-setting belongs inside the story, not as its own
 * symmetric block), ending in the bottom conversion capture: a
 * display-scale line + "list my project" CTA into /new (the proxy streams
 * signed-out visitors through /auth/signin?next=/new — one GitHub click
 * and back). Vignettes are decorative and aria-hidden.
 */
const STEPS = [
  { ordinal: '01', label: 'connect github', vignette: <ConnectVignette /> },
  { ordinal: '02', label: 'pick the repos you love', vignette: <PickVignette /> },
  { ordinal: '03', label: 'give each one a page', vignette: <PageVignette /> },
] as const;

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

export function HowItWorksV2() {
  return (
    <PageShell as="section" className="flex flex-col gap-12 border-t py-16 sm:py-20">
      <div className="flex flex-col gap-10">
        <SectionHead kicker={copy.howKicker} title={copy.howTitle} />
        <div className="relative mx-auto grid w-full max-w-[920px] gap-10 sm:grid-cols-3 sm:gap-6">
          {/* the connecting line — runs strictly behind the ordinal nodes
              (labels live BELOW the node row since R3, so nothing gets
              struck through) */}
          <div
            aria-hidden="true"
            className="absolute top-[15px] right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-border via-[color-mix(in_oklab,var(--primary)_36%,var(--border))] to-border sm:block"
          />
          {STEPS.map((step) => (
            <div key={step.ordinal} className="flex flex-col items-center gap-4 text-center">
              <span className="tabular-nums relative z-10 inline-flex size-8 items-center justify-center rounded-full border bg-card font-mono text-[11.5px] text-primary shadow-[0_0_0_4px_var(--background),0_0_0_5px_color-mix(in_oklab,var(--primary)_18%,transparent)]">
                {step.ordinal}
              </span>
              <p className="font-display text-[15.5px] font-bold text-foreground">{step.label}</p>
              <div
                aria-hidden="true"
                className="edge-highlight flex h-[116px] w-full items-center justify-center rounded-lg border bg-surface-2/70"
              >
                {step.vignette}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* is/isn't — compacted split panel, expectation-setting mid-beat */}
      <div className="edge-highlight mx-auto grid w-full max-w-[860px] overflow-hidden rounded-lg border bg-card sm:grid-cols-2">
        {COLUMNS.map((col, i) => (
          <div
            key={col.title}
            className={cn(
              'relative overflow-hidden px-6 py-5',
              i === 1 && 'border-t sm:border-t-0 sm:border-l',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute -top-8 -right-2 select-none font-mono text-[7rem] font-bold leading-none',
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
            <ul className="relative mt-3 flex flex-col gap-1.5">
              {col.items.map((item) => (
                <li key={item} className="flex items-baseline gap-2.5 text-[14px]">
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

      {/* the bottom capture — the page's closing ask */}
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <p className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {copy.captureTitle}
        </p>
        <Button
          asChild
          size="lg"
          className="shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent),0_4px_18px_color-mix(in_oklab,var(--primary)_20%,transparent)] active:translate-y-px"
        >
          <Link href="/new">{copy.ctaPrimary}</Link>
        </Button>
        <p className="font-mono text-xs text-muted-foreground">{copy.captureSubline}</p>
      </div>
    </PageShell>
  );
}

/** 01 — a button shape with the auth glow. */
function ConnectVignette() {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-4 py-2 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_35%,transparent),0_2px_12px_color-mix(in_oklab,var(--primary)_16%,transparent)]">
      <span className="size-2 rounded-full bg-primary" />
      <span className="h-2 w-20 rounded-full bg-[color-mix(in_oklab,var(--foreground)_28%,transparent)]" />
    </div>
  );
}

/** 02 — three repo rows, the middle one picked. */
function PickVignette() {
  return (
    <div className="flex w-[70%] flex-col gap-2">
      {[false, true, false].map((picked, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative triple
          key={i}
          className="flex items-center gap-2.5 rounded-sm border bg-card px-2.5 py-1.5"
        >
          <span
            className={
              picked
                ? 'flex size-3 items-center justify-center rounded-[3px] bg-primary font-mono text-[8px] font-bold text-primary-foreground'
                : 'size-3 rounded-[3px] border'
            }
          >
            {picked ? '✓' : null}
          </span>
          <span
            className={
              picked
                ? 'h-1.5 w-24 rounded-full bg-[color-mix(in_oklab,var(--foreground)_45%,transparent)]'
                : 'h-1.5 w-16 rounded-full bg-[color-mix(in_oklab,var(--foreground)_22%,transparent)]'
            }
          />
        </div>
      ))}
    </div>
  );
}

/** 03 — a miniature project card. */
function PageVignette() {
  return (
    <div className="edge-highlight w-[62%] overflow-hidden rounded-md border bg-card">
      <div className="flex h-8 items-end gap-1 border-b bg-surface-2 px-2 pb-1">
        {[10, 16, 8, 18, 12].map((h, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative bars
            key={i}
            style={{ height: `${h}px` }}
            className={`w-2.5 rounded-t-sm ${i % 2 === 0 ? 'bg-primary/70' : 'bg-primary-soft'}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5 px-2.5 py-2">
        <span className="h-1.5 w-16 rounded-full bg-[color-mix(in_oklab,var(--foreground)_45%,transparent)]" />
        <span className="h-1.5 w-24 rounded-full bg-[color-mix(in_oklab,var(--foreground)_20%,transparent)]" />
        <span className="tabular-nums font-mono text-[9px] text-primary">★ ++</span>
      </div>
    </div>
  );
}
