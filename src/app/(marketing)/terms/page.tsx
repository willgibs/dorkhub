import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';

export const metadata: Metadata = {
  title: 'terms',
  description: 'the deal, in plain language.',
};

/**
 * DRAFT copy (P4 L3) — indie-standard terms in the house register, written
 * for Will's review at the launch-go gate. Edits to these strings after his
 * approval are a product decision; pause and ask. The contact address is
 * hi@willgibs.com pending his confirmation.
 */
const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: 'what dorkhub is',
    body: [
      'dorkhub is a place to showcase and discover things people build for fun — open-source projects with pages, tags, likes, saves and lists. it is not a marketplace, a launch platform or a hiring board.',
    ],
  },
  {
    title: 'your account',
    body: [
      'you sign in with github. your dorkhub username is your github login. you are responsible for what happens under your account; if you think someone else is using it, tell us.',
    ],
  },
  {
    title: 'your content',
    body: [
      'what you make stays yours. by posting on dorkhub (project pages, taglines, descriptions, lists) you give us permission to host and display it here — that is the whole license, and it ends when you remove the content.',
      'only share what you have the right to share. project pages point at public repositories you own or maintain.',
    ],
  },
  {
    title: 'curated pages',
    body: [
      'some pages are curated by dorkhub from public github data before their maintainer arrives. they are labeled as such, and the maintainer can claim the page or ask for it to be removed — both are one click or one email away. we honor removal requests and keep a blocklist so removed work is not re-imported.',
    ],
  },
  {
    title: 'house rules',
    body: [
      'no spam, no impersonation, no malware, no harassment, nothing illegal. no scraping the site at a scale a reasonable person would call rude. use the report button when something looks wrong — a human reviews every report.',
    ],
  },
  {
    title: 'moderation',
    body: [
      'we can unpublish, remove or block content that breaks these rules or the spirit of the place. we prefer reversible actions first (unpublishing) and keep irreversible ones (deletion, blocking) for clear cases.',
    ],
  },
  {
    title: 'the fine print',
    body: [
      'dorkhub is provided as-is, no warranties. we do our best to keep it up and honest, but we are a very small operation and cannot promise uninterrupted service or accept liability for losses from using it — to the maximum extent the law allows.',
      'we may update these terms; material changes get announced on the site. if you keep using dorkhub after a change, that is acceptance.',
    ],
  },
  {
    title: 'talk to us',
    body: ['questions, removals, anything: hi@willgibs.com.'],
  },
];

export default function TermsPage() {
  return (
    <PageShell className="flex w-full max-w-[720px] flex-col gap-10 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[32px] font-extrabold tracking-tight">terms</h1>
        <p className="font-mono text-[12.5px] text-muted-foreground">
          <span aria-hidden="true">{'// '}</span>
          the deal, in plain language · last updated 2026-07-30
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
