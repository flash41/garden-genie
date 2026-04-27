import { NextRequest, NextResponse } from 'next/server';

/**
 * Design gate — server-side cookie presence check.
 *
 * Protects /design from being accessed without a dedrab_invite cookie.
 * Runs in the Next.js edge runtime before the page renders, so the
 * client-side JS never loads at all for unauthenticated visitors.
 *
 * Also gates /api/redesign and /api/analyse — returns 401 so the
 * client can handle the error gracefully without a page redirect.
 *
 * Note: full DB re-validation (renders_used < max_renders) is enforced
 * server-side inside /api/invite-status and /api/redesign — middleware
 * only checks presence because the edge runtime cannot call Supabase directly.
 */
export function middleware(req: NextRequest) {
  const invite = req.cookies.get('dedrab_invite')?.value?.trim();
  const { pathname } = req.nextUrl;

  if (invite) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'invite_required' }, { status: 401 });
  }

  const destination = new URL('/next', req.url);
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: [
    '/design',
    '/api/redesign',
    '/api/redesign/:path*',
    '/api/analyse',
    '/api/analyse/:path*',
  ],
};
