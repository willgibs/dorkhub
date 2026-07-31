import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';

export const metadata: Metadata = {
  title: 'privacy',
  description: 'what we know about you, and what we do with it.',
};

/**
 * DRAFT copy (P4 L3) — written for Will's review at the launch-go gate.
 * Every claim in here is checked against how the system actually works
 * (likes/saves private by design, hashed rate-limit ips, cookieless
 * analytics) — if the system changes, this page changes in the same round.
 */
const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: 'what we collect',
    body: [
      'when you sign in with github we receive your github identity: numeric id, username, display name, avatar and the email on your github account. we never see your github password, and we request zero extra permissions — dorkhub cannot touch your repositories.',
      'what you do here is stored so the product works: projects you showcase, likes, saves, lists, follows, reports, and the usual short-lived server logs.',
    ],
  },
  {
    title: 'curated pages',
    body: [
      'unclaimed project pages are built from public github data only (repository metadata, READMEs, public avatars). they are labeled, claimable by the real maintainer, and removable on request — email us and it is gone, permanently blocklisted from re-import.',
    ],
  },
  {
    title: 'what is public and what is not',
    body: [
      'public: your profile, your published project pages, your public lists, follower counts, and per-project totals (likes, saves, "in n lists").',
      'not public: WHO liked or saved something (those rows are visible only to you, by database rule, not by convention), your private lists and their contents, and your email.',
    ],
  },
  {
    title: 'cookies and tools',
    body: [
      'we set auth session cookies so you stay signed in — no advertising or cross-site tracking cookies, ever.',
      'infrastructure that touches your data: supabase (database + auth), vercel (hosting, plus cookieless aggregate analytics), github (public api reads), and sentry (error reports, configured to strip personal data).',
      'search abuse control stores a HASHED form of your ip address for at most an hour — never the raw address.',
    ],
  },
  {
    title: 'what we never do',
    body: ['sell your data. share it with advertisers. email you marketing you did not ask for.'],
  },
  {
    title: 'deleting your stuff',
    body: [
      'you can delete your projects and lists yourself. for full account deletion, email us and we will remove your account and everything attached to it — there is no self-serve button yet, and we would rather say that plainly than hide it.',
    ],
  },
  {
    title: 'talk to us',
    body: ['privacy questions or requests: hi@dorkhub.com.'],
  },
];

export default function PrivacyPage() {
  return (
    <PageShell className="flex w-full max-w-[720px] flex-col gap-10 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[32px] font-extrabold tracking-tight">privacy</h1>
        <p className="font-mono text-[12.5px] text-muted-foreground">
          <span aria-hidden="true">{'// '}</span>
          what we know about you, and what we do with it · last updated 2026-07-30
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
