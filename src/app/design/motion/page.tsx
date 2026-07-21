import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { StatButtonDemo } from '@/app/design/components/demo-widgets';
import { CommandPaletteDemo, ReducedMotionSimulator } from '@/app/design/motion/demo-widgets';
import { AvatarStack } from '@/components/avatar-stack';
import { CopyButton } from '@/components/copy-button';
import { ProjectCard } from '@/components/project-card';
import { RepoStatsRow } from '@/components/repo-stats-row';
import { SectionHeader } from '@/components/section-header';
import { SkeletonCard } from '@/components/skeleton-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { authors, projects } from '@/lib/fixtures';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'motion' };

const [tinysynth, gitgoblin, plantdad] = projects;

const DURATIONS = [
  { cls: 'duration-150', label: '150ms', note: '--motion-fast · hover, press, color' },
  {
    cls: 'duration-200',
    label: '200ms',
    note: '--motion-base · tooltips, dropdowns, modal enter/exit',
  },
  { cls: 'duration-300', label: '300ms', note: '--motion-slow · larger reveals, sheet exit' },
  { cls: 'duration-500', label: '500ms', note: '--motion-enter · sheet open only' },
] as const;

const EASINGS = [
  {
    cls: 'ease-quiet',
    label: 'ease-quiet',
    note: 'cubic-bezier(.16, 1, .3, 1) — strong ease-out, every enter/exit',
  },
  {
    cls: 'ease-quiet-in-out',
    label: 'ease-quiet-in-out',
    note: 'cubic-bezier(.65, 0, .35, 1) — on-screen moves',
  },
] as const;

const REJECTED = [
  { name: 'card stack hover', reason: "no surface to stack — ProjectCard doesn't layer." },
  { name: '3D tilt', reason: 'contradicts the locked hover treatment (sharpen + lift 1px).' },
  { name: 'literal confetti', reason: 'bg-bloom pulse instead — same celebratory beat, on-brand.' },
  {
    name: 'Pro gradient text',
    reason: 'no gradient type in this system; also Pro-gated on source.',
  },
] as const;

