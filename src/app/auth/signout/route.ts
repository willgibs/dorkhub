import { NextResponse } from 'next/server';
import { requestOrigin } from '@/lib/auth/redirects';
import { supabaseServer } from '@/lib/supabase/clients';

/** POST-only: sign-out mutates state; links must never trigger it. */
export async function POST(request: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${requestOrigin(request)}/`, { status: 303 });
}
