import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';
import { SectionHeader } from '@/components/section-header';
import { TakeSwitcher, type TenetTake } from './take-switcher';

export const metadata: Metadata = {
  title: 'manifesto',
  description: 'no pitch — just the beliefs dorkhub runs on, in two drafts.',
};

/**
 * Product-gate copy (see CLAUDE.md → "Product gates"). Both takes are final
 * drafts handed down verbatim; Will picks a winner and the loser gets deleted
 * along with the switcher itself. Keep these arrays — not copy.ts — as the
 * source, since this is the one place they're allowed to exist at all.
 */
const TAKE_A: TenetTake = {
  id: 'a',
  label: 'take a — quieter',
  closer: 'go build a thing.',
  tenets: [
    {
      title: 'small weird things count',
      body: 'the 2am experiment, the single-purpose tool, the joke that compiles. they all belong here.',
    },
    {
      title: 'sharing beats selling',
      body: 'no launch day, no pricing page. you made a thing; someone else gets to use it. that’s the whole transaction.',
    },
    {
      title: 'forking is a compliment',
      body: 'the highest praise isn’t a star. it’s someone taking your code home and making it theirs.',
    },
    {
      title: 'finished is optional',
      body: 'a readme and a repo is enough. polish when you feel like it, or never.',
    },
    {
      title: 'no leaderboards for love',
      body: 'nothing here ranks you. new projects sit beside big ones, and both look loved.',
    },
    {
      title: 'take what you need, leave what you learned',
      body: 'clone freely. and when you build on it, show that too.',
    },
  ],
};

const TAKE_B: TenetTake = {
  id: 'b',
  label: 'take b — punchier',
  closer: 'now go build a thing.',
  tenets: [
    {
      title: 'weird little things deserve a stage',
      body: 'you built a synth that fits in a tweet. a cron job with attitude. the world should see this.',
    },
    {
      title: 'nothing here is for sale',
      body: 'no ‘try free’, no credit card, no funnel. just repos and the people who made them.',
    },
    {
      title: 'getting forked is the point',
      body: 'stars are nice. someone shipping their weekend on top of your weekend? that’s the good stuff.',
    },
    {
      title: 'ship it half-done',
      body: '‘i made a maze generator. it makes mazes.’ is a complete product description.',
    },
    {
      title: 'likes don’t rank you',
      body: 'the feed isn’t a contest. it’s a shelf, and every shelf has room.',
    },
    {
      title: 'steal like a dork',
      body: 'take the code. take the idea. tell people where you got it, then make it weirder.',
    },
  ],
};

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

        <div className="mt-16 sm:mt-20">
          <TakeSwitcher takeA={TAKE_A} takeB={TAKE_B} />
        </div>

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
