import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { sessionId, pdfUrl, renderUrl } = body as {
    sessionId?: string;
    pdfUrl?: string;
    renderUrl?: string;
  };

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (pdfUrl) updates.pdf_url = pdfUrl;
  if (renderUrl) updates.render_url = renderUrl;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  console.log('[update-design] Updating session_id:', sessionId, 'fields:', Object.keys(updates));

  const { error } = await supabaseAdmin
    .from('design_records')
    .update(updates)
    .eq('session_id', sessionId);

  if (error) {
    console.error('[update-design] DB update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
