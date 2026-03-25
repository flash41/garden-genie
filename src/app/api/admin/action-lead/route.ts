import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function checkAdminAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_auth');
  return !!(cookie && cookie.value && cookie.value === process.env.ADMIN_PASSWORD);
}

export async function PATCH(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { id, actioned } = body as { id?: string; actioned?: boolean };

  if (!id || typeof actioned !== 'boolean') {
    return NextResponse.json({ success: false, error: 'id and actioned are required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('quote_requests')
    .update({
      actioned,
      actioned_at: actioned ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) {
    console.error('[action-lead] Update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
