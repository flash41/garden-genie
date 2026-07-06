import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
  }

  const { error } = await supabaseAdmin
    .from('waitlist_signups')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    console.error('[waitlist] upsert error:', error);
    return NextResponse.json({ error: 'Could not save your email. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
