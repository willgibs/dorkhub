import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import {
  FollowButtonDemo,
  MountWhenVisible,
  StatButtonDemo,
  ToastDemo,
} from '@/app/design/components/demo-widgets';
import { AvatarStack } from '@/components/avatar-stack';
import { Callout } from '@/components/callout';
import { CopyButton } from '@/components/copy-button';
import { EmptyState } from '@/components/empty-state';
import { FeedFilters } from '@/components/feed-filters';
import { LanguageDot } from '@/components/language-dot';
import { MarkdownProse } from '@/components/markdown-prose';
import { PageShell } from '@/components/page-shell';
import { ProfileHeader } from '@/components/profile-header';
import { ProjectCard } from '@/components/project-card';
import { RepoStatsRow } from '@/components/repo-stats-row';
import { ScreenshotGallery } from '@/components/screenshot-gallery';
import { SectionHeader } from '@/components/section-header';
import { SignInWithGitHub } from '@/components/sign-in-github';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SkeletonCard } from '@/components/skeleton-card';
import { StatButton } from '@/components/stat-button';
import { TagChip } from '@/components/tag-chip';
import { ThemeToggle } from '@/components/theme-toggle';
import { TimeAgo } from '@/components/time-ago';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UpdatePost } from '@/components/update-post';
import { UserHoverCard } from '@/components/user-hover-card';
import { copy } from '@/lib/copy';
import { authors, projects, sampleReadmeHtml, sampleUpdate } from '@/lib/fixtures';

export const metadata: Metadata = { title: 'components' };

const [tinysynth, gitgoblin, plantdad, untitledMaze] = projects;
const languages = Array.from(new Set(projects.map((p) => p.language)));
const sortOptions = ['recent', 'trending'] as const;
const filterTags = Array.from(new Set(projects.flatMap((p) => p.tags))).slice(0, 6);

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t pt-8 first:border-t-0 first:pt-0">
      <h3 className="font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Demo({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label ? <p className="font-mono text-[11px] text-muted-foreground">{label}</p> : null}
      <div className="edge-highlight flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
        {children}
      </div>
    </div>
  );
}

