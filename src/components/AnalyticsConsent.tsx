'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

/**
 * Minimal GDPR-aware cookie consent banner + Google Analytics (gtag.js) loader.
 *
 * Behaviour:
 *   - On first visit, displays a discreet banner at the bottom of the viewport.
 *   - Accept → stores `granted` in a 365-day cookie, loads gtag.
 *   - Reject → stores `denied`, does NOT load gtag.
 *   - Choice is persistent across sessions. User can revisit /legal to withdraw
 *     (full preference centre arrives in the Sprint 3 GDPR polish pass).
 *
 * Implementation notes:
 *   - Cookie (not localStorage) so SSR and API routes can read it if needed.
 *   - Consent is stored per-browser; there is no account concept yet.
 *   - The banner renders only after mount to avoid hydration mismatches and to
 *     prevent it flashing on top of the app for users who have already chosen.
 */

const GA_MEASUREMENT_ID = 'G-532QK8PLBH';
const CONSENT_COOKIE = 'dedrab_analytics_consent';
const CONSENT_MAX_AGE_DAYS = 365;

type ConsentValue = 'granted' | 'denied' | null;

function readConsent(): ConsentValue {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)dedrab_analytics_consent=([^;]+)/);
  if (!match) return null;
  const v = decodeURIComponent(match[1]);
  return v === 'granted' || v === 'denied' ? v : null;
}

function writeConsent(value: 'granted' | 'denied'): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export default function AnalyticsConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsent(readConsent());
  }, []);

  const accept = () => {
    writeConsent('granted');
    setConsent('granted');
  };

  const reject = () => {
    writeConsent('denied');
    setConsent('denied');
  };

  return (
    <>
      {consent === 'granted' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {mounted && consent === null && (
        <div
          role="dialog"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 16,
            maxWidth: 560,
            margin: '0 auto',
            background: '#fff',
            border: '1px solid #e5ddd0',
            borderTop: '3px solid #b8962e',
            borderRadius: 10,
            padding: '18px 20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            lineHeight: 1.55,
            color: '#2f2a22',
            zIndex: 9999,
          }}
        >
          <div id="consent-title" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 17,
            color: '#0a3d2b',
            marginBottom: 6,
          }}>
            A quiet note on cookies
          </div>
          <p id="consent-desc" style={{ margin: '0 0 14px 0', color: '#6b5e50' }}>
            We use a single analytics cookie to understand how the site is used. Nothing more, nothing sold. You can accept or decline; your choice is remembered.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={accept}
              style={{
                background: '#0a3d2b',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={reject}
              style={{
                background: 'transparent',
                color: '#4a3f32',
                border: '1px solid #d4c9b8',
                borderRadius: 6,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Decline
            </button>
            <a
              href="/legal"
              style={{
                alignSelf: 'center',
                marginLeft: 'auto',
                fontSize: 12,
                color: '#6b5e50',
                textDecoration: 'underline',
              }}
            >
              Learn more
            </a>
          </div>
        </div>
      )}
    </>
  );
}
