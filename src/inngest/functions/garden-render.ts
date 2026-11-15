/**
 * garden-render/start — Inngest function that generates a mature-garden render
 * using the original photo plus the finished planting plan.
 *
 * Steps:
 *   1. fetch-job     — load the plan and photo path
 *   2. render-image  — ONE image model call (Gemini)
 *   3. persist       — write render_path + render_status to plan_jobs
 *
 * Triggered by: "garden-render/start"
 * Data: { job_id: string }
 */

import { inngest } from '@/lib/inngest';
import { supabaseAdmin } from '@/lib/supabase-server';
import { sendPlanReadyEmail } from '@/lib/plan-email';
import type { PlantingSuggestion, ShoppingItem } from '@/lib/planting/types';

const RENDER_MODEL = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.0-flash-exp';
const TIMEOUT_MS = 120_000;

async function trySendPlanEmail(jobId: string): Promise<void> {
  try {
    const { data } = await supabaseAdmin
      .from('plan_jobs')
      .select('recipient_email, invite_code')
      .eq('id', jobId)
      .single();

    const email = (data as Record<string, unknown> | null)?.recipient_email;
    if (typeof email !== 'string' || !email) return; // no email on record, skip

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dedrab.com').replace(/\/+$/, '');
    const resumeUrl = `${baseUrl}/lab/plan?job_id=${encodeURIComponent(jobId)}`;

    await sendPlanReadyEmail({
      to: email,
      planTitle: 'Your Garden Plan',
      resumeUrl,
    });
  } catch {
    // Email failure must never block the pipeline
  }
}

export const gardenRenderFunction = inngest.createFunction(
  {
    id: 'garden-render',
    name: 'Garden Render: Start',
    retries: 2,
    triggers: [{ event: 'garden-render/start' }],
    onFailure: async ({ error, event }) => {
      const jobId = (event.data as { event: { data: { job_id: string } } }).event.data.job_id;
      if (jobId) {
        await supabaseAdmin
          .from('plan_jobs')
          .update({
            render_status: 'failed',
            render_error: error.message,
          })
          .eq('id', jobId);
        // Send plan-ready email even if render failed (plan is still valid)
        await trySendPlanEmail(jobId);
      }
    },
  },
  async ({ event, step }) => {
    const { job_id } = event.data as { job_id: string };

    // Mark running
    await step.run('mark-render-running', async () => {
      await supabaseAdmin
        .from('plan_jobs')
        .update({ render_status: 'running' })
        .eq('id', job_id);
    });

    // ── Step 1: fetch job ────────────────────────────────────────────────────
    const jobData = await step.run('fetch-job', async () => {
      const { data, error } = await supabaseAdmin
        .from('plan_jobs')
        .select(
          'id, planting_status, photo_path, validated_suggestions, shopping_list, width_metres, depth_metres',
        )
        .eq('id', job_id)
        .single();

      if (error || !data) throw new Error(`Job ${job_id} not found`);
      if ((data as { planting_status: string }).planting_status !== 'complete') {
        throw new Error(`Job ${job_id} planting not complete`);
      }

      return data as {
        id: string;
        photo_path: string | null;
        validated_suggestions: PlantingSuggestion[];
        shopping_list: ShoppingItem[];
        width_metres: number;
        depth_metres: number;
      };
    });

    // ── Step 2: render image ─────────────────────────────────────────────────
    const renderPath = await step.run('render-image', async () => {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY is not set');

      if (!jobData.photo_path) {
        throw new Error('No photo uploaded for this job; cannot generate render');
      }

      // Download the original photo from storage
      const { data: photoData, error: photoError } = await supabaseAdmin.storage
        .from('pipeline-assets')
        .download(jobData.photo_path);

      if (photoError || !photoData) {
        throw new Error(`Failed to download photo: ${photoError?.message}`);
      }

      const photoBuffer = Buffer.from(await photoData.arrayBuffer());
      const photoBase64 = photoBuffer.toString('base64');
      // Detect mime from extension
      const ext = jobData.photo_path.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      const mimeType = mimeMap[ext] ?? 'image/jpeg';

      // Build a text summary of the plan for the image model
      const plantSummary = (jobData.shopping_list ?? [])
        .map((item: ShoppingItem) => `${item.common_name} (${item.botanical_name}) x${item.quantity}`)
        .join(', ');

      const prompt = `This photo shows a garden that is ${jobData.width_metres}m wide and ${jobData.depth_metres}m deep. ` +
        `The following plants have been added to this garden: ${plantSummary}. ` +
        `Generate an image showing this same garden from the same camera position ` +
        `with all the listed plants matured and thriving, as it would look in 3-5 years. ` +
        `Keep every existing structure (walls, fences, paths, buildings) exactly as they are. ` +
        `Do not add any structures, furniture, or features that are not in the original photo. ` +
        `Do not add any text, labels, grid lines, or annotations to the image.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${RENDER_MODEL}:generateContent`;

      const body = {
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType,
                data: photoBase64,
              },
            },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          temperature: 0.4,
        },
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Gemini render ${res.status}: ${text.slice(0, 300)}`);
      }

      const json = await res.json();
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data);

      if (!imagePart?.inlineData?.data) {
        throw new Error('Gemini did not return an image in the response');
      }

      // Save image to storage (never return base64 from a step)
      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const renderStoragePath = `render-${job_id}.png`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('pipeline-assets')
        .upload(renderStoragePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) throw new Error(`Render upload failed: ${uploadError.message}`);

      return renderStoragePath;
    });

    // ── Step 3: persist ──────────────────────────────────────────────────────
    await step.run('persist-render-path', async () => {
      await supabaseAdmin
        .from('plan_jobs')
        .update({ render_path: renderPath, render_status: 'complete' })
        .eq('id', job_id);
    });

    // ── Step 4: send plan-ready email ────────────────────────────────────────
    await step.run('send-email', async () => {
      await trySendPlanEmail(job_id);
    });

    return { job_id, render_path: renderPath };
  },
);
