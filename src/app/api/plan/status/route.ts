/**
 * GET /api/plan/status?job_id=<uuid>
 *
 * Returns the current state of a plan_jobs row.
 *
 * Auth: requires a valid dedrab_invite cookie AND the job must belong
 * to that invite code (invite_code column check).
 *
 * Response (200):
 *   {
 *     id:                    string
 *     status:                string
 *     error_message?:        string
 *     shortlist_ids?:        string[]
 *     raw_suggestions?:      unknown
 *     validated_suggestions?: unknown
 *     shopping_list?:        unknown
 *     created_at:            string
 *     updated_at:            string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireInvite } from '@/lib/route-guards';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Auth
  const inviteResult = await requireInvite(req);
  if (typeof inviteResult !== 'string') return inviteResult as NextResponse;
  const inviteCode = inviteResult;

  const jobId = req.nextUrl.searchParams.get('job_id');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('plan_jobs')
    .select(
      'id, status, error_message, shortlist_ids, raw_suggestions, validated_suggestions, shopping_list, created_at, updated_at',
    )
    .eq('id', jobId)
    .eq('invite_code', inviteCode)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
