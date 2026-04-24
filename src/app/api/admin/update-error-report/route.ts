import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { isAuthenticatedAdminRequest } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

const validStatuses = ['new', 'under_review', 'resolved'];

export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticatedAdminRequest(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { id, status, resolution_note } = body as {
    id?: string;
    status?: string;
    resolution_note?: string;
  };

  if (!id || !status) {
    return NextResponse.json({ success: false, error: 'id and status are required' }, { status: 400 });
  }

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid status value' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };
  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString();
    if (resolution_note) updates.resolution_note = resolution_note;
  }
  if (status === 'under_review') {
    updates.resolved_at = null;
  }

  // resolved_at column confirmed present after migration
  const { error } = await supabaseAdmin
    .from('error_reports')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[update-error-report] failed:', error);
    return NextResponse.json({ success: false, error: error.message ?? 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
