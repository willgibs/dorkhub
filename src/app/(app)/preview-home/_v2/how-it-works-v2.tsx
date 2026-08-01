import { PageShell } from '@/components/page-shell';
import { copy } from '@/lib/copy';

/**
 * How-it-works v2 (U2 R1): the three steps stop restating the subhead as
 * bare text — each gets a node on a connecting line plus a tiny abstract UI
 * vignette (bars and shapes, no words) sketching what actually happens at
 * that step. Vignettes are decorative and aria-hidden.
 */
const STEPS = [
  { ordinal: '01', label: 'connect github', vignette: <ConnectVignette /> },
  { ordinal: '02', label: 'pick the repos you love', vignette: <PickVignette /> },
  { ordinal: '03', label: 'give each one a page', vignette: <PageVignette /> },
] as const;

export function HowItWorksV2() {
  return (
    <PageShell as="section" className="border-t py-14 sm:py-18">
      <p className="mb-8 font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
        <span aria-hidden="true">{'// '}</span>
        {copy.howKicker}
      </p>
      <div className="relative mx-auto grid max-w-[900px] gap-10 sm:grid-cols-3 sm:gap-8">
        {/* the connecting line — runs behind the ordinal nodes on sm+ */}
        <div
          aria-hidden="true"
          className="absolute top-[14px] right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-border via-[color-mix(in_oklab,var(--primary)_36%,var(--border))] to-border sm:block"
        />
        {STEPS.map((step) => (
          <div key={step.ordinal} className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <span className="tabular-nums relative z-10 inline-flex size-7 items-center justify-center rounded-full border bg-card font-mono text-[11px] text-primary shadow-[0_0_0_3px_var(--background)]">
                {step.ordinal}
              </span>
              <p className="text-[15px] text-foreground">{step.label}</p>
            </div>
            <div
              aria-hidden="true"
              className="edge-highlight flex h-[96px] items-center justify-center rounded-md border bg-surface-2/70"
            >
              {step.vignette}
            </div>
          </div>
        ))}
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