function Entry({
  title,
  tokens,
  note,
  children,
}: {
  title: string;
  tokens: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
          {title}
        </h3>
        <p className="font-mono text-[11px] text-primary">{tokens}</p>
      </div>
      <div className="edge-highlight flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
        {children}
      </div>
      {note ? <p className="max-w-[62ch] text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export default function DesignMotionPage() {
  return (
    <div className="flex flex-col gap-16">
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {'// motion'}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Motion</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Every duration and easing below is a live var() from globals.css, not a copy-pasted number
          — read{' '}
          <code className="rounded-sm bg-code-bg px-1.5 py-0.5 font-mono text-code-text">
            docs/motion.md
          </code>{' '}
          for the full policy this page demonstrates.
        </p>
      </div>

      {/* ------------------------------------------------------------ 01 tokens */}
      <section className="flex flex-col gap-6">
        <SectionHeader
          kicker="01 · tokens"
          title="Duration & easing"
          note="Hover a card to replay it. No component is allowed to invent its own timing or curve — everything ships from these four durations and two easings."
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {DURATIONS.map((d) => (
            <div key={d.cls} className="group flex flex-col items-center gap-2.5 text-center">
              <div className="relative h-10 w-full overflow-hidden rounded-md border bg-secondary">
                <div
                  className={cn(
                    'absolute inset-y-1 left-1 size-8 rounded-sm bg-primary ease-quiet group-hover:translate-x-[calc(100%+0.5rem)]',
                    d.cls,
                  )}
                />
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                <p className="text-foreground">{d.label}</p>
                <p>{d.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="group edge-highlight flex flex-col gap-3 rounded-lg border bg-card p-5">
          {EASINGS.map((e) => (
            <div key={e.cls} className="flex flex-col gap-1.5">
              <div className="relative h-8 w-full overflow-hidden rounded-md border bg-secondary">
                <div
                  className={cn(
                    'absolute inset-y-1 left-1 size-6 rounded-sm bg-primary duration-500 group-hover:translate-x-[calc(100%+1rem)]',
                    e.cls,
                  )}
                />
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                <span className="text-foreground">{e.label}</span> · {e.note}
              </p>
            </div>
          ))}
          <p className="font-mono text-[11px] text-muted-foreground">
            {'// hover this card to replay both at once'}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- 02 reduced motion */}
      <section className="flex flex-col gap-6">
        <SectionHeader
          kicker="02 · reduced motion"
          title="The kill switch"
          note="Decorative motion is skipped entirely under prefers-reduced-motion, never just played shorter — functional loading indicators (the spinner) are the one carve-out."
        />
        <ReducedMotionSimulator />
      </section>

      {/* --------------------------------------------------------- 03 adopted */}
      <section className="flex flex-col gap-6">
        <SectionHeader
          kicker="03 · adopted transitions"
          title="Every shipped motion, in one place"
          note="The six overlay primitives below are adapted from transitions.dev's free-tier catalog — re-implemented on our own tokens and class names, never vendored (their terms forbid redistributing the library). Everything past the overlays is original to this system."
        />

        <Entry title="dialog" tokens="200ms · ease-quiet · centered, scale .95→1 + fade">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                preview {tinysynth.name}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{tinysynth.name}</DialogTitle>
                <DialogDescription>{tinysynth.tagline}</DialogDescription>
              </DialogHeader>
              <RepoStatsRow
                language={tinysynth.language}
                languageColor={tinysynth.languageColor}
                stars={tinysynth.stars}
                forks={tinysynth.forks}
                license={tinysynth.license}
              />
            </DialogContent>
          </Dialog>
        </Entry>

        <Entry title="dropdown-menu" tokens="200ms · ease-quiet · scales from trigger origin">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                sort: recent
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>sort</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>recent</DropdownMenuItem>
              <DropdownMenuItem>trending</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Entry>

        <Entry title="tooltip" tokens="200ms · ease-quiet · scales from trigger origin">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  hover me
                </Button>
              </TooltipTrigger>
              <TooltipContent>2KB web synth</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Entry>

        <Entry title="select" tokens="200ms · ease-quiet · scales from trigger origin">
          <Select defaultValue={tinysynth.language}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={tinysynth.language}>{tinysynth.language}</SelectItem>
              <SelectItem value={gitgoblin.language}>{gitgoblin.language}</SelectItem>
              <SelectItem value={plantdad.language}>{plantdad.language}</SelectItem>
            </SelectContent>
          </Select>
        </Entry>

        <Entry title="hover-card" tokens="200ms · ease-quiet · scales from trigger origin">
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className="rounded-sm font-mono text-sm text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                @{plantdad.author}
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="font-display font-bold">{authors[plantdad.author].displayName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{authors[plantdad.author].bio}</p>
            </HoverCardContent>
          </HoverCard>
        </Entry>

        <Entry title="sheet" tokens="500ms in / 300ms out · ease-quiet">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                @{plantdad.author}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{authors[plantdad.author].displayName}</SheetTitle>
                <SheetDescription>{authors[plantdad.author].bio}</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </Entry>

        <Entry
          title="collapsible"
          tokens="300ms · ease-quiet · grid-rows 0fr→1fr"
          note="Never tweens height directly — a grid track sized 0fr/1fr does the reveal, so it's transform/layout-cheap."
        >
          <Collapsible className="w-full max-w-sm">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {plantdad.tags.length} tags
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 flex flex-wrap gap-1.5">
              {plantdad.tags.map((t) => (
                <span key={t} className="rounded-sm bg-secondary px-2 py-1 font-mono text-xs">
                  #{t}
                </span>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </Entry>

        <Entry
          title="stat-button like-pop"
          tokens="150ms ease-quiet pop · 400ms ease-quiet burst"
          note="Scale 1→1.15→1, and only on the ++ (like) action going active — never on save, never on un-liking. The 5-particle burst is primary-tinted and restrained on purpose."
        >
          <StatButtonDemo kind="like" count={412} />
        </Entry>

        <Entry title="copy-button" tokens="200ms ease-quiet · icon crossfade + stroke-draw">
          <CopyButton command={`git clone github.com/${tinysynth.author}/${tinysynth.slug}`} />
        </Entry>

        <Entry title="theme-toggle" tokens="150ms ease-quiet · label crossfade (scale + blur)">
          <ThemeToggle />
        </Entry>

        <Entry
          title="avatar-stack"
          tokens="150ms ease-quiet in · 200ms overshoot out"
          note="The overshoot return uses an explicitly-approved custom back-ease (cubic-bezier(.34,1.56,.64,1)) — the one place this system allows a curve outside the two named tokens."
        >
          <AvatarStack
            users={Object.values(authors).map((a) => ({
              username: a.username,
              initial: a.initial,
            }))}
          />
        </Entry>

        <Entry
          title="skeleton-card shimmer"
          tokens="1.6s linear, infinite — respects the kill switch"
        >
          <div className="w-full max-w-xs">
            <SkeletonCard />
          </div>
        </Entry>

        <Entry title="number pop-in" tokens="200ms ease-quiet · RepoStatsRow + ProjectCard counts">
          <RepoStatsRow
            language={tinysynth.language}
            languageColor={tinysynth.languageColor}
            stars={tinysynth.stars}
            forks={tinysynth.forks}
            license={tinysynth.license}
          />
        </Entry>

        <Entry title="switch" tokens="150ms ease-quiet-in-out · thumb + track color">
          <Switch defaultChecked />
        </Entry>

        <Entry
          title="project-card hover"
          tokens="150ms ease-quiet · border sharpen + lift 1px"
          note="Retuned from a hardcoded ease-out to the token — same behavior, correct curve."
        >
          <div className="w-full max-w-xs">
            <ProjectCard project={tinysynth} author={authors[tinysynth.author]} variant="compact" />
          </div>
        </Entry>

        <Entry
          title="command palette"
          tokens="no animation — ever"
          note="⌘K is opened 100+ times a day by the people who use it most. Per docs/motion.md that frequency gets zero animation, full stop — contrast this against every other entry above."
        >
          <CommandPaletteDemo />
        </Entry>
      </section>

      {/* --------------------------------------------------------- 04 rejected */}
      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="04 · rejected"
          title="Considered, not shipped"
          note="Every one of these was a real idea before it wasn't — the reason is the point."
        />
        <ul className="edge-highlight flex flex-col gap-2.5 rounded-lg border bg-card p-6 text-sm">
          {REJECTED.map((r) => (
            <li key={r.name} className="flex flex-wrap gap-x-2.5 gap-y-1">
              <span className="font-mono text-muted-foreground line-through decoration-1">
                {r.name}
              </span>
              <span className="text-muted-foreground">— {r.reason}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
