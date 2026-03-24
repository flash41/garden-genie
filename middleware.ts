import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PAGES = ['/design'];
const PROTECTED_API = ['/api/redesign', '/api/analyse'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsInvite =
    PROTECTED_PAGES.some(p => pathname === p || pathname.startsWith(p + '/')) ||
    PROTECTED_API.some(p => pathname.startsWith(p));

  if (!needsInvite) return NextResponse.next();

  const inviteCookie = request.cookies.get('dedrab_invite');
  if (inviteCookie && inviteCookie.value) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'invite_required' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/invite';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/design',
    '/design/:path*',
    '/api/redesign',
    '/api/redesign/:path*',
    '/api/analyse',
    '/api/analyse/:path*',
  ],
};
