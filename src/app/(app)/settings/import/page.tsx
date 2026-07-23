import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { safeNextPath } from '@/lib/auth/redirects';
import { copy } from '@/lib/copy';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';
import { ImportRunner } from './import-runner';

export const metadata: Metadata = { title: copy.importTitle };

export default async function SettingsImportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; next?: string }>;
}) {
  const params = await searchParams;
  // Query string is attacker-reachable — never trust `next` raw.
  const fromOnboarding = params.from === 'onboarding';
  const skipHref = safeNextPath(params.next);

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Defense-in-depth — src/proxy.ts already gates /settings/import behind a session.
  if (!user) redirect('/auth/signin?next=%2Fsettings%2Fimport');

  const service = supabaseService();
  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/onboarding');

  // Cookie-bound client under RLS (`star_imports_select_own` scopes this to
  // the caller with no explicit profile_id filter needed) — a head-only count,
  // no rows fetched.
  const { count } = await supabase.from('star_imports').select('*', { count: 'exact', head: true });
  const priorImportCount = count ?? 0;

  return (
    <PageShell className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          <span aria-hidden="true">{'// '}</span>import
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">{copy.importTitle}</h1>
        <p className="mt-2 text-muted-foreground">{copy.importSubtitle}</p>
        {priorImportCount > 0 ? (
          <p className="mt-1 font-mono text-[12.5px] text-muted-foreground">
            last imported <span className="tabular-nums">{priorImportCount}</span> star
            {priorImportCount === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>

      <ImportRunner />

      {fromOnboarding ? (
        <Link
          href={skipHref}
          className="w-fit rounded-sm font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {copy.importSkip}
        </Link>
      ) : null}
    </PageShell>
  );
}
