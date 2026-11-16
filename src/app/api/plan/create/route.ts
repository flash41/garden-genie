/**
 * POST /api/plan/create
 *
 * Creates a plan_jobs row and fires the "plan/start" Inngest event.
 *
 * Auth: requires a valid dedrab_invite cookie (checked via requireInvite).
 * Rate limit: 10 per hour per IP.
 *
 * Body (JSON):
 *   width_metres      number   required
 *   depth_metres      number   required
 *   dominant_light    string   required  'full_sun' | 'part_shade' | 'shade'
 *   rhs_hardiness     string   required  'H1a'...'H7'
 *   style_tags        string[] optional  default []
 *   camera_facing     string   optional  default 'N'
 *   hemisphere        string   optional  'north' | 'south', default 'north'
 *   boundary_heights  object   optional  { rear, front, left, right } in metres
 *   location          string   optional  typed location for prompt context
 *
 * Response (201):
 *   { job_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireInvite, limitOr429, isValidEmail } from '@/lib/route-guards';
import { validateImage } from '@/lib/validate-image';
import { supabaseAdmin } from '@/lib/supabase-server';
import { inngest } from '@/lib/inngest';

const LIGHT_VALUES = new Set(['full_sun', 'part_shade', 'shade']);
const RHS_VALUES = new Set(['H1a', 'H1b', 'H1c', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7']);
const FACING_VALUES = new Set(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
const HEMISPHERE_VALUES = new Set(['north', 'south']);

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limit
  const rateLimited = await limitOr429(req, 'plan-create', 10, 3600_000);
  if (rateLimited) return rateLimited;

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
  const hemisphere   = String(b.hemisphere ?? 'north');
  const location     = typeof b.location === 'string' ? b.location.slice(0, 200) : undefined;

  // Parse boundary heights if provided
  let boundaryHeights: { rear: number; front: number; left: number; right: number } | undefined;
  if (b.boundary_heights && typeof b.boundary_heights === 'object') {
    const bh = b.boundary_heights as Record<string, unknown>;
    const rear  = Number(bh.rear  ?? 1.8);
    const front = Number(bh.front ?? 1.8);
    const left  = Number(bh.left  ?? 1.8);
    const right = Number(bh.right ?? 1.8);
    if ([rear, front, left, right].every(v => isFinite(v) && v >= 0 && v <= 20)) {
      boundaryHeights = { rear, front, left, right };
    }
  }

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
  if (!HEMISPHERE_VALUES.has(hemisphere)) {
    return NextResponse.json({ error: 'Invalid hemisphere' }, { status: 400 });
  }

  // Optional email for the plan-ready message
  let recipientEmail: string | null = null;
  if (b.recipient_email !== undefined && b.recipient_email !== null && b.recipient_email !== '') {
    const candidate = typeof b.recipient_email === 'string' ? b.recipient_email.trim().toLowerCase() : b.recipient_email;
    if (!isValidEmail(candidate)) {
      return NextResponse.json({ error: 'Invalid recipient_email' }, { status: 400 });
    }
    recipientEmail = candidate;
  }

  // Optional garden photo (base64 data URL). Needed for the mature-garden render
  // and lets the planting model see existing features. Stored in the private
  // pipeline-assets bucket; only the path is kept on the job.
  let photoPath: string | null = null;
  if (b.photo_base64 !== undefined && b.photo_base64 !== null && b.photo_base64 !== '') {
    const img = validateImage(b.photo_base64);
    if (!img.valid || !img.base64Data || !img.mimeType) {
      return NextResponse.json({ error: img.message ?? 'Invalid photo' }, { status: 400 });
    }
    const ext = img.mimeType === 'image/png' ? 'png' : img.mimeType === 'image/webp' ? 'webp' : 'jpg';
    const path = `${inviteCode}/plan-${crypto.randomUUID()}/original.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('pipeline-assets')
      .upload(path, Buffer.from(img.base64Data, 'base64'), { contentType: img.mimeType, upsert: false });
    if (uploadError) {
      console.error('[plan/create] photo upload failed:', uploadError.message);
      return NextResponse.json({ error: 'Failed to store photo' }, { status: 500 });
    }
    photoPath = path;
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
      hemisphere,
      boundary_heights: boundaryHeights ?? null,
      location: location ?? null,
      photo_path: photoPath,
      recipient_email: recipientEmail,
      invite_code: inviteCode,
      planting_status: 'queued',
      render_status: 'queued',
      pdf_status: 'queued',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[plan/create] DB insert failed:', error?.message);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }

  const jobId: string = data.id;

  // Fire Inngest event -- if this fails, mark the job failed so it is never stuck at queued
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
        hemisphere,
        boundary_heights: boundaryHeights,
        location,
        photo_path: photoPath,
      },
    });
  } catch (err) {
    console.error('[plan/create] Inngest send failed:', err);
    await supabaseAdmin
      .from('plan_jobs')
      .update({ planting_status: 'failed', planting_error: 'Failed to start pipeline' })
      .eq('id', jobId);
    return NextResponse.json({ error: 'Failed to start pipeline' }, { status: 502 });
  }

  return NextResponse.json({ job_id: jobId }, { status: 201 });
}
