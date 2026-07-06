'use client';

import { useState } from 'react';

// ─── BRAND TOKENS (mirrors the C constant in DesignTool.tsx) ──────────────────
const brand       = '#0a3d2b';
const accent      = '#b8962e';
const surface     = '#F4EFE4';
const card        = '#EDE6D3';
const rule        = '#d9cdb8';
const ink         = '#2C1A0E';
const inkMid      = '#4a3928';
const inkLight    = '#8a7e6e';
const font        = "'DM Sans', 'Inter', 'Helvetica Neue', Arial, sans-serif";
const fontSerif   = "'Playfair Display', Georgia, serif";

export default function WaitlistGate() {
  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: surface,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: font,
      padding: '40px 20px',
    }}>
      <div style={{
        background: card,
        border: `1px solid ${rule}`,
        borderRadius: 8,
        padding: '48px 40px',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 4px 12px rgba(44,26,14,0.10)',
      }}>
        {/* Wordmark */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <span style={{
            fontFamily: fontSerif,
            fontSize: 22,
            fontWeight: 700,
            color: brand,
            letterSpacing: '0.04em',
          }}>
            dedrab
          </span>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: brand,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{
              fontFamily: font,
              fontSize: 17,
              color: ink,
              lineHeight: 1.6,
              margin: 0,
            }}>
              You&apos;re in. We&apos;ll email you the moment it&apos;s live.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{
              fontFamily: fontSerif,
              fontSize: 26,
              fontWeight: 700,
              color: ink,
              lineHeight: 1.35,
              margin: '0 0 28px',
              textAlign: 'center',
            }}>
              Back shortly — join the waitlist for priority access and a launch price.
            </h1>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={status === 'loading'}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 15,
                  fontFamily: font,
                  color: ink,
                  background: surface,
                  border: `1px solid ${rule}`,
                  borderRadius: 4,
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 12,
                }}
              />

              {status === 'error' && (
                <p style={{ color: '#b91c1c', fontSize: 13, fontFamily: font, margin: '0 0 12px' }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '13px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: font,
                  color: '#fff',
                  background: status === 'loading' ? '#1a5c3f' : brand,
                  border: 'none',
                  borderRadius: 4,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.02em',
                  transition: 'background 0.15s',
                }}
              >
                {status === 'loading' ? 'Saving…' : 'Join the waitlist'}
              </button>
            </form>

            <p style={{
              marginTop: 20,
              fontSize: 13,
              color: inkLight,
              fontFamily: font,
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              No spam. One email when we&apos;re live.
            </p>
          </>
        )}

        {/* Accent rule */}
        <div style={{
          marginTop: 36,
          borderTop: `1px solid ${rule}`,
          paddingTop: 20,
          textAlign: 'center',
          fontSize: 12,
          color: inkLight,
          fontFamily: font,
        }}>
          <span style={{ color: accent, fontWeight: 700 }}>dedrab.com</span>
          {' · '}
          <span style={{ color: inkMid }}>Garden Design Platform</span>
        </div>
      </div>
    </div>
  );
}
