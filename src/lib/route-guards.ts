import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase-server';
import { rateLimit, callerIp } from './rate-limit';

/**
 * Shared guards for public API routes (added in the Nov 2026 security pass).
 *
 * These routes run with the service-role key, so every check that the
 * database would normally make for us has to be made here instead.
 */

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Matches generateReference(): DED-YYYYMM-XXXX using the unambiguous alphabet.
export const REFERENCE_RE = /^DED-\d{6}-[A-HJ-NP-Z2-9]{4}$/;

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** One plain address only: no display names, lists, quotes or line breaks. */
export function isValidEmail(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 254 &&
    /^[^\s@<>,;:"'()\\]+@[^\s@<>,;:"'()\\]+\.[^\s@<>,;:"'()\\]{2,}$/.test(value)
  );
}

function supabaseOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').origin;
  } catch {
    return null;
  }
}

/**
 * Returns a parsed URL only if it points at OUR Supabase storage.
 * Compares the exact origin (not a string prefix), so look-alike hosts such
 * as https://<project>.supabase.co.evil.com are rejected.
 * Pass `publicBucket` to additionally require a specific public bucket.
 */
export function parseOwnStorageUrl(raw: unknown, opts?: { publicBucket?: string }): URL | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const origin = supabaseOrigin();
  if (!origin || url.protocol !== 'https:' || url.origin !== origin) return null;
  if (url.username || url.password) return null;
  const prefix = opts?.publicBucket
    ? `/storage/v1/object/public/${opts.publicBucket}/`
    : '/storage/v1/object/';
  if (!url.pathname.startsWith(prefix)) return null;
  return url;
}

/** Per-IP rate limit. Returns a 429 response to send, or null to carry on. */
export async function limitOr429(
  req: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const result = await rateLimit({ key: `${bucket}:ip:${callerIp(req)}`, limit, windowMs });
  if (result.allowed) return null;
  return NextResponse.json(
    { error: 'rate_limited', message: 'Too many requests. Please wait and try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))),
      },
    },
  );
}

/**
 * Requires a dedrab_invite cookie that exists in invite_codes.
 * (Middleware only checks the cookie is present; this checks it is real.)
 * Returns the code, or a 401 response to send.
 */
export async function requireInvite(req: NextRequest): Promise<string | NextResponse> {
  const code = req.cookies.get('dedrab_invite')?.value?.trim();
  if (!code || code.length > 100) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }
  const { data } = await supabaseAdmin
    .from('invite_codes')
    .select('code')
    .eq('code', code)
    .maybeSingle();
  if (!data) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }
  return code;
}
