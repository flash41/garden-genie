/**
 * render/start — Inngest function that (optionally) generates a rendered asset
 * from a completed plan job.
 *
 * In Stage 6 this is a no-op stub that records the render request and marks
 * itself done immediately. Stage 7 (PDF generation) will fill in the body.
 *
 * Triggered by: "render/start"
 * Data: { job_id: string }
 */

import { inngest } from '@/lib/inngest';
import { supabaseAdmin } from '@/lib/supabase-server';

export const renderStartFunction = inngest.createFunction(
  { id: 'render-start', name: 'Render: Start', retries: 1, triggers: [{ event: 'render/start' }] },
  async ({ event, step }) => {
    const { job_id } = event.data as { job_id: string };

    return await step.run('noop-render', async () => {
      // Verify the job exists and is done before rendering
      const { data, error } = await supabaseAdmin
        .from('plan_jobs')
        .select('id, status')
        .eq('id', job_id)
        .single();

      if (error || !data) {
        throw new Error(`Job ${job_id} not found`);
      }
      if ((data as { status: string }).status !== 'done') {
        throw new Error(`Job ${job_id} is not done (status: ${(data as { status: string }).status})`);
      }

      // Stage 7 will add PDF generation here.
      return { job_id, rendered: false, reason: 'pdf_not_yet_implemented' };
    });
  },
);
