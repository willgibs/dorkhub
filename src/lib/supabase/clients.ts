import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Browser client — client components only. Cookie-based session via @supabase/ssr.
 */
export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, PUBLISHABLE_KEY);
}

/**
 * Cookie-bound server client — server components, route handlers, server actions.
 * Reads the caller's session; RLS applies as that user.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, PUBLISHABLE_KEY, {
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
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Service-role client — server only, bypasses RLS. Import ONLY from server code paths
 * guarded by admin/cron/system checks (seeding, sync, claim flow, counters).
 */
export function supabaseService() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('SUPABASE_SECRET_KEY is not set');
  return createClient(SUPABASE_URL, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
