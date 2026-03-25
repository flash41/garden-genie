import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { pdfBase64, referenceNumber, sessionId } = body as {
    pdfBase64?: string;
    referenceNumber?: string;
    sessionId?: string;
  };

  console.log('[upload-pdf] Received:', {
    sessionId,
    referenceNumber,
    base64Length: typeof pdfBase64 === 'string' ? pdfBase64.length : 0,
  });

  if (!pdfBase64 || !referenceNumber || !sessionId) {
    return NextResponse.json({ error: 'pdfBase64, referenceNumber and sessionId are required' }, { status: 400 });
  }

  const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
  const buffer = Buffer.from(base64Data, 'base64');

  const filePath = referenceNumber + '.pdf';

  const uploadResult = await supabaseAdmin.storage
    .from('pdfs')
    .upload(filePath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  console.log('[upload-pdf] Storage upload result:', {
    data: uploadResult.data,
    error: uploadResult.error,
  });

  if (uploadResult.error) {
    console.error('[upload-pdf] Storage upload error:', uploadResult.error);
    return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const publicUrl = supabaseUrl + '/storage/v1/object/public/pdfs/' + filePath;

  console.log('[upload-pdf] Constructed public URL:', publicUrl);

  const { data, error: updateError } = await supabaseAdmin
    .from('design_records')
    .update({ pdf_url: publicUrl })
    .eq('session_id', sessionId)
    .select();

  console.log('[upload-pdf] Update by session_id result:', {
    rowsAffected: data ? data.length : 0,
    data,
    error: updateError,
  });

  if (updateError) {
    console.error('[upload-pdf] DB update error (session_id):', updateError);
  }

  if (!data || data.length === 0) {
    console.warn('[upload-pdf] 0 rows matched session_id — trying reference_number fallback');
    const fallback = await supabaseAdmin
      .from('design_records')
      .update({ pdf_url: publicUrl })
      .eq('reference_number', referenceNumber)
      .select();

    console.log('[upload-pdf] Fallback update by reference_number result:', {
      rowsAffected: fallback.data ? fallback.data.length : 0,
      data: fallback.data,
      error: fallback.error,
    });
  }

  return NextResponse.json({ pdfUrl: publicUrl });
}
