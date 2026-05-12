import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createInviteCode } from '@/lib/invite-codes';

export const dynamic = 'force-dynamic';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  });
}
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  // ── Signature verification ────────────────────────────────────────────────
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // We only subscribed to this event type — anything else is unexpected
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  const customerEmail = session.customer_details?.email ?? null;

  // Only proceed on confirmed payments (not free/trial sessions)
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true });
  }

  // ── Idempotency check ─────────────────────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from('stripe_payments')
    .select('id, share_processed_at')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (existing?.share_processed_at) {
    // Share code already sent — Stripe is retrying the webhook, nothing to do
    return NextResponse.json({ received: true });
  }

  // ── Generate 1-use shareable code ─────────────────────────────────────────
  let shareCode: string;
  try {
    shareCode = await createInviteCode(
      1,
      'stripe_payment_share',
      customerEmail ?? undefined,
    );
  } catch (err) {
    console.error('[webhook] Failed to create share invite code:', err);
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: 'Code generation failed' }, { status: 500 });
  }

  // ── Persist share code ────────────────────────────────────────────────────
  // Row may or may not exist depending on whether /complete has already fired.
  if (existing) {
    // Row exists (primary_code was already written by /complete) — UPDATE only share fields
    await supabaseAdmin
      .from('stripe_payments')
      .update({
        share_code: shareCode,
        share_processed_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);
  } else {
    // /complete hasn't fired yet — INSERT the row (primary_code will be filled later)
    await supabaseAdmin.from('stripe_payments').insert({
      session_id: sessionId,
      customer_email: customerEmail,
      share_code: shareCode,
      share_processed_at: new Date().toISOString(),
    });
  }

  // ── Email the share code ──────────────────────────────────────────────────
  if (customerEmail) {
    try {
      await sendShareCodeEmail(customerEmail, shareCode);
    } catch (err) {
      // Log but don't fail the webhook — the code is already in the DB
      console.error('[webhook] Failed to send share code email:', err);
    }
  }

  return NextResponse.json({ received: true });
}

async function sendShareCodeEmail(to: string, code: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A gift for someone you know</title>
</head>
<body style="margin:0;padding:0;background:#F4EFE4;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0a3d2b;padding:36px 48px;text-align:center;">
              <div style="font-family:'Georgia',serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:4px;text-transform:uppercase;">Dedrab</div>
              <div style="font-size:10px;color:#D4AF37;letter-spacing:4px;text-transform:uppercase;margin-top:6px;">Garden Inspiration</div>
            </td>
          </tr>

          <!-- Gold rule -->
          <tr><td style="height:3px;background:#b8962e;"></td></tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:48px 48px 40px;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b8962e;">A little something extra.</p>
              <h1 style="margin:0 0 24px;font-family:'Georgia',serif;font-size:28px;font-weight:400;color:#0a3d2b;line-height:1.25;">Your bonus invite — pass it on.</h1>

              <p style="margin:0 0 20px;font-size:17px;line-height:1.75;color:#4a3f32;font-family:'Georgia',serif;">
                Thank you for your order. We thought you might know someone whose garden deserves a proper look. Here's a one-time code — it's yours to give away.
              </p>

              <!-- Code block -->
              <table cellpadding="0" cellspacing="0" style="margin:32px 0;background:#f9f5ee;border:1px solid #e5ddd0;border-top:3px solid #b8962e;width:100%;">
                <tr>
                  <td style="padding:24px 32px;">
                    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a7e6e;padding-bottom:10px;">Their invite code</div>
                    <div style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:0.18em;color:#0a3d2b;">${code}</div>
                    <div style="font-size:12px;color:#8a7e6e;padding-top:10px;">Single use &middot; No expiry</div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:17px;line-height:1.75;color:#4a3f32;font-family:'Georgia',serif;">
                They can use it at <a href="https://www.dedrab.com/next" style="color:#b8962e;text-decoration:none;font-weight:600;">dedrab.com/next</a> to get their own garden design proposal. Just forward this email along.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:1px;background:#EDE6D3;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f5ee;padding:28px 48px;text-align:center;">
              <p style="margin:0 0 8px;font-family:'Georgia',serif;font-size:14px;font-weight:700;color:#0a3d2b;letter-spacing:2px;text-transform:uppercase;">Dedrab</p>
              <p style="margin:0 0 14px;font-size:11px;color:#b8962e;letter-spacing:3px;text-transform:uppercase;">dedrab.com</p>
              <p style="margin:0;font-size:11px;color:#8a7e6e;line-height:1.6;">
                You received this because you made a purchase on Dedrab.<br>
                If you didn&rsquo;t, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await getResend().emails.send({
    from: 'Dedrab <noreply@dedrab.com>',
    to: [to],
    subject: 'A gift for someone you know — your bonus invite code',
    html,
  });
}
