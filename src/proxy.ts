import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Next 16 proxy (né middleware): refreshes the Supabase session cookie on every
 * matched request and gates authed-only routes on session PRESENCE only.
 * Architecture rule (docs/architecture.md): NO database calls here — profile
 * completeness and admin checks live in layouts.
 */

const AUTHED_PREFIXES = [
  '/new',
  '/settings',
  '/saved',
  '/following',
  '/admin',
  '/onboarding',
  '/claim',
];

/**
 * True when the request carries a Supabase auth cookie. Supabase names them
 * `sb-<project-ref>-auth-token` (chunked as `.0`, `.1`, … on large sessions),
 * so the prefix is the stable part.
 */
function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'));
}

export async function proxy(request: NextRequest) {
  const { pathname: earlyPathname } = request.nextUrl;

  /*
   * Cost guard (2026-08-03). A request with NO Supabase cookie cannot be
   * authenticated, so building a server client and calling `getClaims()` for
   * it is pure waste — and roughly 90% of traffic is exactly that: crawlers
   * walking the sitemap. This ran on every one of ~8,000 requests/day.
   *
   * The three things below this line all depend on `isAuthed`, and for a
   * cookieless request every one of them takes the anonymous branch anyway:
   * the gated-prefix redirect fires (still handled here), `/` renders the
   * signed-out tree, and `/home` redirects to `/`. So the early return has to
   * reproduce exactly those, and nothing else.
   */
  if (!hasAuthCookie(request)) {
    if (AUTHED_PREFIXES.some((p) => earlyPathname === p || earlyPathname.startsWith(`${p}/`))) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.search = `?next=${encodeURIComponent(earlyPathname)}`;
      return NextResponse.redirect(url);
    }
    if (earlyPathname === '/home') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getClaims validates the JWT locally and refreshes when expired — the
  // recommended check (never trust getSession() server-side).
  const { data } = await supabase.auth.getClaims();
  const isAuthed = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  if (!isAuthed && AUTHED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Signed-in home split (docs/plans/m5-discovery.md decision 2): same URL,
  // different tree. Reuses the claims check above — no second Supabase call.
  if (pathname === '/' && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    const rewritten = NextResponse.rewrite(url, { request });
    // Rewrite/redirect always build a NEW response object, so cookies set on
    // `response` above (via the setAll callback, e.g. a refreshed session)
    // would otherwise be silently dropped. The signin redirect above gets
    // away with skipping this because it only fires when `!isAuthed` — no
    // valid session ever means setAll had nothing to set. This branch is the
    // opposite: it only fires when `isAuthed`, exactly where a token refresh
    // is likely, so those cookies must be copied onto the new response.
    for (const cookie of response.cookies.getAll()) {
      rewritten.cookies.set(cookie);
    }
    return rewritten;
  }

  if (pathname === '/home' && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and metadata files.
    '/((?!_next/static|_next/image|favicon.ico|icon|opengraph-image|robots.txt|sitemap.xml|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2?)$).*)',
  ],
};
