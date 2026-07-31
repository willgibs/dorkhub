import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';

export const metadata: Metadata = {
  title: 'sponsor',
  description: 'featured slots, the honest kind.',
};

/**
 * DRAFT copy (P4, Will's direction 2026-07-30: featured concept approved for
 * future sponsorships + "we'd benefit from a sponsor page") — written for his
 * review like terms/privacy. Edits after approval are a product decision;
 * pause and ask. No pricing on this page ON PURPOSE: slots are mechanism-only
 * (D48) and nothing is sold yet — the page explains the shape and opens an
 * email thread. Contact address is hi@willgibs.com pending the
 * hi@dorkhub.com routing swap (same literal as terms/privacy; swap together).
 */
const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: 'what a featured slot is',
    body: [
      'the front feed can carry a few hand-placed cards at the top. a featured card is the same card every project gets — same layout, same stats, same everything — with a label on it that says so. no stealth, no algorithm juice.',
    ],
  },
  {
    title: 'what it is not',
    body: [
      'not an ad network. no tracking pixels, no sponsored search results, no pay-to-rank. the feed below the slot is untouched, and nothing about a featured placement changes how any other project is discovered.',
    ],
  },
  {
    title: 'who it is for',
    body: [
      'people who want to put a good open-source thing in front of hobbyist devs: your own tool, a project your company sponsors, a thing you just think deserves eyes. if it fits the spirit of the place, it fits the slot.',
    ],
  },
  {
    title: 'the rules',
    body: [
      'every slot is labeled, always — the label is part of the deal, not negotiable. only published projects can be featured, and a slot ends early if the project stops being a good citizen. moderation outranks money here.',
    ],
  },
  {
    title: 'how to sponsor',
    body: [
      'email hi@willgibs.com with the repo you have in mind and roughly when you would like it featured. every slot is placed by a human, and we say no to things that do not fit. we will work out the details by reply.',
    ],
  },
];

export default function SponsorPage() {
  return (
    <PageShell className="flex w-full max-w-[720px] flex-col gap-10 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[32px] font-extrabold tracking-tight">sponsor</h1>
        <p className="font-mono text-[12.5px] text-muted-foreground">
          <span aria-hidden="true">{'// '}</span>
          featured slots, the honest kind · last updated 2026-07-30
        </p>
      </div>
      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold">{section.title}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="text-[15px] leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </PageShell>
  );
}