export default function DesignComponentsPage() {
  return (
    <div className="flex flex-col gap-16">
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {'// components'}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Component catalog</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Every design-system component in every state, fed only by{' '}
          <code className="rounded-sm bg-code-bg px-1.5 py-0.5 font-mono text-code-text">
            @/lib/fixtures
          </code>{' '}
          and{' '}
          <code className="rounded-sm bg-code-bg px-1.5 py-0.5 font-mono text-code-text">
            @/lib/copy
          </code>
          . Interactive ones are backed by{' '}
          <code className="rounded-sm bg-code-bg px-1.5 py-0.5 font-mono text-code-text">
            demo-widgets.tsx
          </code>
          .
        </p>
      </div>

      {/* ---------------------------------------------------------------- atoms */}
      <section className="flex flex-col gap-6">
        <SectionHeader kicker="01 · atoms" title="Atoms" />

        <Group title="tag-chip">
          <Demo label="default / active / hash-prefixed / active + hash-prefixed">
            <TagChip tag={filterTags[0]} />
            <TagChip tag={filterTags[1]} active />
            <TagChip tag={filterTags[2]} hashPrefix />
            <TagChip tag={filterTags[3]} hashPrefix active />
          </Demo>
        </Group>

        <Group title="language-dot">
          <Demo>
            {projects.map((p) => (
              <LanguageDot key={p.slug} language={p.language} color={p.languageColor} />
            ))}
          </Demo>
        </Group>

        <Group title="repo-stats-row">
          <Demo label="stars + forks + license + updated">
            <RepoStatsRow
              language={tinysynth.language}
              languageColor={tinysynth.languageColor}
              stars={tinysynth.stars}
              forks={tinysynth.forks}
              license={tinysynth.license}
              updatedAgo={tinysynth.updatedAgo}
            />
          </Demo>
          <Demo label="brand new — null stars render as absence, never “0”">
            <RepoStatsRow
              language={untitledMaze.language}
              languageColor={untitledMaze.languageColor}
              stars={untitledMaze.stars}
              updatedAgo={untitledMaze.updatedAgo}
            />
          </Demo>
        </Group>

        <Group title="time-ago">
          <Demo label="preformatted string / semantic <time> with a title tooltip">
            <TimeAgo value={tinysynth.updatedAgo ?? ''} />
            <TimeAgo
              value={plantdad.updatedAgo ?? ''}
              dateTime="2026-06-21T00:00:00Z"
              title="2026-06-21"
            />
          </Demo>
        </Group>

        <Group title="copy-button">
          <Demo>
            <CopyButton command={`git clone github.com/${tinysynth.author}/${tinysynth.slug}`} />
          </Demo>
        </Group>

        <Group title="theme-toggle">
          <Demo>
            <ThemeToggle />
          </Demo>
        </Group>
      </section>

      {/* --------------------------------------------------------------- social */}
      <section className="flex flex-col gap-6">
        <SectionHeader kicker="02 · social" title="Social" />

        <Group title="stat-button">
          <Demo label="like — inactive / active / count-null (absence) / disabled">
            <StatButtonDemo kind="like" count={tinysynth.likes} />
            <StatButtonDemo kind="like" initialActive count={tinysynth.likes} />
            <StatButtonDemo kind="like" count={untitledMaze.likes} />
            <StatButton kind="like" active={false} count={gitgoblin.likes} disabled />
          </Demo>
          <Demo label="save — inactive / active">
            <StatButtonDemo kind="save" count={null} />
            <StatButtonDemo kind="save" initialActive count={null} />
          </Demo>
        </Group>

        <Group title="follow-button">
          <Demo label="follow / following">
            <FollowButtonDemo />
            <FollowButtonDemo initialFollowing />
          </Demo>
        </Group>

        <Group title="avatar-stack">
          <Demo label="within max / collapsed into a +N overflow chip">
            <AvatarStack users={Object.values(authors).slice(0, 2)} />
            <AvatarStack users={Object.values(authors)} max={2} />
          </Demo>
        </Group>

        <Group title="user-hover-card">
          <Demo label="hover or focus the username">
            <UserHoverCard user={authors[plantdad.author]}>
              <button
                type="button"
                className="rounded-sm font-mono text-sm text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                @{plantdad.author}
              </button>
            </UserHoverCard>
          </Demo>
        </Group>

        <Group title="sign-in-github">
          <Demo>
            <SignInWithGitHub />
          </Demo>
        </Group>
      </section>

      {/* ---------------------------------------------------------------- cards */}
      <section className="flex flex-col gap-6">
        <SectionHeader kicker="03 · cards" title="Cards" />

        <Group title="project-card">
          <Demo label="feed — with screenshot + tags">
            <div className="w-full max-w-sm">
              <ProjectCard
                project={tinysynth}
                author={authors[tinysynth.author]}
                staggerIndex={0}
              />
            </div>
          </Demo>
          <Demo label="feed — brand new (null stars/likes, no screenshot)">
            <div className="w-full max-w-sm">
              <ProjectCard
                project={untitledMaze}
                author={authors[untitledMaze.author]}
                staggerIndex={1}
              />
            </div>
          </Demo>
          <Demo label="feed — og-image media (GitHub hotlink, broken-image fallback on error)">
            <div className="w-full max-w-sm">
              <ProjectCard
                project={{ ...tinysynth, repoFullName: 'vercel/next.js' }}
                author={authors[tinysynth.author]}
                staggerIndex={4}
              />
            </div>
          </Demo>
          <Demo label="compact — no media, no tags">
            <div className="w-full max-w-xs">
              <ProjectCard
                project={gitgoblin}
                author={authors[gitgoblin.author]}
                variant="compact"
                staggerIndex={2}
              />
            </div>
          </Demo>
          <Demo label="featured — label bar + many tags (overflow stress test)">
            <div className="w-full max-w-sm">
              <ProjectCard
                project={plantdad}
                author={authors[plantdad.author]}
                variant="featured"
                labelText="pick of the week"
                staggerIndex={3}
              />
            </div>
          </Demo>
        </Group>

        <Group title="skeleton-card">
          <Demo label="with media / without">
            <div className="w-full max-w-[180px]">
              <SkeletonCard />
            </div>
            <div className="w-full max-w-[180px]">
              <SkeletonCard showMedia={false} />
            </div>
          </Demo>
        </Group>

        <Group title="empty-state">
          <Demo label="default message">
            <div className="w-full">
              <EmptyState />
            </div>
          </Demo>
          <Demo label="custom children — invitation + a way out">
            <div className="w-full">
              <EmptyState>
                <p>{copy.emptyFeed}</p>
                <Button asChild size="sm" className="mt-3">
                  <a href="/browse">{copy.browseCta}</a>
                </Button>
              </EmptyState>
            </div>
          </Demo>
        </Group>
      </section>

      {/* ---------------------------------------------------------------- shell */}
      <section className="flex flex-col gap-6">
        <SectionHeader kicker="04 · shell" title="Shell" />

        <Group title="site-header">
          <Demo>
            <div className="w-full">
              <SiteHeader />
            </div>
          </Demo>
        </Group>

        <Group title="site-footer">
          <Demo>
            <div className="w-full">
              <SiteFooter />
            </div>
          </Demo>
        </Group>

        <Group title="page-shell">
          <Demo label="mx-auto, max-w-[1120px], px-6 — this page is built on it">
            <PageShell className="rounded-md border border-dashed bg-surface-2 py-6 text-center font-mono text-xs text-muted-foreground">
              &lt;PageShell&gt;
            </PageShell>
          </Demo>
        </Group>

        <Group title="section-header">
          <Demo>
            <div className="w-full">
              <SectionHeader
                kicker="00 · example"
                title="A section header"
                note="With an optional note."
              />
            </div>
          </Demo>
        </Group>

        <Group title="callout">
          <Demo label="default / positive / destructive">
            <div className="flex w-full flex-col gap-3">
              <Callout>{copy.heroSub}</Callout>
              <Callout tone="positive">{copy.forkNudge}</Callout>
              <Callout tone="destructive">{copy.error}</Callout>
            </div>
          </Demo>
        </Group>
      </section>

      {/* -------------------------------------------------------------- project */}
      <section className="flex flex-col gap-6">
        <SectionHeader kicker="05 · project" title="Project" />

        <Group title="markdown-prose">
          <Demo label="bare">
            <div className="w-full">
              <MarkdownProse html={sampleReadmeHtml} />
            </div>
          </Demo>
          <Demo label="README card chrome + fork nudge">
            <div className="w-full">
              <MarkdownProse html={sampleReadmeHtml} forkHref="#" />
            </div>
          </Demo>
        </Group>

        <Group title="screenshot-gallery">
          <Demo>
            <div className="w-full">
              <ScreenshotGallery
                shots={[
                  { id: `${tinysynth.slug}-0`, label: tinysynth.name },
                  { id: `${tinysynth.slug}-1`, label: tinysynth.tags[0] },
                  { id: `${tinysynth.slug}-2`, label: tinysynth.tags[1] },
                ]}
              />
            </div>
          </Demo>
        </Group>

        <Group title="update-post">
          <Demo>
            <div className="w-full">
              <UpdatePost {...sampleUpdate} />
            </div>
          </Demo>
        </Group>

        <Group title="profile-header">
          <Demo>
            <div className="w-full">
              <ProfileHeader
                author={authors[plantdad.author]}
                links={[
                  { label: 'site', href: '#site' },
                  { label: 'github', href: '#github' },
                ]}
                followButton={<FollowButtonDemo />}
              />
            </div>
          </Demo>
        </Group>

        <Group title="feed-filters">
          <Demo>
            <FeedFilters
              sort={[...sortOptions]}
              tags={filterTags}
              activeSort={sortOptions[0]}
              activeTag={filterTags[0]}
              hrefFor={(kind, value) => `#${kind}-${value}`}
            />
          </Demo>
        </Group>
      </section>

      {/* ------------------------------------------------------------ primitives */}
      <section className="flex flex-col gap-6">
        <SectionHeader
          kicker="06 · primitives"
          title="shadcn primitives"
          note="src/components/ui/* — restyled via className, never edited directly."
        />

        <Group title="button">
          <Demo label="variants">
            <Button>default</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="outline">outline</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="link">link</Button>
            <Button variant="destructive">destructive</Button>
          </Demo>
          <Demo label="sizes">
            <Button size="sm">sm</Button>
            <Button size="default">default</Button>
            <Button size="lg">lg</Button>
          </Demo>
        </Group>

        <Group title="badge">
          <Demo>
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="destructive">destructive</Badge>
          </Demo>
        </Group>

        <Group title="input · textarea · label">
          <Demo>
            <div className="flex w-full max-w-xs flex-col gap-1.5">
              <Label htmlFor="demo-input">project name</Label>
              <Input id="demo-input" placeholder={tinysynth.name} />
            </div>
            <div className="flex w-full max-w-xs flex-col gap-1.5">
              <Label htmlFor="demo-textarea">tagline</Label>
              <Textarea id="demo-textarea" placeholder={tinysynth.tagline} />
            </div>
          </Demo>
        </Group>

        <Group title="select">
          <Demo>
            <Select defaultValue={languages[0]}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Demo>
        </Group>

        <Group title="switch">
          <Demo>
            <div className="flex items-center gap-2">
              <Switch id="demo-switch" defaultChecked />
              <Label htmlFor="demo-switch">email updates</Label>
            </div>
          </Demo>
        </Group>

        <Group title="tabs">
          <Demo>
            <Tabs defaultValue={sortOptions[0]} className="w-full max-w-sm">
              <TabsList>
                {sortOptions.map((s) => (
                  <TabsTrigger key={s} value={s}>
                    {s}
                  </TabsTrigger>
                ))}
              </TabsList>
              {sortOptions.map((s) => (
                <TabsContent key={s} value={s} className="text-sm text-muted-foreground">
                  sorted by {s}
                </TabsContent>
              ))}
            </Tabs>
          </Demo>
        </Group>

        <Group title="toggle · toggle-group">
          <Demo>
            <Toggle aria-label="toggle like">{copy.like}</Toggle>
            <ToggleGroup type="single" variant="outline" defaultValue={languages[0]}>
              {languages.map((l) => (
                <ToggleGroupItem key={l} value={l}>
                  {l}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Demo>
        </Group>

        <Group title="avatar (raw primitive)">
          <Demo label="sizes / fallback initials / group + overflow count">
            <Avatar size="sm">
              <AvatarFallback>{authors[tinysynth.author].initial}</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>{authors[gitgoblin.author].initial}</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>{authors[plantdad.author].initial}</AvatarFallback>
            </Avatar>
            <AvatarGroup>
              {Object.values(authors)
                .slice(0, 3)
                .map((a) => (
                  <Avatar key={a.username}>
                    <AvatarFallback>{a.initial}</AvatarFallback>
                  </Avatar>
                ))}
              <AvatarGroupCount>+{Object.values(authors).length - 3}</AvatarGroupCount>
            </AvatarGroup>
          </Demo>
        </Group>

        <Group title="separator">
          <Demo>
            <div className="flex w-full flex-col gap-3">
              <span className="text-xs text-muted-foreground">above</span>
              <Separator />
              <span className="text-xs text-muted-foreground">below</span>
            </div>
            <div className="flex h-8 items-center gap-3">
              <span className="text-xs text-muted-foreground">left</span>
              <Separator orientation="vertical" />
              <span className="text-xs text-muted-foreground">right</span>
            </div>
          </Demo>
        </Group>

        <Group title="tooltip">
          <Demo>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    hover me
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copy.forkNudge}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Demo>
        </Group>

        <Group title="dialog">
          <Demo>
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
          </Demo>
        </Group>

        <Group title="sheet">
          <Demo>
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
          </Demo>
        </Group>

        <Group title="dropdown-menu">
          <Demo>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  sort: {sortOptions[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>sort</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortOptions.map((s) => (
                  <DropdownMenuItem key={s}>{s}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Demo>
        </Group>

        <Group title="collapsible">
          <Demo>
            <Collapsible className="w-full max-w-sm">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {plantdad.tags.length} tags
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 flex flex-wrap gap-1.5">
                {plantdad.tags.map((t) => (
                  <TagChip key={t} tag={t} hashPrefix />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </Demo>
        </Group>

        <Group title="command">
          <Demo>
            <MountWhenVisible>
              <Command className="w-full max-w-xs rounded-lg border">
                <CommandInput placeholder={copy.searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>{copy.emptyFeed}</CommandEmpty>
                  <CommandGroup heading="projects">
                    {projects.map((p) => (
                      <CommandItem key={p.slug}>{p.name}</CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </MountWhenVisible>
          </Demo>
        </Group>

        <Group title="carousel">
          <Demo>
            <Carousel className="w-full max-w-xs">
              <CarouselContent>
                {projects.map((p) => (
                  <CarouselItem key={p.slug}>
                    <ProjectCard project={p} author={authors[p.author]} variant="compact" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </Demo>
        </Group>

        <Group title="sonner (toast)">
          <Demo>
            <ToastDemo />
          </Demo>
        </Group>
      </section>
    </div>
  );
}
