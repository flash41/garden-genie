import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Restrict to known safe origins — prevents SSRF to internal hosts
const ALLOWED_PREFIXES = [
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'https://www.dedrab.com',
].filter(Boolean) as string[];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }
  const allowed = ALLOWED_PREFIXES.some(p => url.startsWith(p));
  if (!allowed) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream ' + res.status }, { status: 502 });
    }
    const mimeType = (res.headers.get('content-type') || 'image/png').split(';')[0].trim();
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return NextResponse.json({ base64, mimeType });
  } catch (err) {
    console.error('[fetch-asset] error:', err);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
