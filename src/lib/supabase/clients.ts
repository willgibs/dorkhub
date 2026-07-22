import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;

// The browser client lives in ./browser.ts — this module is server-only.

/**
 * Cookie-bound server client — server components, route handlers, server actions.
 * Reads the caller's session; RLS applies as that user.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies; the proxy refreshes sessions instead.
        }
      },
    },
  });
}

/**
 * Cookie-LESS anonymous client — public reads only (feed, project pages, profiles).
 * Never touches cookies, so RSCs using it stay static/cacheable. RLS applies as anon.
 */
export function supabaseAnon() {
  return createClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Service-role client — server only, bypasses RLS. Import ONLY from server code paths
 * guarded by admin/cron/system checks (seeding, sync, claim flow, counters).
 */
export function supabaseService() {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secret) throw new Error('SUPABASE_SECRET_KEY is not set');
  // A pasted-in publishable/anon key here would silently demote every "service"
  // write to anon privileges and RLS would reject them with confusing errors —
  // fail loudly and descriptively instead.
  if (!secret.startsWith('sb_secret_') && !secret.startsWith('eyJ')) {
    throw new Error(
      'SUPABASE_SECRET_KEY does not look like a secret key (expected sb_secret_… or a legacy service_role JWT)',
    );
  }
  if (secret.startsWith('sb_publishable_')) {
    throw new Error('SUPABASE_SECRET_KEY is set to a PUBLISHABLE key — use the secret key');
  }
  return createClient<Database>(SUPABASE_URL, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
