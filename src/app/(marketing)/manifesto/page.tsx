import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';
import { SectionHeader } from '@/components/section-header';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'manifesto',
  description: 'no pitch — just the beliefs the whole thing runs on.',
};

/**
 * FINAL copy — approved through the M7 product gate (Will: Take A's calm
 * register merged with Take B's strongest lines, 2026-07-22). Edits to these
 * strings are a product decision; pause and ask Will.
 */
const TENETS = [
  {
    title: 'small weird things count',
    body: 'the 2am experiment, the single-purpose tool, the joke that compiles. they all belong here.',
  },
  {
    title: 'sharing beats selling',
    body: 'no launch day, no pricing page, no funnel. you made a thing; someone else gets to use it. that’s the whole transaction.',
  },
  {
    title: 'forking is a compliment',
    body: 'stars are nice. someone shipping their weekend on top of your weekend? that’s the good stuff.',
  },
  {
    title: 'ship it half-done',
    body: '‘i made a maze generator. it makes mazes.’ is a complete product description. polish when you feel like it, or never.',
  },
  {
    title: 'no leaderboards for love',
    body: 'nothing here ranks you. the feed is a shelf, not a contest — and every shelf has room.',
  },
  {
    title: 'take what you need, leave what you learned',
    body: 'clone freely. take the idea. tell people where you got it, then make it weirder.',
  },
] as const;

const CLOSER = 'go build a thing.';

const COLOPHON = [
  { label: 'built', value: 'a solo founder + AI agents' },
  { label: 'stack', value: 'Next.js · Tailwind · Supabase · Vercel' },
  { label: 'type', value: 'Instrument Sans · Geist · JetBrains Mono' },
  { label: 'motion', value: 'UI transitions adapted from transitions.dev' },
  { label: 'references', value: 'paper.design · resend.com · basehub.com · cosmos.network' },
  { label: 'license', value: 'free to browse, free to fork.' },
] as const;

export default function ManifestoPage() {
  return (
    <div className="bg-bloom">
      <PageShell className="flex flex-col pt-16 pb-24 sm:pt-20">
        <header className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            <span aria-hidden="true">{'// '}</span>manifesto
          </p>
          <h1 className="mt-4 font-display text-6xl font-extrabold tracking-[-0.02em] text-balance sm:text-7xl md:text-8xl">
            why dorkhub exists.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            no pitch. just the beliefs the whole thing runs on.
          </p>
        </header>

        <section aria-label="manifesto tenets" className="relative mt-10 sm:mt-12">
          <ol className="flex list-none flex-col">
            {TENETS.map((tenet, i) => (
              <TenetRow key={tenet.title} index={i + 1} tenet={tenet} />
            ))}
          </ol>

          <p className="border-t border-border/60 px-2 pt-16 pb-4 text-center font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl">
            {CLOSER}
          </p>
        </section>

        <section id="colophon" className="mt-24 max-w-2xl scroll-mt-8 sm:mt-28">
          <SectionHeader kicker="colophon" title="how this got made" />
          <div className="edge-highlight mt-5 flex flex-col divide-y divide-border overflow-hidden rounded-lg border">
            {COLOPHON.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-1 bg-card px-5 py-3.5 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground uppercase">
                  {row.label}
                </span>
                <span className="text-sm text-card-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </section>
      </PageShell>
    </div>
  );
}

function TenetRow({ index, tenet }: { index: number; tenet: { title: string; body: string } }) {
  const ordinal = String(index).padStart(2, '0');

  return (
    <li className={cn('relative border-t border-border/60 py-16 first:border-t-0 first:pt-6')}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-14 right-0 select-none font-mono text-xs text-muted-foreground/35"
      >
        +
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 select-none font-mono text-[5rem] leading-none font-bold text-primary/15 tabular-nums sm:text-[7rem] md:text-[8.5rem]"
      >
        {ordinal}
      </span>
      <div className="relative max-w-2xl pl-16 sm:pl-24 md:pl-32">
        <h3 className="font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          {tenet.title}
        </h3>
        <p className="mt-4 text-lg text-muted-foreground">{tenet.body}</p>
      </div>
    </li>
  );
}
