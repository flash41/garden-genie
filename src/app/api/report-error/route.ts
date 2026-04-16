import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { referenceNumber, email, errorType, userDescription, logSnippet, sessionId } = body as {
    referenceNumber?: string;
    email?: string;
    errorType?: string;
    userDescription?: string;
    logSnippet?: string;
    sessionId?: string;
  };

  if (!errorType || !userDescription) {
    return NextResponse.json(
      { success: false, error: 'errorType and userDescription are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('error_reports')
    .insert({
      reference_number: referenceNumber || null,
      email: email || null,
      error_type: errorType,
      user_description: userDescription,
      log_snippet: logSnippet || null,
      session_id: sessionId || null,
      submitted_at: new Date().toISOString(),
      status: 'new',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[report-error] Supabase insert error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not save your report. Please email support@dedrab.com directly.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id: data.id });
}
