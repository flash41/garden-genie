import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALERT_RECIPIENT = 'steen.gordon@gmail.com';

async function sendWaitlistNotification(email: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[waitlist] RESEND_API_KEY missing — cannot send signup notification');
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'Dedrab Waitlist <noreply@dedrab.com>',
      to: [ALERT_RECIPIENT],
      subject: '[Dedrab] New waitlist signup',
      html: `<p>New waitlist signup: <strong>${email}</strong></p><p>${new Date().toISOString()}</p>`,
    });
    if (error) {
      console.error('[waitlist] Resend error:', error.message);
    }
  } catch (err: any) {
    console.error('[waitlist] notification send threw:', err?.message);
  }
}

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

  const { data, error } = await supabaseAdmin
    .from('waitlist_signups')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
    .select('id');

  if (error) {
    console.error('[waitlist] upsert error:', error);
    return NextResponse.json({ error: 'Could not save your email. Please try again.' }, { status: 500 });
  }

  // ignoreDuplicates means an existing email returns no row here — only genuinely
  // new signups come back with a row, so we only notify on those, not on repeat submits.
  const isNewSignup = (data?.length ?? 0) > 0;
  if (isNewSignup) {
    // Fire-and-forget: a notification failure shouldn't fail the user's signup.
    void sendWaitlistNotification(email);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
