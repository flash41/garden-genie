import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { MAX_UPLOAD_BYTES, REFERENCE_RE, UUID_RE, limitOr429 } from '@/lib/route-guards';

export const dynamic = 'force-dynamic';

// SECURITY (Nov 2026): this route used to let anyone overwrite any plan's
// PDF by guessing its reference number. It now requires the reference AND
// the matching private session id, checks the upload really is a PDF, and
// never replaces a PDF with a smaller one (closes backlog item R5, where an
// empty-shell PDF overwrote the good one on page revisits).
// No invite cookie is required: customers arriving from the email link on
// another device have no cookie but must still be able to save their PDF.
export async function POST(req: NextRequest) {
  const limited = await limitOr429(req, 'upload-pdf', 20, 60 * 60 * 1000);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { pdfBase64, referenceNumber, sessionId } = body as {
    pdfBase64?: unknown;
    referenceNumber?: unknown;
    sessionId?: unknown;
  };

  if (
    typeof pdfBase64 !== 'string' || !pdfBase64 ||
    typeof referenceNumber !== 'string' || !REFERENCE_RE.test(referenceNumber) ||
    typeof sessionId !== 'string' || !UUID_RE.test(sessionId)
  ) {
    return NextResponse.json({ error: 'pdfBase64, referenceNumber and sessionId are required' }, { status: 400 });
  }

  // Ownership: the caller must know both the reference and its session id.
  const { data: record } = await supabaseAdmin
    .from('design_records')
    .select('id')
    .eq('reference_number', referenceNumber)
    .eq('session_id', sessionId)
    .limit(1)
    .maybeSingle();
  if (!record) {
    console.warn('[upload-pdf] No design record for this reference + session pair');
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'PDF too large' }, { status: 413 });
  }
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return NextResponse.json({ error: 'File is not a PDF' }, { status: 400 });
  }

  const filePath = referenceNumber + '.pdf';
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const publicUrl = supabaseUrl + '/storage/v1/object/public/pdfs/' + filePath;

  // R5 guard: keep the existing PDF if it is larger than the incoming one.
  const { data: existing } = await supabaseAdmin.storage
    .from('pdfs')
    .list('', { search: filePath, limit: 5 });
  const current = (existing || []).find(f => f.name === filePath);
  const currentSize = Number((current?.metadata as { size?: number } | undefined)?.size || 0);
  const keepExisting = currentSize > buffer.length;

  if (keepExisting) {
    console.warn('[upload-pdf] Kept existing larger PDF', { referenceNumber, currentSize, incoming: buffer.length });
  } else {
    const uploadResult = await supabaseAdmin.storage
      .from('pdfs')
      .upload(filePath, buffer, { contentType: 'application/pdf', upsert: true });
    if (uploadResult.error) {
      console.error('[upload-pdf] Storage upload error:', uploadResult.error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('design_records')
    .update({ pdf_url: publicUrl })
    .eq('id', record.id);
  if (updateError) {
    console.error('[upload-pdf] DB update error:', updateError);
  }

  return NextResponse.json({ pdfUrl: publicUrl, kept: keepExisting });
}
