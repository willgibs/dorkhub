import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copy } from '@/lib/copy';
import { formatUpdatedAgo } from '@/lib/projects/map';
import { supabaseService } from '@/lib/supabase/clients';
import type { Json } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import {
  addManualCandidate,
  deleteAndBlockProject,
  runAwesomeList,
  runTopicCrawl,
} from './actions';

export const metadata: Metadata = { title: copy.adminSourcesTitle };

// ---------------------------------------------------------------------------
// Shared local pieces — single-use page shell, not design-system components
// (mirrors src/app/(app)/admin/page.tsx's AdminSection/StatRow precedent).
// ---------------------------------------------------------------------------

function SourceSection({
  kicker,
  description,
  children,
}: {
  kicker: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="edge-highlight flex flex-col gap-4 rounded-lg border bg-card px-[22px] py-[20px]">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[11.5px] tracking-widest text-muted-foreground uppercase">
          <span aria-hidden="true">{'// '}</span>
          {kicker}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

const selectClassName = cn(
  'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none',
  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  'dark:bg-input/30',
);

// ---------------------------------------------------------------------------
// Result banner — reads the redirect-with-summary searchParams contract
// shared by every action in ./actions.ts.
// ---------------------------------------------------------------------------

type SourcesSearchParams = {
  action?: string;
  created?: string;
  touched?: string;
  blocked?: string;
  error?: string;
};

const ACTION_LABEL: Record<string, string> = {
  topic_crawl: 'topic crawl',
  awesome_list: 'awesome-list crawl',
  manual: 'manual add',
  block: 'remove + block',
};

function ResultBanner({ params }: { params: SourcesSearchParams }) {
  if (!params.action) return null;

  const label = ACTION_LABEL[params.action] ?? params.action;
  const tallyBits = [
    params.created !== undefined ? `${params.created} created` : null,
    params.touched !== undefined ? `${params.touched} touched` : null,
    params.blocked !== undefined ? `${params.blocked} blocked` : null,
  ].filter((bit): bit is string => bit !== null);

  // A hard failure has no tallies at all — a crawl that finished with a note
  // (rate-limited mid-run, truncated refs) still carries tallies alongside
  // `error`, so it reads as a completed run with a caveat, not a failure.
  const isHardError = Boolean(params.error) && tallyBits.length === 0;

  return (
    <p
      className={cn(
        'rounded-lg border px-4 py-3 font-mono text-[12.5px]',
        isHardError
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-primary/40 bg-primary-soft text-primary',
      )}
    >
      {label}
      {tallyBits.length > 0 ? ` — ${tallyBits.join(', ')}` : null}
      {params.error ? ` — ${params.error}` : null}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Crawl-runs audit list
// ---------------------------------------------------------------------------

function formatParams(params: Json): string {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return '';
  return Object.entries(params as Record<string, Json>)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(' · ');
}

type CrawlRun = {
  id: string;
  source: string;
  params: Json;
  status: string;
  candidates_created: number;
  candidates_touched: number;
  started_at: string;
  finished_at: string | null;
  error_detail: string | null;
};

function CrawlRunRow({ run, now }: { run: CrawlRun; now: Date }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-2.5 font-mono text-[12.5px] last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-foreground">{run.source}</span>
        <Badge
          variant="outline"
          className="font-mono text-[11px] font-normal tracking-wide text-muted-foreground"
        >
          {run.status}
        </Badge>
        <span className="tabular-nums text-muted-foreground">{run.candidates_created} created</span>
        <span className="tabular-nums text-muted-foreground">{run.candidates_touched} touched</span>
        <a
          href={`/admin/queue?source=${run.source}`}
          className="rounded-sm text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          review in queue
        </a>
        <span className="text-muted-foreground">
          started {formatUpdatedAgo(run.started_at, now)}
          {run.finished_at
            ? ` · finished ${formatUpdatedAgo(run.finished_at, now)}`
            : ' · running…'}
        </span>
      </div>
      {formatParams(run.params) ? (
        <p className="text-muted-foreground">{formatParams(run.params)}</p>
      ) : null}
      {run.error_detail ? <p className="text-destructive">{run.error_detail}</p> : null}
    </div>
  );
}

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<SourcesSearchParams>;
}) {
  const params = await searchParams;
  const service = supabaseService();

  const { data: crawlRunsData } = await service
    .from('ingest_crawl_runs')
    .select(
      'id, source, params, status, candidates_created, candidates_touched, started_at, finished_at, error_detail',
    )
    .order('started_at', { ascending: false })
    .limit(10);
  const crawlRuns = crawlRunsData ?? [];
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-extrabold">{copy.adminSourcesTitle}</h1>
        <p className="text-sm text-muted-foreground">
          admin-triggered ingestion — crawls queue candidates for the review queue, they never
          publish directly.
        </p>
      </div>

      <ResultBanner params={params} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SourceSection
          kicker="topic crawl"
          description="GitHub search, sorted by stars — sequential, ~2.5s between pages (separate rate bucket)."
        >
          <form action={runTopicCrawl} className="grid gap-4 sm:grid-cols-2">
            <FormField label="topic" htmlFor="topic-crawl-topic">
              <Input
                id="topic-crawl-topic"
                name="topic"
                placeholder="cli"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
              />
            </FormField>
            <FormField label="min stars" htmlFor="topic-crawl-min-stars">
              <Input
                id="topic-crawl-min-stars"
                name="min_stars"
                type="number"
                min={0}
                defaultValue={50}
              />
            </FormField>
            <FormField label="language (optional)" htmlFor="topic-crawl-language">
              <Input id="topic-crawl-language" name="language" placeholder="TypeScript" />
            </FormField>
            <FormField label="max results" htmlFor="topic-crawl-max-results">
              <Input
                id="topic-crawl-max-results"
                name="max_results"
                type="number"
                min={1}
                max={100}
                defaultValue={60}
              />
            </FormField>
            <Button type="submit" size="sm" className="sm:col-span-2 sm:w-fit">
              run topic crawl
            </Button>
          </form>
        </SourceSection>

        <SourceSection
          kicker="awesome-list crawl"
          description="reads one README, extracts github.com links, resolves the first 100."
        >
          <form action={runAwesomeList} className="grid gap-4 sm:grid-cols-2">
            <FormField label="owner" htmlFor="awesome-owner">
              <Input id="awesome-owner" name="owner" placeholder="sindresorhus" required />
            </FormField>
            <FormField label="repo" htmlFor="awesome-repo">
              <Input id="awesome-repo" name="repo" placeholder="awesome" required />
            </FormField>
            <Button type="submit" size="sm" className="sm:col-span-2 sm:w-fit">
              crawl readme
            </Button>
          </form>
        </SourceSection>

        <SourceSection
          kicker="manual add"
          description="one owner/repo, straight into the queue — not a crawl run."
        >
          <form action={addManualCandidate} className="grid gap-4 sm:grid-cols-2">
            <FormField label="owner" htmlFor="manual-owner">
              <Input id="manual-owner" name="owner" placeholder="octocat" required />
            </FormField>
            <FormField label="repo" htmlFor="manual-repo">
              <Input id="manual-repo" name="repo" placeholder="hello-world" required />
            </FormField>
            <Button type="submit" size="sm" className="sm:col-span-2 sm:w-fit">
              add candidate
            </Button>
          </form>
        </SourceSection>

        <SourceSection
          kicker="remove + block"
          description="deletes the project and blocks the repo (or its owner) from ever being re-ingested."
        >
          <form action={deleteAndBlockProject} className="grid gap-4 sm:grid-cols-2">
            <FormField label="project id" htmlFor="block-project-id">
              <Input
                id="block-project-id"
                name="project_id"
                placeholder="uuid"
                required
                className="font-mono text-[12.5px]"
              />
            </FormField>
            <FormField label="scope" htmlFor="block-scope">
              <select id="block-scope" name="scope" defaultValue="repo" className={selectClassName}>
                <option value="repo">this repo only</option>
                <option value="owner">entire owner</option>
              </select>
            </FormField>
            <FormField label="reason (optional)" htmlFor="block-reason">
              <Input id="block-reason" name="reason" placeholder="owner asked to be removed" />
            </FormField>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="sm:col-span-2 sm:w-fit"
            >
              remove + block
            </Button>
          </form>
        </SourceSection>
      </div>

      <SourceSection kicker="latest crawls" description="most recent 10 admin-triggered runs.">
        {crawlRuns.length === 0 ? (
          <p className="font-mono text-[13px] text-muted-foreground">no crawls run yet</p>
        ) : (
          <div className="flex flex-col">
            {crawlRuns.map((run) => (
              <CrawlRunRow key={run.id} run={run} now={now} />
            ))}
          </div>
        )}
      </SourceSection>
    </div>
  );
}
