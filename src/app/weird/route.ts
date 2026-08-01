import { NextResponse } from 'next/server';

// U2 R2.5: the serendipity route renamed to /random (board: conceptually
// clearer nav name). This alias keeps every shipped /weird link working.
export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return NextResponse.redirect(new URL('/random', request.url), 308);
}
