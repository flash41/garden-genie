import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { MAX_UPLOAD_BYTES, UUID_RE, limitOr429, requireInvite } from '@/lib/route-guards';

export const dynamic = 'force-dynamic';

function detectImageType(buf: Buffer): string | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

// SECURITY (Nov 2026): now requires a real invite cookie, a well-formed
// session id, a genuine image and a size cap. Only called from /design.
export async function POST(req: NextRequest) {
  const limited = await limitOr429(req, 'upload-render', 20, 60 * 60 * 1000);
  if (limited) return limited;
  const invite = await requireInvite(req);
  if (invite instanceof NextResponse) return invite;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { renderBase64, sessionId } = body as { renderBase64?: unknown; sessionId?: unknown };

  if (typeof renderBase64 !== 'string' || !renderBase64 || typeof sessionId !== 'string' || !UUID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'renderBase64 and sessionId are required' }, { status: 400 });
  }

  const base64Data = renderBase64.includes(',') ? renderBase64.split(',')[1] : renderBase64;
  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Image too large' }, { status: 413 });
  }
  const contentType = detectImageType(buffer);
  if (!contentType) {
    return NextResponse.json({ error: 'File is not a supported image' }, { status: 400 });
  }

  const filePath = 'render-' + sessionId + '.png';

  const uploadResult = await supabaseAdmin.storage
    .from('renders')
    .upload(filePath, buffer, { contentType, upsert: true });

  if (uploadResult.error) {
    console.error('[upload-render] Storage upload error:', uploadResult.error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const publicUrl = supabaseUrl + '/storage/v1/object/public/renders/' + filePath;

  return NextResponse.json({ renderUrl: publicUrl });
}
