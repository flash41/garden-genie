import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALERT_RECIPIENT = 'steen.gordon@gmail.com';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendWaitlistNotification(email: string, feedback: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[waitlist] RESEND_API_KEY missing — cannot send signup notification');
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const feedbackHtml = feedback
      ? `<p><strong>Feedback:</strong><br/>${escapeHtml(feedback).replace(/\n/g, '<br/>')}</p>`
      : '';
    const { error } = await resend.emails.send({
      from: 'Dedrab Waitlist <noreply@dedrab.com>',
      to: [ALERT_RECIPIENT],
      subject: '[Dedrab] New waitlist signup',
      html: `<p>New waitlist signup: <strong>${email}</strong></p>${feedbackHtml}<p>${new Date().toISOString()}</p>`,
    });
    if (error) {
      console.error('[waitlist] Resend error:', error.message);
    }
  } catch (err: any) {
    console.error('[waitlist] notification send threw:', err?.message);
  }
}

const MAX_FEEDBACK_LENGTH = 2000;

export async function POST(req: NextRequest) {
  let body: { email?: unknown; feedback?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
  }

  const feedback =
    typeof body.feedback === 'string' ? body.feedback.trim().slice(0, MAX_FEEDBACK_LENGTH) : '';

  // Upsert without ignoreDuplicates so a returning visitor's feedback still gets saved
  // against their existing row, and we can always tell whether the row was new.
  const { data: existing } = await supabaseAdmin
    .from('waitlist_signups')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('waitlist_signups')
    .upsert({ email, ...(feedback ? { feedback } : {}) }, { onConflict: 'email' });

  if (error) {
    console.error('[waitlist] upsert error:', error);
    return NextResponse.json({ error: 'Could not save your email. Please try again.' }, { status: 500 });
  }

  const isNewSignup = !existing;
  if (isNewSignup || feedback) {
    // Fire-and-forget: a notification failure shouldn't fail the user's signup.
    void sendWaitlistNotification(email, feedback);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
