import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// NOTE: a public Supabase storage bucket named 'renders' must exist.
// Bucket policy should allow public read access so URLs work for social sharing and display.

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { renderBase64, sessionId } = body as {
    renderBase64?: string;
    sessionId?: string;
  };

  if (!renderBase64 || !sessionId) {
    return NextResponse.json({ error: 'renderBase64 and sessionId are required' }, { status: 400 });
  }

  const base64Data = renderBase64.includes(',') ? renderBase64.split(',')[1] : renderBase64;
  const buffer = Buffer.from(base64Data, 'base64');

  const filePath = 'render-' + sessionId + '.png';

  console.log('[upload-render] Uploading:', { sessionId, filePath, bufferBytes: buffer.length });

  const uploadResult = await supabaseAdmin.storage
    .from('renders')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadResult.error) {
    console.error('[upload-render] Storage upload error:', uploadResult.error);
    return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const publicUrl = supabaseUrl + '/storage/v1/object/public/renders/' + filePath;

  console.log('[upload-render] Succeeded:', publicUrl);

  return NextResponse.json({ renderUrl: publicUrl });
}
