import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.dedrab.com';

export async function POST() {
  // Fail fast with a clear log if env vars are missing — helps diagnose
  // Vercel environment misconfiguration (e.g. vars scoped to Production only)
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!stripeKey) {
    console.error('[create-session] STRIPE_SECRET_KEY is not set');
    return NextResponse.json({ error: 'Checkout unavailable — configuration error' }, { status: 503 });
  }
  if (!priceId) {
    console.error('[create-session] STRIPE_PRICE_ID is not set');
    return NextResponse.json({ error: 'Checkout unavailable — configuration error' }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-04-22.dahlia',
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      // After payment, Stripe redirects here — server sets cookie and sends user to /design
      success_url: `${SITE_URL}/api/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
      // User clicked "back" — return them to the payment page
      cancel_url: `${SITE_URL}/next`,
      // Let Stripe handle tax automatically based on customer location
      automatic_tax: { enabled: true },
      // Collect billing address for tax purposes
      billing_address_collection: 'auto',
    });

    if (!session.url) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[create-session] Stripe error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
