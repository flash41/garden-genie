import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

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

  if (!id || !status) {
    return NextResponse.json({ success: false, error: 'id and status are required' }, { status: 400 });
  }

  const update: Record<string, unknown> = { status };
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString();
    if (resolution_note) update.resolution_note = resolution_note;
  }

  const { error } = await supabaseAdmin
    .from('error_reports')
    .update(update)
    .eq('id', id);

  if (error) {
    console.error('[update-error-report] Supabase error:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
