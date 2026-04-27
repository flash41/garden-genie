import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createInviteCode } from '@/lib/invite-codes';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

const SITE_URL = 'https://dedrab.com';
// 30 days in seconds — matches the existing invite cookie lifetime
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/next', SITE_URL));
  }

  // ── Idempotency check ─────────────────────────────────────────────────────
  // If this session was already processed (e.g. user refreshed the success URL),
  // re-use the existing code rather than generating another.
  const { data: existing } = await supabaseAdmin
    .from('stripe_payments')
    .select('primary_code')
    .eq('session_id', sessionId)
    .maybeSingle();

  let primaryCode: string;

  if (existing?.primary_code) {
    primaryCode = existing.primary_code;
  } else {
    // ── Verify payment with Stripe ──────────────────────────────────────────
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      console.error('[checkout/complete] Failed to retrieve Stripe session:', err);
      return NextResponse.redirect(new URL('/next?error=session', SITE_URL));
    }

    if (session.payment_status !== 'paid') {
      console.warn('[checkout/complete] Session not paid:', sessionId, session.payment_status);
      return NextResponse.redirect(new URL('/next?error=unpaid', SITE_URL));
    }

    // ── Generate 2-use invite code for the buyer ────────────────────────────
    try {
      primaryCode = await createInviteCode(
        2,
        'stripe_payment_primary',
        session.customer_details?.email ?? undefined,
      );
    } catch (err) {
      console.error('[checkout/complete] Failed to create invite code:', err);
      return NextResponse.redirect(new URL('/next?error=code', SITE_URL));
    }

    // ── Record in stripe_payments ───────────────────────────────────────────
    // Insert a fresh row. The webhook handler will UPDATE this row later
    // to add share_code. Using insert (not upsert) because if the row already
    // existed we'd have caught it in the idempotency check above.
    const { error: insertError } = await supabaseAdmin.from('stripe_payments').insert({
      session_id: sessionId,
      customer_email: session.customer_details?.email ?? null,
      primary_code: primaryCode,
      primary_processed_at: new Date().toISOString(),
    });

    if (insertError) {
      // Could be a race with the webhook — try fetching again
      if ((insertError as { code?: string }).code === '23505') {
        const { data: retry } = await supabaseAdmin
          .from('stripe_payments')
          .select('primary_code')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (retry?.primary_code) {
          primaryCode = retry.primary_code;
        } else {
          console.error('[checkout/complete] Insert conflict but no existing code found');
          return NextResponse.redirect(new URL('/next?error=conflict', SITE_URL));
        }
      } else {
        console.error('[checkout/complete] DB insert error:', insertError);
        return NextResponse.redirect(new URL('/next?error=db', SITE_URL));
      }
    }
  }

  // ── Set cookie and redirect to /design ─────────────────────────────────────
  const response = NextResponse.redirect(new URL('/design', SITE_URL));
  response.cookies.set('dedrab_invite', primaryCode, {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: true,
    // httpOnly: false — must be readable client-side; the design gate reads it
    // via document.cookie. The code itself is non-sensitive (validated server-side).
    httpOnly: false,
  });

  return response;
}
