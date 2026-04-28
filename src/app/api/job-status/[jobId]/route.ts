import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  // Read invite cookie from request
  const inviteCode = request.cookies.get('dedrab_invite')?.value;
  if (!inviteCode) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // Query pipeline_jobs
  const { data: job, error } = await supabaseAdmin
    .from('pipeline_jobs')
    .select(`
      id,
      status,
      design_json,
      render_url,
      aerial_url,
      fingerprint,
      control_points,
      g2_grid,
      validation_result,
      retried,
      detected_currency,
      error_message
    `)
    .eq('id', jobId)
    .eq('invite_code', inviteCode)
    .limit(1)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status === 'queued' || job.status === 'running') {
    return NextResponse.json({ status: job.status });
  }

  if (job.status === 'failed') {
    return NextResponse.json({ status: 'failed', error: job.error_message });
  }

  if (job.status === 'complete') {
    let renderUrl: string | null = null;
    let aerialUrl: string | null = null;

    if (job.render_url) {
      const { data: signedData } = await supabaseAdmin.storage
        .from('pipeline-assets')
        .createSignedUrl(job.render_url, 3600);
      renderUrl = signedData?.signedUrl ?? null;
    }

    if (job.aerial_url) {
      const { data: signedData } = await supabaseAdmin.storage
        .from('pipeline-assets')
        .createSignedUrl(job.aerial_url, 3600);
      aerialUrl = signedData?.signedUrl ?? null;
    }

    return NextResponse.json({
      status: 'complete',
      designJSON: job.design_json,
      renderUrl,
      aerialUrl,
      fingerprint: job.fingerprint,
      controlPoints: job.control_points,
      g2Grid: job.g2_grid,
      validationResult: job.validation_result,
      retried: job.retried,
      detectedCurrency: job.detected_currency,
    });
  }

  // Unknown status — return it as-is
  return NextResponse.json({ status: job.status });
}
