import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

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

  const { data, error } = await supabaseAdmin
    .from('invite_codes')
    .select('id, code, label, email, renders_used, max_renders')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('[validate-invite] Supabase error:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }

  // Unified failure response — do not distinguish "not found" vs "exhausted"
  // to avoid code enumeration via response differentiation (audit M5).
  if (!data || data.renders_used >= data.max_renders) {
    return NextResponse.json({ success: false, error: 'invalid' }, { status: 200 });
  }

  return NextResponse.json({
    success: true,
    code: data.code,
    label: data.label,
    email: data.email,
    renders_used: data.renders_used,
    max_renders: data.max_renders,
  });
}
