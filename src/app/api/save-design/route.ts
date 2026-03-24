import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function generateReference(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return 'DED-' + year + month + '-' + random;
}

export async function POST(req: NextRequest) {
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

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const referenceNumber = generateReference();

  const { data, error } = await supabase
    .from('design_records')
    .insert({
      session_id: sessionId || crypto.randomUUID(),
      email,
      design_style: designStyle || null,
      hardiness_zone: hardinessZone || null,
      plant_list: plantList || null,
      full_report: fullReport || null,
      reference_number: referenceNumber,
    })
    .select('id, session_id, reference_number')
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, session_id: data.session_id, reference_number: data.reference_number });
}
