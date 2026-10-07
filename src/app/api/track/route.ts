import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { isAuthenticatedAdmin } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

const VALID_EVENTS = new Set(['pageview', 'cta_build_plan']);
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor/i;

function no_content() {
  return new Response(null, { status: 204 });
}

function parseReferrer(raw: string | undefined): {
  referrer_host: string | null;
  referrer_path: string | null;
} {
  if (!raw) return { referrer_host: null, referrer_path: null };
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'dedrab.com') {
      return {
        referrer_host: 'internal',
        referrer_path: u.pathname.slice(0, 200) || null,
      };
    }
    return { referrer_host: host.slice(0, 200) || null, referrer_path: null };
  } catch {
    return { referrer_host: null, referrer_path: null };
  }
}

function trimTrunc(val: unknown, max: number): string | null {
  if (typeof val !== 'string') return null;
  const t = val.trim().slice(0, max);
  return t || null;
}

export async function POST(req: NextRequest) {
  // Always 204 — never leak info
  try {
    // Bot filter
    const ua = req.headers.get('user-agent') ?? '';
    if (BOT_RE.test(ua)) return no_content();

    // Admin filter
    if (await isAuthenticatedAdmin()) return no_content();

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return no_content();
    }

    const event = typeof body.event === 'string' ? body.event : '';
    if (!VALID_EVENTS.has(event)) return no_content();

    // Validate path
    let path = typeof body.path === 'string' ? body.path : '';
    // Strip query string and hash
    path = path.split('?')[0].split('#')[0].slice(0, 200);
    if (!path.startsWith('/')) return no_content();
    if (path.startsWith('/admin') || path.startsWith('/api')) return no_content();

    const { referrer_host, referrer_path } = parseReferrer(
      typeof body.referrer === 'string' ? body.referrer : undefined
    );

    const utm_source = trimTrunc(body.utm_source, 100);
    const utm_medium = trimTrunc(body.utm_medium, 100);
    const utm_campaign = trimTrunc(body.utm_campaign, 100);

    const { error } = await supabaseAdmin.from('site_events').insert({
      event,
      path,
      referrer_host,
      referrer_path,
      utm_source,
      utm_medium,
      utm_campaign,
    });

    if (error) {
      console.error('[track] insert error:', error);
    }
  } catch (err) {
    console.error('[track] unexpected error:', err);
  }

  return no_content();
}
