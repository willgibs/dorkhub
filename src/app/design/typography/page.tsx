import type { Metadata } from 'next';
import { SectionHeader } from '@/components/section-header';
import { copy } from '@/lib/copy';
import { projects } from '@/lib/fixtures';

export const metadata: Metadata = { title: 'typography' };

const [tinysynth, , plantdad] = projects;

/**
 * Every text size actually in use across src/components + src/app, grouped by
 * family, smallest first. Pulled by grepping the codebase (2026-07-21) rather
 * than invented — if this drifts from reality, re-grep and update it.
 */
const SCALE = [
  {
    px: 8,
    family: 'mono',
    cls: 'font-mono',
    where: 'site-footer',
    usage: '✦ separator between footer links',
  },
  { px: 10.5, family: 'mono', cls: 'font-mono', where: 'avatar-stack', usage: '+N overflow chip' },
  {
    px: 10.5,
    family: 'mono',
    cls: 'font-mono',
    where: 'project-card',
    usage: 'featured label bar ("pick of the week")',
  },
  {
    px: 11,
    family: 'mono',
    cls: 'font-mono',
    where: 'avatar-stack',
    usage: 'initials inside the avatar circle',
  },
  {
    px: 11,
    family: 'mono',
    cls: 'font-mono',
    where: 'project-card',
    usage: 'author @handle in the card footer',
  },
  {
    px: 11.5,
    family: 'mono',
    cls: 'font-mono',
    where: 'copy-button',
    usage: '"copy" / "copied" button label',
  },
  {
    px: 11.5,
    family: 'mono',
    cls: 'font-mono',
    where: 'section-header',
    usage: '"// " mono kicker',
  },
  {
    px: 12,
    family: 'sans',
    cls: 'text-xs',
    where: 'tailwind default',
    usage: 'metadata rows, badges, hints (most-used size)',
  },
  {
    px: 12.5,
    family: 'mono',
    cls: 'font-mono',
    where: 'repo-stats-row',
    usage: 'language · stars · forks · updated',
  },
  {
    px: 12.5,
    family: 'mono',
    cls: 'font-mono',
    where: 'stat-button',
    usage: 'like / save label + count',
  },
  {
    px: 12.5,
    family: 'mono',
    cls: 'font-mono',
    where: 'profile-header',
    usage: 'projects · followers stat row',
  },
  {
    px: 13,
    family: 'sans',
    cls: 'text-[13px]',
    where: 'follow-button',
    usage: 'follow / following label',
  },
  { px: 13.5, family: 'sans', cls: 'text-[13.5px]', where: 'project-card', usage: 'tagline' },
  {
    px: 14,
    family: 'sans',
    cls: 'text-sm',
    where: 'tailwind default',
    usage: 'body copy, nav links, form labels',
  },
  {
    px: 14.5,
    family: 'sans',
    cls: 'text-[14.5px]',
    where: 'callout / empty-state',
    usage: 'pull-quote body / invitation message',
  },
  { px: 15, family: 'sans', cls: 'text-[15px]', where: 'profile-header', usage: 'bio' },
  {
    px: 15.5,
    family: 'display',
    cls: 'text-[15.5px] font-display font-bold',
    where: 'update-post',
    usage: 'update title',
  },
  {
    px: 16,
    family: 'sans',
    cls: 'text-base',
    where: 'tailwind default',
    usage: 'ui/input, ui/textarea',
  },
  {
    px: 16.5,
    family: 'display',
    cls: 'text-[16.5px] font-display font-bold',
    where: 'project-card',
    usage: 'feed-variant project title',
  },
  {
    px: 19,
    family: 'display',
    cls: 'text-[19px] font-display font-extrabold',
    where: 'site-header',
    usage: 'dorkhub_ wordmark',
  },
  {
    px: 24,
    family: 'display',
    cls: 'text-2xl font-display font-bold',
    where: 'home page',
    usage: 'logo lockup',
  },
  {
    px: 26,
    family: 'display',
    cls: 'text-[26px] font-display font-extrabold',
    where: 'profile-header',
    usage: 'display name',
  },
  {
    px: 27,
    family: 'display',
    cls: 'text-[27px] font-display font-bold',
    where: 'section-header',
    usage: 'section title (this page uses it)',
  },
  {
    px: 30,
    family: 'display',
    cls: 'text-3xl font-display font-bold',
    where: 'design overview',
    usage: '"Living styleguide" h1',
  },
  {
    px: 30,
    family: 'display',
    cls: 'text-[30px] font-display font-bold',
    where: 'profile-header',
    usage: 'avatar initial',
  },
  {
    px: 48,
    family: 'display',
    cls: 'text-5xl font-display font-bold',
    where: 'home page',
    usage: 'hero headline',
  },
] as const;

