import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  checkAdminPassword,
  createAdminSession,
  purgeExpiredAdminSessions,
} from '@/lib/admin-session';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const LOCKOUT_WINDOW_MINUTES = 15;
const MAX_FAILURES = 10;

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

async function countRecentFailures(ip: string): Promise<number> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from('admin_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('attempted_at', since);
  return count ?? 0;
}

async function recordFailure(ip: string): Promise<void> {
  await supabaseAdmin
    .from('admin_login_attempts')
    .insert({ ip });
}

async function clearFailures(ip: string): Promise<void> {
  await supabaseAdmin
    .from('admin_login_attempts')
    .delete()
    .eq('ip', ip);
}

async function purgeOldAttempts(): Promise<void> {
  await supabaseAdmin.rpc('purge_old_admin_login_attempts');
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  // M2 — lockout check before touching the password
  const failures = await countRecentFailures(ip);
  if (failures >= MAX_FAILURES) {
    return NextResponse.json(
      { ok: false, error: 'Too many failed attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { password } = body as { password?: string };

  if (!password || typeof password !== 'string' || !checkAdminPassword(password)) {
    await new Promise(r => setTimeout(r, 250));
    // Record the failure and best-effort purge stale attempts
    recordFailure(ip).catch(() => {});
    purgeOldAttempts().catch(() => {});
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Successful login — clear failure record and issue session
  clearFailures(ip).catch(() => {});
  purgeExpiredAdminSessions().catch(() => {});

  const userAgent = req.headers.get('user-agent');

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
