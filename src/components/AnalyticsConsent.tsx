'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-532QK8PLBH';
const GA_MEASUREMENT_ID_2 = 'G-TV8VD0X6CY';
const CONSENT_COOKIE = 'dedrab_analytics_consent';
const CONSENT_MAX_AGE_DAYS = 365;

type ConsentValue = 'granted' | 'denied' | null;

function readConsent(): ConsentValue {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CONSENT_COOKIE}=`));
  const val = match?.split('=')[1];
  if (val === 'granted' || val === 'denied') return val;
  return null;
}

function writeConsent(value: 'granted' | 'denied'): void {
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE}=${value};max-age=${maxAge};path=/;SameSite=Lax${location.protocol === 'https:' ? ';Secure' : ''}`;
}

function clearConsent(): void {
  document.cookie = `${CONSENT_COOKIE}=;max-age=0;path=/`;
}

function updateGtagConsent(value: 'granted' | 'denied'): void {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
      'consent',
      'update',
      { analytics_storage: value }
    );
  }
}

export default function AnalyticsConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    setConsent(stored);
    setShowBanner(stored === null);
    setMounted(true);

    // Listen for manual re-open (e.g. from footer cookie preferences link)
    const handler = () => setShowBanner(true);
    window.addEventListener('dedrab:open-cookie-banner', handler);
    return () => window.removeEventListener('dedrab:open-cookie-banner', handler);
  }, []);

  function handleAccept() {
    writeConsent('granted');
    updateGtagConsent('granted');
    setConsent('granted');
    setShowBanner(false);
  }

  function handleDecline() {
    writeConsent('denied');
    updateGtagConsent('denied');
    setConsent('denied');
    setShowBanner(false);
  }

  if (!mounted) return null;

  return (
    <>
      {/* GA scripts — only when consent is granted */}
      {consent === 'granted' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
              gtag('config', '${GA_MEASUREMENT_ID_2}', { anonymize_ip: true });
              gtag('consent', 'update', { analytics_storage: 'granted' });
            `}
          </Script>
        </>
      )}

      {/* Consent banner */}
      {showBanner && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 bg-white border border-stone-200 rounded-lg shadow-lg p-4"
        >
          <p className="text-sm text-stone-700 mb-3 leading-relaxed">
            We use analytics cookies to understand how the site is used. No
            advertising, no tracking across other sites.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 bg-[#0a3d2b] text-white text-sm font-semibold py-2 px-4 rounded hover:bg-[#064e3b] transition-colors"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              className="flex-1 border border-stone-300 text-stone-600 text-sm font-semibold py-2 px-4 rounded hover:bg-stone-50 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * CookiePreferencesButton — drop this anywhere in the UI to let users
 * re-open the consent banner (e.g. in SiteFooter).
 * Fires a custom event that AnalyticsConsent listens for.
 */
export function CookiePreferencesButton({ className }: { className?: string }) {
  function handleClick() {
    clearConsent();
    window.dispatchEvent(new Event('dedrab:open-cookie-banner'));
  }

  return (
    <button
      onClick={handleClick}
      className={className ?? 'text-xs text-stone-400 hover:text-[#0a3d2b] underline underline-offset-2'}
    >
      Cookie preferences
    </button>
  );
}
