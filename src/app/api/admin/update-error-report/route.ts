import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const validStatuses = ['new', 'under_review', 'resolved'];

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin_auth');
  if (!adminAuth || adminAuth.value !== process.env.ADMIN_PASSWORD) {
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

  console.log('[update-error-report] body received:', { id, status, resolution_note });

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

  const { data, error } = await supabaseAdmin
    .from('error_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  console.log('[update-error-report] supabase result:', { data, error });

  if (error) {
    console.error('[update-error-report] failed:', error);
    return NextResponse.json({ success: false, error: error.message ?? 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
