import type { Metadata } from 'next';
import { EmptyState } from '@/components/empty-state';
import { SectionHeader } from '@/components/section-header';
import { StatButton } from '@/components/stat-button';
import { copy } from '@/lib/copy';

export const metadata: Metadata = { title: 'voice' };

const RULES = [
  'Generosity verbs: share, fork, take, borrow, tinker.',
  'Banned: buy, sell, hire, 🚀, growth-speak.',
  'Errors take the blame — "something broke on our end — not you, us."',
  'Empty states are invitations, never a scold.',
  'Absence, not zero: null stars/likes render nothing, never "0".',
  'Lowercase-calm, playful register — no exclamation-point energy.',
] as const;

export default function DesignVoicePage() {
  const entries = Object.entries(copy);

  return (
    <div className="flex flex-col gap-16">
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {'// voice'}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Voice</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Every user-facing string ships from{' '}
          <code className="rounded-sm bg-code-bg px-1.5 py-0.5 font-mono text-code-text">
            src/lib/copy.ts
          </code>{' '}
          — never hardcoded in a component. The table below is read straight from that file, so it
          can't drift from what's actually shipping.
        </p>
      </div>

      <section className="flex flex-col gap-5">
        <SectionHeader kicker="01 · rules" title="The rules" />
        <ul className="edge-highlight flex flex-col gap-2.5 rounded-lg border bg-card p-6 text-sm">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-2.5">
              <span aria-hidden="true" className="text-primary">
                {'//'}
              </span>
              <span className="text-card-foreground">{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader kicker="02 · strings" title="Every string in copy.ts" />
        <div className="flex flex-col divide-y divide-border overflow-x-auto rounded-lg border">
          {entries.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1 bg-card px-5 py-3.5 sm:flex-row sm:gap-6">
              <span className="w-40 shrink-0 font-mono text-xs text-muted-foreground">
                copy.{key}
              </span>
              <span className="whitespace-pre-line text-sm text-card-foreground">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="03 · in the wild"
          title="Voice in context"
          note="The same strings, rendered by the real components that ship them."
        />
        <div className="edge-highlight flex flex-wrap items-center gap-4 rounded-lg border bg-card p-5">
          <StatButton kind="like" active={false} count={12} />
          <StatButton kind="save" active count={null} />
          <span className="font-mono text-xs text-muted-foreground">
            {'// '}
            {copy.forkNudge}
          </span>
        </div>
        <EmptyState />
      </section>
    </div>
  );
}
