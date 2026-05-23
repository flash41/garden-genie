import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Public health-check endpoint. Returns 200 when the Inngest pipeline
// heartbeat is fresh, 503 when it has gone stale (>5 min since last beat).
// Intended for external monitors (UptimeRobot, BetterStack, etc.) and
// for the internal Vercel cron at /api/cron/heartbeat-check.
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('pipeline_health')
    .select('last_seen_at, last_alert_at, consecutive_failures')
    .eq('id', 'singleton')
    .maybeSingle();

  if (error || !data?.last_seen_at) {
    return NextResponse.json(
      { healthy: false, reason: error?.message || 'no_heartbeat_row' },
      { status: 503 },
    );
  }

  const lastSeen = new Date(data.last_seen_at).getTime();
  const ageMs = Date.now() - lastSeen;
  const stale = ageMs > STALE_THRESHOLD_MS;

  return NextResponse.json(
    {
      healthy: !stale,
      last_seen_at: data.last_seen_at,
      age_seconds: Math.round(ageMs / 1000),
      threshold_seconds: Math.round(STALE_THRESHOLD_MS / 1000),
    },
    { status: stale ? 503 : 200 },
  );
}
