import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { UUID_RE, limitOr429, parseOwnStorageUrl, requireInvite } from '@/lib/route-guards';

export const dynamic = 'force-dynamic';

// SECURITY (Nov 2026): now requires a real invite cookie and only accepts
// links that point at our own storage, so a plan can no longer be repointed
// at somebody else's file. Only called from /design.
export async function PATCH(req: NextRequest) {
  const limited = await limitOr429(req, 'update-design', 30, 60 * 60 * 1000);
  if (limited) return limited;
  const invite = await requireInvite(req);
  if (invite instanceof NextResponse) return invite;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { sessionId, pdfUrl, renderUrl } = body as {
    sessionId?: unknown;
    pdfUrl?: unknown;
    renderUrl?: unknown;
  };

  if (typeof sessionId !== 'string' || !UUID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (pdfUrl) {
    const parsed = parseOwnStorageUrl(pdfUrl, { publicBucket: 'pdfs' });
    if (!parsed) return NextResponse.json({ error: 'Invalid pdfUrl' }, { status: 400 });
    updates.pdf_url = parsed.origin + parsed.pathname;
  }
  if (renderUrl) {
    const parsed = parseOwnStorageUrl(renderUrl);
    if (!parsed) return NextResponse.json({ error: 'Invalid renderUrl' }, { status: 400 });
    updates.render_url = parsed.toString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('design_records')
    .update(updates)
    .eq('session_id', sessionId);

  if (error) {
    console.error('[update-design] DB update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