const WEIGHTS = [
  { cls: 'font-normal', label: '400 · normal' },
  { cls: 'font-medium', label: '500 · medium' },
  { cls: 'font-semibold', label: '600 · semibold' },
  { cls: 'font-bold', label: '700 · bold' },
  { cls: 'font-extrabold', label: '800 · extrabold' },
] as const;

export default function DesignTypographyPage() {
  return (
    <div className="flex flex-col gap-16">
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {'// typography'}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Type specimen</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Three families, one job each: Instrument Sans carries display weight, Geist carries body
          copy, JetBrains Mono carries metadata and code.
        </p>
      </div>

      <section className="flex flex-col gap-5">
        <SectionHeader kicker="01 · families" title="The three faces" />
        <div className="flex flex-col gap-6">
          <div className="edge-highlight rounded-lg border bg-card p-6">
            <p className="font-mono text-[11px] text-muted-foreground uppercase">
              font-display — Instrument Sans
            </p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {copy.heroHeadline}
            </p>
          </div>
          <div className="edge-highlight rounded-lg border bg-card p-6">
            <p className="font-mono text-[11px] text-muted-foreground uppercase">
              font-sans — Geist
            </p>
            <p className="mt-2 max-w-lg text-base leading-relaxed">{copy.heroSub}</p>
          </div>
          <div className="edge-highlight rounded-lg border bg-card p-6">
            <p className="font-mono text-[11px] text-muted-foreground uppercase">
              font-mono — JetBrains Mono
            </p>
            <p className="mt-2 whitespace-pre-line font-mono text-sm text-muted-foreground">
              {copy.notFound}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="02 · scale"
          title="Sizes in use"
          note="Every text size found in the codebase, smallest to largest, with where it lives."
        />
        <div className="flex flex-col divide-y divide-border overflow-x-auto rounded-lg border">
          {SCALE.map((s, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: rows can repeat the same px at different sizes
              key={`${s.px}-${i}`}
              className="flex flex-wrap items-baseline gap-x-6 gap-y-1 bg-card px-5 py-3.5"
            >
              <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                {s.px}px
              </span>
              <span className={`${s.cls} shrink-0`}>{s.where}</span>
              <span className="text-xs text-muted-foreground">{s.usage}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="03 · weight"
          title="Weights"
          note="font-display at each weight in use."
        />
        <div className="edge-highlight flex flex-col gap-3 rounded-lg border bg-card p-6">
          {WEIGHTS.map((w) => (
            <p key={w.cls} className={`font-display text-xl ${w.cls}`}>
              {w.label} — {tinysynth.name}
            </p>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="04 · tabular-nums"
          title="Numeric alignment"
          note="Every metadata number in the system gets tabular-nums so columns of stats line up."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="edge-highlight flex flex-col gap-1 rounded-lg border bg-card p-5 font-mono text-sm">
            <p className="mb-1 text-xs text-muted-foreground">without tabular-nums</p>
            <p>★ {tinysynth.stars}</p>
            <p>★ {plantdad.stars}</p>
          </div>
          <div className="edge-highlight flex flex-col gap-1 rounded-lg border bg-card p-5 font-mono text-sm tabular-nums">
            <p className="mb-1 text-xs text-muted-foreground">with tabular-nums</p>
            <p>★ {tinysynth.stars}</p>
            <p>★ {plantdad.stars}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
