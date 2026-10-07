'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function sendBeacon(payload: Record<string, unknown>): void {
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (!navigator.sendBeacon('/api/track', blob)) {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Swallow all errors
  }
}

function getUtmParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  try {
    const p = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    const s = p.get('utm_source');
    const m = p.get('utm_medium');
    const c = p.get('utm_campaign');
    if (s) result.utm_source = s;
    if (m) result.utm_medium = m;
    if (c) result.utm_campaign = c;
    return result;
  } catch {
    return {};
  }
}

export default function SiteTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const isFirstView = !mountedRef.current;
    mountedRef.current = true;

    const referrer = isFirstView
      ? (document.referrer || undefined)
      : prevPathRef.current
        ? window.location.origin + prevPathRef.current
        : undefined;

    sendBeacon({
      event: 'pageview',
      path: pathname,
      ...(referrer ? { referrer } : {}),
      ...getUtmParams(),
    });

    prevPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as Element).closest('a,button');
      if (!target) return;
      if (target.textContent?.includes('Build my Garden Plan')) {
        sendBeacon({
          event: 'cta_build_plan',
          path: window.location.pathname,
          ...getUtmParams(),
        });
      }
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
