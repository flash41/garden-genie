import { inngest } from '@/lib/inngest';
import { supabaseAdmin } from '@/lib/supabase-server';

// Pipeline-health canary.
//
// Scheduled to fire every minute. Each invocation writes the current
// timestamp to the singleton `pipeline_health` row. An external Vercel
// cron checks the freshness of that row every 5 minutes and emails
// Steen if it has gone stale, catching silent outages of the Inngest
// function (e.g. Cloudflare WAF blocking /api/inngest, Inngest deploy
// sync failure, or any other reason the function stops being invoked).
//
// We do NOT alert from inside this function — if Inngest itself is
// down, this function won't run. The alert path lives in the external
// Vercel cron at /api/cron/heartbeat-check.

export const heartbeatFunction = inngest.createFunction(
  { id: 'pipeline-heartbeat', name: 'Pipeline Heartbeat', triggers: [{ cron: '* * * * *' }] },
  async ({ step }) => {
    return await step.run('write-heartbeat', async () => {
      const now = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from('pipeline_health')
        .upsert(
          {
            id: 'singleton',
            last_seen_at: now,
            consecutive_failures: 0, // success — clear any prior failure counter
            updated_at: now,
          },
          { onConflict: 'id' },
        );
      if (error) {
        console.error('[Heartbeat] upsert failed:', error.message);
        throw new Error(`Heartbeat upsert failed: ${error.message}`);
      }
      return { last_seen_at: now };
    });
  },
);
