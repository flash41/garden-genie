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

  if (!pdfBase64 || !referenceNumber || !sessionId) {
    return NextResponse.json({ error: 'pdfBase64, referenceNumber and sessionId are required' }, { status: 400 });
  }

  const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
  const buffer = Buffer.from(base64Data, 'base64');

  const filePath = referenceNumber + '.pdf';

  const { error: uploadError } = await supabaseAdmin.storage
    .from('pdfs')
    .upload(filePath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.error('[upload-pdf] Storage upload error:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const pdfUrl = supabaseUrl + '/storage/v1/object/public/pdfs/' + filePath;

  const { error: updateError } = await supabaseAdmin
    .from('design_records')
    .update({ pdf_url: pdfUrl })
    .eq('session_id', sessionId);

  if (updateError) {
    console.error('[upload-pdf] DB update error:', updateError);
    // Non-fatal — the file is uploaded, just log it
  }

  return NextResponse.json({ pdfUrl });
}
