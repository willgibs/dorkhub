import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { githubIdentity } from '@/lib/auth/identity';
import { supabaseServer, supabaseService } from '@/lib/supabase/clients';
import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = { title: 'almost in' };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; claim?: string }>;
}) {
  const params = await searchParams;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?next=%2Fonboarding');

  // Already onboarded → nothing to do here.
  const service = supabaseService();
  const { data: mine } = await service
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle();
  if (mine) redirect(`/u/${mine.username}`);

  const gh = githubIdentity(user);
  const login = gh?.login ?? '';
  const suggestedDisplayName = (user.user_metadata?.full_name as string | undefined) ?? login;

  return (
    <PageShell className="flex flex-col items-center py-24">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          <span aria-hidden="true">{'// '}</span>almost in
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold">this is you</h1>
        <p className="mt-3 text-muted-foreground">
          your dorkhub name is your github name — no squatting, no impersonation. the rest is
          optional and editable later.
        </p>
        {params.claim === 'pending' ? (
          <p className="mt-4 rounded-lg border border-primary/40 bg-primary-soft px-4 py-3 text-sm text-primary">
            a curated profile is waiting for this GitHub account — claiming it ships soon.
          </p>
        ) : null}
        <OnboardingForm
          login={login}
          suggestedDisplayName={suggestedDisplayName}
          next={params.next ?? '/'}
        />
      </div>
    </PageShell>
  );
}
