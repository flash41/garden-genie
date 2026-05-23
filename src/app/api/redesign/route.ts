import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { rateLimit, callerIp, purgeOldRateLimits } from '@/lib/rate-limit';
import { validateImage } from '@/lib/validate-image';
import { inngest } from '@/lib/inngest';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function currencyFromCountry(countryCode: string | null): string {
  if (!countryCode) return 'EUR';
  const c = countryCode.toUpperCase();
  if (c === 'GB') return 'GBP';
  if (c === 'US' || c === 'CA') return 'USD';
  if (c === 'AU' || c === 'NZ') return 'AUD';
  const eur = ['IE','DE','FR','ES','IT','NL','BE','AT','PT',
    'FI','SE','DK','NO','PL','CZ','HU','RO','GR','HR','SK',
    'SI','EE','LV','LT','LU','MT','CY','BG'];
  if (eur.includes(c)) return 'EUR';
  return 'EUR';
}

export async function POST(request: NextRequest) {
  // a. Check GOOGLE_API_KEY present
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_API_KEY is not set' }, { status: 500 });
  }

  // b. Per-IP rate limit
  const ipForLimit = callerIp(request);
  const ipRl = await rateLimit({
    key: `redesign:ip:${ipForLimit}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many requests. Please wait and try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((ipRl.resetAt.getTime() - Date.now()) / 1000))),
          'X-RateLimit-Limit': String(ipRl.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': ipRl.resetAt.toISOString(),
        },
      }
    );
  }
  purgeOldRateLimits();

  // c. Check invite cookie present
  const inviteCode = request.cookies.get('dedrab_invite')?.value;
  if (!inviteCode) {
    return NextResponse.json({ error: 'unauthorised', message: 'No invite code found. Please access the app via your invite link.' }, { status: 401 });
  }

  // d. Check invite renders_used < max_renders
  const { data: inviteData } = await supabaseAdmin
    .from('invite_codes')
    .select('renders_used, max_renders')
    .eq('code', inviteCode)
    .maybeSingle();

  if (!inviteData || inviteData.renders_used >= inviteData.max_renders) {
    return NextResponse.json({ error: 'limit_reached', message: 'You have used all of your available renders.' }, { status: 402 });
  }
  const currentRendersUsed: number = inviteData.renders_used;

  // e. Check 24h pipeline_jobs rate limit
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabaseAdmin
    .from('pipeline_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('invite_code', inviteCode)
    .gte('created_at', windowStart)
    .neq('status', 'failed');

  if ((recentCount || 0) >= 10) {
    return NextResponse.json({ error: 'rate_limited', message: 'You have reached the maximum of 10 renders in 24 hours. Please try again tomorrow.' }, { status: 429 });
  }

  // f. Parse request body
  let body: {
    originalImageBase64?: string;
    originalImageMimeType?: string;
    style?: string;
    orientation?: string;
    clientName?: string;
    turnstileToken?: string;
    hardinessZone?: string | null;
    transformationLevel?: number;
    userEmail?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { originalImageBase64, originalImageMimeType, style, orientation, clientName, turnstileToken, hardinessZone, transformationLevel: rawTransformationLevel, userEmail } = body;

  // Normalise email — used by the email-plan-ready Inngest step to deliver
  // the finished plan if the user closes the tab mid-render.
  const recipientEmail = (userEmail && /.+@.+\..+/.test(userEmail.trim()))
    ? userEmail.trim().toLowerCase()
    : null;

  // g. Validate Turnstile
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !turnstileSecret) {
    console.error('[redesign] TURNSTILE_SECRET_KEY missing in production — blocking request');
    return NextResponse.json({ error: 'Security check misconfigured.' }, { status: 500 });
  }
  if (turnstileSecret) {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: turnstileSecret, response: turnstileToken || '' }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 403 });
    }
  }

  if (!originalImageBase64 || !style) {
    return NextResponse.json({ error: 'Missing required fields: originalImageBase64, style' }, { status: 400 });
  }

  // h. Validate image
  const mimeForValidation = (originalImageMimeType || 'image/jpeg');
  const base64ForValidation = originalImageBase64.includes(',')
    ? originalImageBase64
    : `data:${mimeForValidation};base64,${originalImageBase64}`;
  const imgValidation = validateImage(base64ForValidation);
  if (!imgValidation.valid) {
    return NextResponse.json({ error: imgValidation.message }, { status: 400 });
  }

  const effectiveMimeType = originalImageMimeType || 'image/jpeg';
  const effectiveOrientation = orientation || 'N';
  const effectiveClientName = clientName || 'Private Client';
  const creativityLevel: number = typeof rawTransformationLevel === 'number'
    ? Math.max(1, Math.min(5, Math.round(rawTransformationLevel)))
    : 3;

  // i. Geo-lookup
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0';
  let region = 'temperate Western Europe';
  let country = 'Ireland';
  try {
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,lat,lon`);
    const geo = await geoRes.json();
    if (geo.country) {
      country = geo.country;
      region = `${geo.regionName}, ${geo.country} (lat: ${geo.lat}, lon: ${geo.lon})`;
    }
  } catch {
    console.log('Geo lookup failed, using default region');
  }

  const vercelCountry = request.headers.get('x-vercel-ip-country');
  if (vercelCountry) country = vercelCountry;

  const effectiveCurrency = currencyFromCountry(country);

  // i.5. Pipeline-health circuit breaker — refuse new submissions when the
  // Inngest heartbeat is stale. Prevents the user from sitting on the
  // loading screen waiting for a render that will never come. Threshold
  // is wider than the alert threshold (10 min vs 5 min) so a single
  // missed beat doesn't trip the breaker.
  try {
    const { data: health } = await supabaseAdmin
      .from('pipeline_health')
      .select('last_seen_at')
      .eq('id', 'singleton')
      .maybeSingle();
    const lastSeen = health?.last_seen_at ? new Date(health.last_seen_at).getTime() : 0;
    if (!lastSeen || (Date.now() - lastSeen) > 10 * 60 * 1000) {
      console.warn('[redesign] Refusing submission — pipeline heartbeat stale');
      return NextResponse.json(
        {
          error: 'pipeline_unavailable',
          message:
            "Our garden plan service is temporarily unavailable while we restore it. " +
            "Please try again in a few minutes — your invite code has not been used.",
        },
        { status: 503 },
      );
    }
  } catch (err: any) {
    // If the health check itself throws, log but don't block — failing closed
    // here would punish users for an issue unrelated to the pipeline.
    console.error('[redesign] Heartbeat check failed (allowing submission):', err?.message);
  }

  // j. Upload original image to Supabase Storage
  const base64Data = originalImageBase64.includes(',') ? originalImageBase64.split(',')[1] : originalImageBase64;
  const imageBuffer = Buffer.from(base64Data, 'base64');
  const storagePath = `${inviteCode}/${Date.now()}/original.jpg`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('pipeline-assets')
    .upload(storagePath, imageBuffer, {
      contentType: effectiveMimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error('[redesign] Image upload failed:', uploadError.message);
    return NextResponse.json({ error: 'Failed to upload image. Please try again.' }, { status: 500 });
  }

  // k. Insert pipeline_jobs record
  let jobId: string | null = null;
  const { data: jobData, error: jobError } = await supabaseAdmin
    .from('pipeline_jobs')
    .insert({
      invite_code: inviteCode,
      status: 'queued',
      input_storage_path: storagePath,
      design_lang: style,
      country,
      recipient_email: recipientEmail,
      design_style: style,
      hardiness_zone: hardinessZone || null,
    })
    .select('id')
    .single();

  if (jobError || !jobData) {
    console.error('[redesign] Job insert failed:', jobError?.message);
    return NextResponse.json({ error: 'Failed to create pipeline job. Please try again.' }, { status: 500 });
  }
  jobId = jobData.id;

  // l. Fire Inngest event
  try {
    await inngest.send({
      name: 'pipeline/start',
      data: {
        jobId,
        inviteCode,
        inputStoragePath: storagePath,
        originalMimeType: effectiveMimeType,
        style,
        orientation: effectiveOrientation,
        clientName: effectiveClientName,
        region,
        country,
        effectiveCurrency,
        creativityLevel,
        hardinessZone: hardinessZone || null,
        currentRendersUsed,
        recipientEmail,
      },
    });
  } catch (err: any) {
    console.error('[redesign] Inngest send failed — full error:', JSON.stringify({
      message: err?.message,
      name: err?.name,
      status: (err as any)?.status,
      eventKeyPresent: !!(process.env.INNGEST_EVENT_KEY),
      eventKeyPrefix: process.env.INNGEST_EVENT_KEY?.slice(0, 8) ?? 'MISSING',
    }));
    if (jobId) {
      await supabaseAdmin.from('pipeline_jobs').update({ status: 'failed' }).eq('id', jobId);
    }
    return NextResponse.json({ error: 'Failed to queue pipeline job. Please try again.' }, { status: 500 });
  }

  // m. Return 202 + jobId
  return NextResponse.json({ jobId }, { status: 202 });
}
