import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_request' }, { status: 400 });
  }

  const rawCode = (body.code as string | undefined) || '';
  const code = rawCode.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('invite_codes')
    .select('id, code, label, email, renders_used, max_renders')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('[validate-invite] Supabase error:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 200 });
  }

  if (data.renders_used >= data.max_renders) {
    return NextResponse.json({
      success: false,
      error: 'exhausted',
      message: 'This code has reached its render limit.',
    }, { status: 200 });
  }

  const response = NextResponse.json({
    success: true,
    code: data.code,
    label: data.label,
    email: data.email,
    renders_used: data.renders_used,
    max_renders: data.max_renders,
  });

  response.cookies.set('dedrab_invite', data.code, {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });

  return response;
}
