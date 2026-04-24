import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  checkAdminPassword,
  createAdminSession,
  purgeExpiredAdminSessions,
} from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { password } = body as { password?: string };

  if (!password || typeof password !== 'string' || !checkAdminPassword(password)) {
    // Small constant delay to dampen online-brute-force attempts. Full
    // lockout is a future hardening step (M2).
    await new Promise(r => setTimeout(r, 250));
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Best-effort housekeeping — don't fail login on this.
  purgeExpiredAdminSessions().catch(() => {});

  const userAgent = req.headers.get('user-agent');
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;

  let token: string;
  try {
    token = await createAdminSession({ userAgent, ip });
  } catch {
    return NextResponse.json({ ok: false, error: 'Session create failed' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, ADMIN_COOKIE_OPTIONS);
  return response;
}
