'use client';
import { useState } from 'react';

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

export default function NextPage() {
  // ── Stripe payment state ────────────────────────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // ── Invite code state ───────────────────────────────────────────────────
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  // ── Waitlist state ───────────────────────────────────────────────────────
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistError, setWaitlistError] = useState('');

  // ── URL error params (from failed /complete redirects) ──────────────────
  const urlError =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('error')
      : null;

  async function handleCheckout() {
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const res = await fetch('/api/checkout/create-session', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'No checkout URL returned');
      }
      window.location.href = data.url;
    } catch (err) {
      console.error('[next/page] Checkout error:', err);
      setCheckoutError('Something went wrong starting checkout. Please try again.');
      setCheckoutLoading(false);
    }
  }

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWaitlistStatus('loading');
    setWaitlistError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      if (res.ok) {
        setWaitlistStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setWaitlistError((data as { error?: string }).error ?? 'Something went wrong. Please try again.');
        setWaitlistStatus('error');
      }
    } catch {
      setWaitlistError('Network error. Please try again.');
      setWaitlistStatus('error');
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const upper = code.toUpperCase().trim();
    if (!upper) return;
    setCodeLoading(true);
    setCodeError('');
    try {
      const res = await fetch('/api/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: upper }),
      });
      const data = await res.json();
      if (data.success) {
        const validatedCode = data.code || upper;
        const isSecure =
          typeof window !== 'undefined' && window.location.protocol === 'https:';
        document.cookie =
          'dedrab_invite=' +
          validatedCode +
          '; path=/; max-age=' +
          60 * 60 * 24 * 30 +
          '; SameSite=Lax' +
          (isSecure ? '; Secure' : '');
        window.location.href = '/design';
      } else {
        setCodeError(
          'That code doesn’t appear to be valid. It may be unknown or already used. If this is a mistake, get in touch.',
        );
      }
    } catch {
      setCodeError('Something went wrong. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4efe4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
        padding: '24px',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        #invite-code-input { text-transform: uppercase; }
        #invite-code-input::placeholder { text-transform: none; color: #b0a898; }
        .site-logo-h { height: 44px; width: auto; }
        @media (max-width:640px) { .site-logo-h { height: 32px; } }
        .checkout-btn:hover:not(:disabled) { background: #0a5c3f !important; }
        .code-toggle:hover { color: #0a3d2b !important; }
        .code-primary-btn:hover:not(:disabled) { background: #0a5c3f !important; }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <img
          src="/dd_logo.png"
          alt="Dedrab"
          className="site-logo-h"
          style={{ display: 'inline-block' }}
        />
      </div>

      {/* Card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5ddd0',
          borderTop: '3px solid #b8962e',
          borderRadius: 10,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Heading */}
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#b8962e',
            fontWeight: 600,
          }}
        >
          The next step
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26,
            fontWeight: 400,
            color: '#0a3d2b',
            marginTop: 0,
            marginBottom: 12,
            lineHeight: 1.25,
          }}
        >
          {PAYMENTS_ENABLED ? 'Get your Garden Plan' : 'Get your Action Plan'}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: '#6b5e50',
            lineHeight: 1.7,
            marginTop: 0,
            marginBottom: 28,
          }}
        >
          {PAYMENTS_ENABLED
            ? 'Upload a photo of your garden and receive a personalised design proposal — a full planting spec, spatial layout, and phased plan you can hand straight to a gardener.'
            : 'Enter your code below to run your Action Plan. You’ll get a full planting spec, a spatial layout, and a phased plan you can hand straight to a gardener.'}
        </p>

        {/* What you get */}
        <div
          style={{
            background: '#f9f5ee',
            border: '1px solid #e5ddd0',
            borderRadius: 6,
            padding: '16px 18px',
            marginBottom: 24,
          }}
        >
          {(PAYMENTS_ENABLED
            ? [
                'AI-generated garden redesign render',
                'Full planting specification',
                'Spatial layout and proportions',
                'Phased implementation plan',
                'Downloadable PDF to keep',
              ]
            : [
                'Garden redesign render',
                'Full planting specification',
                'Spatial layout and proportions',
                'Phased implementation plan',
                'A downloadable plan to keep',
              ]
          ).map(item => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 8,
                fontSize: 13,
                color: '#4a3f32',
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: '#b8962e', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Beta notice + waitlist signup */}
        <div
          style={{
            background: '#f9f5ee',
            border: '1px solid #e5ddd0',
            borderRadius: 6,
            padding: '16px 18px',
            marginBottom: 20,
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              color: '#4a3f32',
              lineHeight: 1.65,
            }}
          >
            We&apos;re in beta, testing to make sure this is the best it can be before we open it up
            properly. Don&apos;t have a code? Register below and we&apos;ll send you a discounted
            launch code the day we&apos;re ready.
          </p>
          {waitlistStatus === 'success' ? (
            <p style={{ margin: 0, fontSize: 13, color: '#0a3d2b', fontWeight: 600 }}>
              You&apos;re on the list. Watch your inbox for your launch code.
            </p>
          ) : (
            <form
              onSubmit={handleWaitlistSubmit}
              style={{ display: 'flex', gap: 8 }}
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                disabled={waitlistStatus === 'loading'}
                style={{
                  flex: 1,
                  padding: '9px 11px',
                  border: '1px solid #d4c9b8',
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: '#0a3d2b',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                disabled={waitlistStatus === 'loading'}
                style={{
                  padding: '9px 14px',
                  background: waitlistStatus === 'loading' ? '#d4aa4a' : '#b8962e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: waitlistStatus === 'loading' ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
              >
                {waitlistStatus === 'loading' ? 'Saving…' : 'Join waitlist'}
              </button>
            </form>
          )}
          {waitlistStatus === 'error' && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#c0392b' }}>
              {waitlistError}
            </p>
          )}
        </div>

        {/* Divider between beta block and code entry */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div style={{ flex: 1, height: 1, background: '#e5ddd0' }} />
          <span style={{ fontSize: 11, color: '#b0a898', letterSpacing: '0.06em' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e5ddd0' }} />
        </div>

        {/* URL error (from failed /complete redirect) */}
        {urlError && (
          <p
            style={{
              fontSize: 13,
              color: '#c0392b',
              background: '#fdf3f2',
              border: '1px solid #f5c6c0',
              borderRadius: 4,
              padding: '10px 12px',
              marginBottom: 16,
            }}
          >
            {urlError === 'unpaid'
              ? 'Your payment didn’t complete. Please try again.'
              : 'Something went wrong after payment. Please get in touch if you were charged.'}
          </p>
        )}

        {/* Checkout error (paid mode only) */}
        {PAYMENTS_ENABLED && checkoutError && (
          <p
            style={{
              fontSize: 13,
              color: '#c0392b',
              background: '#fdf3f2',
              border: '1px solid #f5c6c0',
              borderRadius: 4,
              padding: '10px 12px',
              marginBottom: 16,
            }}
          >
            {checkoutError}
          </p>
        )}

        {/* Primary CTA — Stripe Checkout (only when payments enabled) */}
        {PAYMENTS_ENABLED && (
          <>
            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              style={{
                width: '100%',
                padding: '14px 0',
                background: checkoutLoading ? '#d4aa4a' : '#b8962e',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 15,
                cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.04em',
                transition: 'background 0.15s',
                marginBottom: 8,
              }}
            >
              {checkoutLoading ? 'Redirecting to checkout…' : 'Get my Garden Plan — €4.95'}
            </button>

            {/* Stripe trust badge */}
            <p
              style={{
                fontSize: 11,
                color: '#b0a898',
                textAlign: 'center',
                margin: '0 0 20px',
              }}
            >
              Secure payment by Stripe &middot; One-time charge &middot; No subscription
            </p>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div style={{ flex: 1, height: 1, background: '#e5ddd0' }} />
              <span style={{ fontSize: 11, color: '#b0a898', letterSpacing: '0.06em' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e5ddd0' }} />
            </div>
          </>
        )}

        {/* Code entry: secondary when payments on, primary when payments off */}
        {PAYMENTS_ENABLED ? (
          !showCodeInput ? (
            <button
              className="code-toggle"
              onClick={() => setShowCodeInput(true)}
              style={{
                width: '100%',
                background: 'none',
                border: '1px solid #e5ddd0',
                borderRadius: 6,
                padding: '11px 0',
                fontSize: 13,
                color: '#8a7e6e',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
              }}
            >
              I have an invite code
            </button>
          ) : (
            <form onSubmit={handleCodeSubmit}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#4a3f32',
                  marginBottom: 6,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Invite code
              </label>
              <input
                id="invite-code-input"
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. KPX847"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  border: '1px solid #d4c9b8',
                  borderRadius: 6,
                  fontSize: 17,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  marginBottom: 10,
                  boxSizing: 'border-box',
                  color: '#0a3d2b',
                  backgroundColor: '#fff',
                  outline: 'none',
                }}
              />

              {codeError && (
                <p
                  style={{
                    fontSize: 13,
                    color: '#c0392b',
                    background: '#fdf3f2',
                    border: '1px solid #f5c6c0',
                    borderRadius: 4,
                    padding: '10px 12px',
                    marginBottom: 10,
                    marginTop: 0,
                  }}
                >
                  {codeError}
                </p>
              )}

              <button
                type="submit"
                disabled={codeLoading}
                style={{
                  width: '100%',
                  padding: '11px 0',
                  background: codeLoading ? '#d4c9b8' : '#0a3d2b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: codeLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '0.04em',
                  transition: 'background 0.15s',
                }}
              >
                {codeLoading ? 'Checking…' : 'Continue with code'}
              </button>
            </form>
          )
        ) : (
          // ─── Code entry as the primary, complete path ───
          <form onSubmit={handleCodeSubmit}>
            <label
              htmlFor="invite-code-input"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: '#4a3f32',
                marginBottom: 6,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Your code
            </label>
            <input
              id="invite-code-input"
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. KPX847"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              style={{
                width: '100%',
                padding: '13px 14px',
                border: '1px solid #d4c9b8',
                borderRadius: 6,
                fontSize: 18,
                fontFamily: 'monospace',
                fontWeight: 600,
                letterSpacing: '0.14em',
                marginBottom: 12,
                boxSizing: 'border-box',
                color: '#0a3d2b',
                backgroundColor: '#fff',
                outline: 'none',
              }}
            />

            {codeError && (
              <p
                style={{
                  fontSize: 13,
                  color: '#c0392b',
                  background: '#fdf3f2',
                  border: '1px solid #f5c6c0',
                  borderRadius: 4,
                  padding: '10px 12px',
                  marginBottom: 12,
                  marginTop: 0,
                }}
              >
                {codeError}
              </p>
            )}

            <button
              type="submit"
              className="code-primary-btn"
              disabled={codeLoading}
              style={{
                width: '100%',
                padding: '14px 0',
                background: codeLoading ? '#4a6855' : '#0a3d2b',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 15,
                cursor: codeLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.04em',
                transition: 'background 0.15s',
              }}
            >
              {codeLoading ? 'Checking your code…' : 'Run my Action Plan'}
            </button>

            <p
              style={{
                fontSize: 12,
                color: '#8a7e6e',
                textAlign: 'center',
                margin: '14px 0 0',
                lineHeight: 1.5,
              }}
            >
              Your selections are kept safe while we run your plan.
            </p>
          </form>
        )}
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 24, fontSize: 12, color: '#b0a898', textAlign: 'center' }}>
        {'Questions? '}
        <a
          href="/contact"
          style={{ color: '#b8962e', textDecoration: 'none', fontWeight: 600 }}
        >
          Get in touch
        </a>
      </p>
    </div>
  );
}
