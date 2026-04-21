import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Read invite code from cookie header (no ?code param needed)
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)dedrab_invite=([^;]+)/);
  const code = match ? decodeURIComponent(match[1]) : null;

  if (!code) {
    return NextResponse.json({ valid: false, reason: 'no_invite' });
  }

  const { data, error } = await supabaseAdmin
    .from('invite_codes')
    .select('renders_used, max_renders')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ valid: false, reason: 'no_invite' });
  }

  const remaining = Math.max(0, data.max_renders - data.renders_used);
  const valid = remaining > 0;

  return NextResponse.json({
    valid,
    reason: valid ? undefined : 'expired',
    renders_used: data.renders_used,
    max_renders: data.max_renders,
    remaining,
  });
}
