import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Returns the current invite state for the holder of the dedrab_invite cookie.
// Quota numbers are only returned for CURRENTLY-VALID codes — exhausted or
// missing codes get a generic failure response so an attacker with a
// stolen/expired cookie cannot probe quota history. (Audit H5)
export async function GET(req: NextRequest) {
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

  if (remaining <= 0) {
    // Code exists but is exhausted. Do NOT return renders_used/max_renders —
    // the UI already knows "you're out" is the full story.
    return NextResponse.json({ valid: false, reason: 'expired' });
  }

  return NextResponse.json({
    valid: true,
    renders_used: data.renders_used,
    max_renders: data.max_renders,
    remaining,
  });
}
