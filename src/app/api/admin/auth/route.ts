import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { password } = body as { password?: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_auth', password, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
  });
  return response;
}
