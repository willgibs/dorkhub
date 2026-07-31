import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'sponsor',
  description: 'featured slots, the honest kind.',
};

/**
 * Copy approved-in-principle by Will 2026-07-31 (v2 after his review:
 * "match the inline placement, make it actionable"). Edits are a product
 * decision; pause and ask. No pricing on this page ON PURPOSE: slots are
 * mechanism-only (D48), nothing is priced yet — the mailto thread is the
 * deal surface. hi@dorkhub.com is live (Cloudflare Email Routing).
 */
const CONTACT = 'hi@dorkhub.com';

const MAILTO = `mailto:${CONTACT}?subject=${encodeURIComponent('featured slot')}`;

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: 'what a featured slot is',
    body: [
      'a handful of hand-placed cards inside the gallery itself — first cells of the grid, same card every project gets, with a label on the card that says featured. not a banner, not a separate row, no algorithm juice.',
    ],
  },
  {
    title: 'what it is not',
    body: [
      'not an ad network. no tracking pixels, no sponsored search results, no pay-to-rank. the gallery around a featured card is untouched, and nothing about a placement changes how any other project is discovered.',
    ],
  },
  {
    title: 'the rules',
    body: [
      'every slot is labeled, always — the label is part of the deal, not negotiable. only published projects can be featured, and a slot ends early if the project stops being a good citizen. moderation outranks money here.',
    ],
  },
];

const INCLUDE = [
  'the github repo (or dorkhub page) you want featured',
  'roughly when, and for how long — a week is typical',
  'the label you’d like on the card — “featured” by default, or a short “sponsored by …”',
];

export default function SponsorPage() {
  return (
    <PageShell className="flex w-full max-w-[720px] flex-col gap-10 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[32px] font-extrabold tracking-tight">sponsor</h1>
        <p className="font-mono text-[12.5px] text-muted-foreground">
          <span aria-hidden="true">{'// '}</span>
          featured slots, the honest kind · last updated 2026-07-31
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

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">how to sponsor</h2>
        <p className="text-[15px] leading-7 text-muted-foreground">
          email us. a human reads every request, says no to things that don&rsquo;t fit the spirit
          of the place, and replies within a couple of days with dates and details. include:
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-7 text-muted-foreground">
          {INCLUDE.map((item) => (
            <li key={item.slice(0, 24)}>{item}</li>
          ))}
        </ul>
        <div className="mt-2 flex items-center gap-4">
          <Button asChild>
            <a href={MAILTO}>email {CONTACT}</a>
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            subject line: &ldquo;featured slot&rdquo;
          </span>
        </div>
      </section>
    </PageShell>
  );
}
