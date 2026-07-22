import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Browser client — client components only. Lives in its own module because
 * clients.ts is server-only (it imports next/headers); importing that from a
 * 'use client' file breaks the build by design.
 */
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  );
}
