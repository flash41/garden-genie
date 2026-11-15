import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-server';
import { UUID_RE, isValidEmail, limitOr429, requireInvite } from '@/lib/route-guards';

export const dynamic = 'force-dynamic';

function generateReference(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return 'DED-' + year + month + '-' + random;
}

// SECURITY (Nov 2026): now requires a real invite cookie, a rate limit, a
// valid email and a size cap. Only called from /design.
export async function POST(req: NextRequest) {
  const limited = await limitOr429(req, 'save-design', 20, 60 * 60 * 1000);
  if (limited) return limited;
  const invite = await requireInvite(req);
  if (invite instanceof NextResponse) return invite;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { sessionId, email, designStyle, hardinessZone, plantList, fullReport } = body as {
    sessionId?: string;
    email?: string;
    designStyle?: string;
    hardinessZone?: string;
    plantList?: unknown;
    fullReport?: unknown;
  };

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }
  if (sessionId !== undefined && sessionId !== null && sessionId !== '' && (typeof sessionId !== 'string' || !UUID_RE.test(sessionId))) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }
  if (JSON.stringify({ plantList, fullReport }).length > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Plan data too large' }, { status: 413 });
  }

  const referenceNumber = generateReference();

  const { data, error } = await supabase
    .from('design_records')
    .insert({
      session_id: sessionId || crypto.randomUUID(),
      email,
      design_style: typeof designStyle === 'string' ? designStyle.slice(0, 120) : null,
      hardiness_zone: typeof hardinessZone === 'string' ? hardinessZone.slice(0, 120) : null,
      plant_list: plantList || null,
      full_report: fullReport || null,
      reference_number: referenceNumber,
    })
    .select('id, session_id, reference_number')
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ error: 'Could not save design' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, session_id: data.session_id, reference_number: data.reference_number });
}
