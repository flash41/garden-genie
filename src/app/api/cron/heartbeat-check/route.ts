import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// External canary watcher. Hit by Vercel cron daily at 09:00 UTC.
//
// Reads the singleton `pipeline_health` row, decides whether the Inngest
// heartbeat is fresh, and emails Steen on the FIRST detection of a stale
// heartbeat. Subsequent alerts are suppressed for ALERT_COOLDOWN_MS to
// avoid an alert storm. Counter is reset on recovery.

const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000;     // 4 hours
const ALERT_COOLDOWN_MS  = 30 * 60 * 1000;         // 30 min
const ALERT_RECIPIENT    = 'steen.gordon@gmail.com';

function alertEmailHtml(params: {
  ageSeconds: number;
  lastSeen: string;
  consecutiveFailures: number;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family:Georgia,serif;background:#F4EFE4;padding:40px;color:#2C1A0E;">
  <table width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#fff;border-top:3px solid #b8962e;padding:32px;">
    <tr><td>
      <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#b91c1c;margin:0 0 8px;">Pipeline Down</p>
      <h1 style="font-size:24px;color:#0a3d2b;margin:0 0 20px;">Dedrab Inngest heartbeat is stale</h1>
      <p style="line-height:1.7;">The Inngest pipeline heartbeat hasn't fired in <strong>${params.ageSeconds}s</strong>. Threshold is 4h (14400s).</p>
      <table cellpadding="6" cellspacing="0" style="font-size:14px;margin:16px 0;border-collapse:collapse;">
        <tr><td style="color:#8a7e6e;">Last beat</td><td style="font-family:monospace;">${params.lastSeen}</td></tr>
        <tr><td style="color:#8a7e6e;">Consecutive misses</td><td style="font-family:monospace;">${params.consecutiveFailures}</td></tr>
      </table>
      <p style="line-height:1.7;font-size:14px;">Most likely causes, in order: (1) Inngest function unsynced after a deploy — open Inngest dashboard and resync; (2) Cloudflare WAF mitigating /api/inngest again — check Security → Events; (3) Vercel function deployment broken — check Vercel logs.</p>
      <p style="line-height:1.7;font-size:14px;">New paid submissions are being refused at /api/redesign until the heartbeat recovers.</p>
      <p style="margin:24px 0 0;font-size:12px;color:#8a7e6e;">You will not receive another alert for this outage for 30 minutes. The counter resets when the heartbeat recovers.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendAlertEmail(params: {
  ageSeconds: number;
  lastSeen: string;
  consecutiveFailures: number;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[heartbeat-check] RESEND_API_KEY missing — cannot send alert');
    return false;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'Dedrab Canary <noreply@dedrab.com>',
      to: [ALERT_RECIPIENT],
      subject: `[Dedrab] Pipeline heartbeat stale (${params.ageSeconds}s)`,
      html: alertEmailHtml(params),
    });
    if (error) {
      console.error('[heartbeat-check] Resend error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[heartbeat-check] Send threw:', err?.message);
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>. Reject anyone
  // else so this endpoint can't be abused for alert-spamming.
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (expected && auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: row, error: readErr } = await supabaseAdmin
    .from('pipeline_health')
    .select('last_seen_at, last_alert_at, consecutive_failures')
    .eq('id', 'singleton')
    .maybeSingle();

  if (readErr || !row?.last_seen_at) {
    console.error('[heartbeat-check] could not read pipeline_health row:', readErr?.message);
    return NextResponse.json({ checked: false, error: 'read_failed' }, { status: 500 });
  }

  const now = Date.now();
  const lastSeen = new Date(row.last_seen_at).getTime();
  const lastAlertAt = row.last_alert_at ? new Date(row.last_alert_at).getTime() : 0;
  const ageMs = now - lastSeen;
  const stale = ageMs > STALE_THRESHOLD_MS;

  if (!stale) {
    // Heartbeat fresh — clear consecutive_failures counter if it was set.
    if ((row.consecutive_failures || 0) > 0) {
      await supabaseAdmin
        .from('pipeline_health')
        .update({ consecutive_failures: 0, last_alert_at: null })
        .eq('id', 'singleton');
    }
    return NextResponse.json({
      checked: true,
      healthy: true,
      age_seconds: Math.round(ageMs / 1000),
    });
  }

  // Stale — increment failure counter, send alert if outside cooldown.
  const newFailures = (row.consecutive_failures || 0) + 1;
  const cooldownElapsed = !lastAlertAt || (now - lastAlertAt) > ALERT_COOLDOWN_MS;
  let alertSent = false;

  if (cooldownElapsed) {
    alertSent = await sendAlertEmail({
      ageSeconds: Math.round(ageMs / 1000),
      lastSeen: row.last_seen_at,
      consecutiveFailures: newFailures,
    });
  }

  await supabaseAdmin
    .from('pipeline_health')
    .update({
      consecutive_failures: newFailures,
      last_alert_at: alertSent ? new Date().toISOString() : row.last_alert_at,
    })
    .eq('id', 'singleton');

  return NextResponse.json({
    checked: true,
    healthy: false,
    age_seconds: Math.round(ageMs / 1000),
    consecutive_failures: newFailures,
    alert_sent: alertSent,
    alert_skipped_reason: alertSent ? null : (cooldownElapsed ? 'send_failed' : 'within_cooldown'),
  });
}
