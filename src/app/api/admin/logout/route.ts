import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, destroyAdminSession } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  await destroyAdminSession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
