/**
 * GET /api/plan/status?job_id=<uuid>
 *
 * Returns the current state of a plan_jobs row.
 * Rate limit: 600 per hour per IP.
 *
 * Auth: requires a valid dedrab_invite cookie AND the job must belong
 * to that invite code (invite_code column check).
 *
 * Response (200):
 *   {
 *     id:                    string
 *     planting_status:       string
 *     render_status:         string
 *     pdf_status:            string
 *     planting_error?:       string
 *     render_error?:         string
 *     pdf_error?:            string
 *     validated_suggestions?: unknown
 *     shopping_list?:        unknown
 *     render_url?:           string  (time-limited signed URL)
 *     pdf_url?:              string  (time-limited signed URL)
 *     created_at:            string
 *     updated_at:            string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireInvite, limitOr429, UUID_RE } from '@/lib/route-guards';
import { supabaseAdmin } from '@/lib/supabase-server';

const SIGNED_LINK_SECONDS = 3600; // 1 hour

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Rate limit
  const rateLimited = await limitOr429(req, 'plan-status', 600, 3600_000);
  if (rateLimited) return rateLimited;

  // Auth
  const inviteResult = await requireInvite(req);
  if (typeof inviteResult !== 'string') return inviteResult as NextResponse;
  const inviteCode = inviteResult;

  const jobId = req.nextUrl.searchParams.get('job_id');
  if (!jobId || !UUID_RE.test(jobId)) {
    return NextResponse.json({ error: 'Invalid or missing job_id' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('plan_jobs')
    .select(
      'id, planting_status, render_status, pdf_status, planting_error, render_error, pdf_error, ' +
      'shortlist_ids, validated_suggestions, shopping_list, render_path, pdf_path, created_at, updated_at',
    )
    .eq('id', jobId)
    .eq('invite_code', inviteCode)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const row = data as unknown as Record<string, unknown>;

  // Generate time-limited signed URLs for render and PDF if paths exist
  const result: Record<string, unknown> = { ...row };

  if (typeof row.render_path === 'string' && row.render_path) {
    const { data: signedData } = await supabaseAdmin.storage
      .from('pipeline-assets')
      .createSignedUrl(row.render_path, SIGNED_LINK_SECONDS);
    if (signedData?.signedUrl) {
      result.render_url = signedData.signedUrl;
    }
  }

  if (typeof row.pdf_path === 'string' && row.pdf_path) {
    const { data: signedData } = await supabaseAdmin.storage
      .from('pipeline-assets')
      .createSignedUrl(row.pdf_path, SIGNED_LINK_SECONDS);
    if (signedData?.signedUrl) {
      result.pdf_url = signedData.signedUrl;
    }
  }

  // Remove storage paths from response (callers use signed URLs)
  delete result.render_path;
  delete result.pdf_path;

  return NextResponse.json(result);
}
