import { PageShell } from '@/components/page-shell';

/** Near-verbatim restatement of copy.heroSub's three clauses, as a quiet numbered stepper. */
const STEPS = [
  { ordinal: '01', label: 'connect github' },
  { ordinal: '02', label: 'pick the repos you love' },
  { ordinal: '03', label: 'give each one a page' },
] as const;

export function HowItWorks() {
  return (
    <PageShell as="section" className="border-t py-16 sm:py-20">
      <div className="mx-auto grid max-w-[820px] gap-8 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.ordinal} className="flex flex-col gap-2">
            <span className="tabular-nums font-mono text-sm text-primary">{step.ordinal}</span>
            <p className="text-[15px] text-foreground">{step.label}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
