import { NextResponse } from 'next/server';
import { lookup } from 'dns/promises';

export const dynamic = 'force-dynamic';

// --- SSRF hardening ---
// This endpoint previously accepted any URL. Now:
//   1. https:// only (rejects http, file, gopher, data, etc.)
//   2. Hostname must match the allowlist OR resolve to a public IP
//   3. Private / reserved IP ranges are blocked after DNS resolution
//   4. Content-Type must be image/*
//   5. 15s timeout (was 60s)
//   6. 25MB response size cap

const ALLOWED_HOST_SUFFIXES = [
  '.supabase.co',
  '.supabase.in',
  'dedrab.com',
];

const MAX_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p))) return true; // fail closed
  const [a, b] = parts;
  if (a === 10) return true;                            // 10.0.0.0/8
  if (a === 127) return true;                           // loopback
  if (a === 169 && b === 254) return true;              // link-local / AWS metadata
  if (a === 172 && b >= 16 && b <= 31) return true;     // 172.16.0.0/12
  if (a === 192 && b === 168) return true;              // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true;    // CGNAT 100.64.0.0/10
  if (a === 0) return true;                             // 0.0.0.0/8
  if (a >= 224) return true;                            // multicast + reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1') return true;                         // loopback
  if (lower === '::') return true;                          // unspecified
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique-local fc00::/7
  if (lower.startsWith('fe80')) return true;                // link-local
  if (lower.startsWith('ff')) return true;                  // multicast
  if (lower.startsWith('::ffff:')) {                        // IPv4-mapped
    const v4 = lower.replace('::ffff:', '');
    return isPrivateIPv4(v4);
  }
  return false;
}

async function isSafeHostname(hostname: string): Promise<{ ok: boolean; reason?: string }> {
  const hostLower = hostname.toLowerCase();

  // Reject localhost aliases up front — DNS can return anything
  if (hostLower === 'localhost' || hostLower.endsWith('.localhost') || hostLower === '127.0.0.1') {
    return { ok: false, reason: 'blocked_hostname' };
  }

  // Allowlist match short-circuits — but we STILL verify IP is public below,
  // so a compromised allowlisted host pointing to a private IP is caught.
  const allowlisted = ALLOWED_HOST_SUFFIXES.some(suffix =>
    suffix.startsWith('.') ? hostLower.endsWith(suffix) : hostLower === suffix
  );
  if (!allowlisted) return { ok: false, reason: 'host_not_allowlisted' };

  // Resolve and verify the IP is public
  try {
    const addresses = await lookup(hostname, { all: true });
    for (const addr of addresses) {
      const isPrivate = addr.family === 4 ? isPrivateIPv4(addr.address) : isPrivateIPv6(addr.address);
      if (isPrivate) return { ok: false, reason: 'resolves_to_private_ip' };
    }
  } catch {
    return { ok: false, reason: 'dns_failure' };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only https:// URLs are permitted' }, { status: 400 });
    }

    const safety = await isSafeHostname(parsed.hostname);
    if (!safety.ok) {
      console.warn('[image-proxy] rejected URL', { host: parsed.hostname, reason: safety.reason });
      return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
    }

    const response = await fetch(parsed.toString(), {
      headers: { 'User-Agent': 'Dedrab/1.0' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'error', // do not follow redirects — prevents allowlist bypass via 302 to private IP
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Image service returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Non-image content rejected' }, { status: 415 });
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength && contentLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });

  } catch (error: unknown) {
    console.error('[image-proxy] error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Image proxy failed' }, { status: 500 });
  }
}
