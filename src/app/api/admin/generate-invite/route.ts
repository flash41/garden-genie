import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function checkAdminAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_auth');
  return !!(cookie && cookie.value && cookie.value === process.env.ADMIN_PASSWORD);
}

function generateInviteCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const l = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const d = Array.from({ length: 3 }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
  return l + d;
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('invite_codes')
    .select('id, code, label, email, renders_used, max_renders, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codes: data || [] });
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const label = (body.label as string | undefined)?.trim() || null;
  const email = (body.email as string | undefined)?.trim() || null;
  const maxRenders = typeof body.maxRenders === 'number' ? body.maxRenders : 5;

  // Generate unique code with collision retry
  let code = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateInviteCode();
    const { data: existing } = await supabaseAdmin
      .from('invite_codes')
      .select('id')
      .eq('code', candidate)
      .maybeSingle();
    if (!existing) { code = candidate; break; }
  }

  if (!code) {
    return NextResponse.json({ error: 'Could not generate unique code' }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('invite_codes')
    .insert({ code, label, email, renders_used: 0, max_renders: maxRenders })
    .select('id, code, label, email, renders_used, max_renders, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, invite: data });
}
