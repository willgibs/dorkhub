import type { Metadata } from 'next';
import { SectionHeader } from '@/components/section-header';

export const metadata: Metadata = { title: 'design system' };

const TOKENS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--border',
  '--input',
  '--ring',
  '--surface-2',
  '--primary-soft',
  '--positive',
  '--positive-soft',
  '--code-bg',
  '--code-text',
  '--link',
];

const RADII = [
  { cls: 'rounded-sm', label: 'sm', note: '0.5×' },
  { cls: 'rounded-md', label: 'md', note: '0.8×' },
  { cls: 'rounded-lg', label: 'lg', note: '1×  (base --radius)' },
  { cls: 'rounded-xl', label: 'xl', note: '1.5×' },
] as const;

const SHADOWS = [
  {
    cls: 'shadow-card',
    label: 'shadow-card',
    note: 'default card elevation (paired with edge-highlight)',
  },
  { cls: 'shadow-overlay', label: 'shadow-overlay', note: 'popovers, hover-cards, dialogs' },
] as const;

export default function DesignOverviewPage() {
  return (
    <div className="flex flex-col gap-16">
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {'// design'}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Living styleguide</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          The production home of the “Quiet dev-native” system — tokens, components, type, and
          voice, read straight from the source that ships.
        </p>
      </div>

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="01 · tokens"
          title="Color tokens"
          note="Every swatch below is a live var() read from globals.css — not a copy-pasted hex."
        />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {TOKENS.map((t) => (
            <div
              key={t}
              className="edge-highlight flex items-center gap-2.5 rounded-lg border bg-card p-2.5"
            >
              <span
                className="size-8 shrink-0 rounded-md border"
                style={{ background: `var(${t})` }}
              />
              <span className="font-mono text-[11px]">{t}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="02 · radius"
          title="Radius scale"
          note="One --radius (0.45rem) drives every corner in the system via calc()."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {RADII.map((r) => (
            <div key={r.cls} className="flex flex-col items-center gap-2.5 text-center">
              <div className={`size-16 border-2 border-primary/60 bg-primary-soft ${r.cls}`} />
              <div className="font-mono text-xs text-muted-foreground">
                <p className="text-foreground">{r.cls}</p>
                <p>{r.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="03 · shadow"
          title="Elevation"
          note="Cards combine shadow-card with edge-highlight's 1px inner top edge; overlays float on shadow-overlay."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          {SHADOWS.map((s) => (
            <div key={s.cls} className="flex flex-col gap-2.5">
              <div
                className={`flex h-24 items-center justify-center rounded-lg border bg-card ${s.cls}`}
              >
                <span className="font-mono text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
