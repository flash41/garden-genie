/**
 * POST /api/plan/create
 *
 * Creates a plan_jobs row and fires the "plan/start" Inngest event.
 *
 * Auth: requires a valid dedrab_invite cookie (checked via requireInvite).
 *
 * Body (JSON):
 *   width_metres    number   required
 *   depth_metres    number   required
 *   dominant_light  string   required  'full_sun' | 'part_shade' | 'shade'
 *   rhs_hardiness   string   required  'H1a'…'H7'
 *   style_tags      string[] optional  default []
 *   camera_facing   string   optional  default 'N'
 *
 * Response (201):
 *   { job_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireInvite } from '@/lib/route-guards';
import { supabaseAdmin } from '@/lib/supabase-server';
import { inngest } from '@/lib/inngest';

const LIGHT_VALUES = new Set(['full_sun', 'part_shade', 'shade']);
const RHS_VALUES = new Set(['H1a', 'H1b', 'H1c', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7']);
const FACING_VALUES = new Set(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth
  const inviteResult = await requireInvite(req);
  if (typeof inviteResult !== 'string') return inviteResult as NextResponse;
  const inviteCode = inviteResult;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const widthMetres  = Number(b.width_metres);
  const depthMetres  = Number(b.depth_metres);
  const dominantLight = String(b.dominant_light ?? '');
  const rhsHardiness  = String(b.rhs_hardiness ?? '');
  const styleTags    = Array.isArray(b.style_tags) ? (b.style_tags as unknown[]).map(String) : [];
  const cameraFacing = String(b.camera_facing ?? 'N');

  if (!isFinite(widthMetres) || widthMetres <= 0 || widthMetres > 100) {
    return NextResponse.json({ error: 'Invalid width_metres' }, { status: 400 });
  }
  if (!isFinite(depthMetres) || depthMetres <= 0 || depthMetres > 100) {
    return NextResponse.json({ error: 'Invalid depth_metres' }, { status: 400 });
  }
  if (!LIGHT_VALUES.has(dominantLight)) {
    return NextResponse.json({ error: 'Invalid dominant_light' }, { status: 400 });
  }
  if (!RHS_VALUES.has(rhsHardiness)) {
    return NextResponse.json({ error: 'Invalid rhs_hardiness' }, { status: 400 });
  }
  if (!FACING_VALUES.has(cameraFacing)) {
    return NextResponse.json({ error: 'Invalid camera_facing' }, { status: 400 });
  }

  // Create the plan_jobs row
  const { data, error } = await supabaseAdmin
    .from('plan_jobs')
    .insert({
      width_metres: widthMetres,
      depth_metres: depthMetres,
      dominant_light: dominantLight,
      rhs_hardiness: rhsHardiness,
      style_tags: styleTags,
      camera_facing: cameraFacing,
      invite_code: inviteCode,
      status: 'queued',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[plan/create] DB insert failed:', error?.message);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }

  const jobId: string = data.id;

  // Fire Inngest event
  try {
    await inngest.send({
      name: 'plan/start',
      data: {
        job_id: jobId,
        width_metres: widthMetres,
        depth_metres: depthMetres,
        dominant_light: dominantLight,
        rhs_hardiness: rhsHardiness,
        style_tags: styleTags,
        camera_facing: cameraFacing,
      },
    });
  } catch (err) {
    console.error('[plan/create] Inngest send failed:', err);
    // Don't fail the request — job row exists; user can still poll
  }

  return NextResponse.json({ job_id: jobId }, { status: 201 });
}
