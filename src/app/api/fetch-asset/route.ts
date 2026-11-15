import { NextRequest, NextResponse } from 'next/server';
import { MAX_UPLOAD_BYTES, limitOr429, parseOwnStorageUrl } from '@/lib/route-guards';

export const dynamic = 'force-dynamic';

const SITE_ORIGIN = 'https://www.dedrab.com';

// SECURITY (Nov 2026): the old check was `url.startsWith(prefix)`, which let
// https://www.dedrab.com.evil.com through and turned this route into an open
// relay. We now compare the exact origin, refuse redirects, and only return
// images.
function allowedUrl(raw: string): URL | null {
  const storageUrl = parseOwnStorageUrl(raw);
  if (storageUrl) return storageUrl;
  try {
    const url = new URL(raw);
    if (url.origin === SITE_ORIGIN && !url.username && !url.password) return url;
  } catch {
    /* fall through */
  }
  return null;
}

export async function GET(req: NextRequest) {
  // Generous limit: one PDF build fetches several assets.
  const limited = await limitOr429(req, 'fetch-asset', 120, 60 * 60 * 1000);
  if (limited) return limited;

  const raw = req.nextUrl.searchParams.get('url');
  if (!raw) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }
  const url = allowedUrl(raw);
  if (!url) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }
  try {
    const res = await fetch(url.toString(), { redirect: 'error' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream ' + res.status }, { status: 502 });
    }
    const mimeType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!mimeType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 415 });
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Asset too large' }, { status: 413 });
    }
    const base64 = Buffer.from(buffer).toString('base64');
    return NextResponse.json({ base64, mimeType });
  } catch (err) {
    console.error('[fetch-asset] error:', err);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
