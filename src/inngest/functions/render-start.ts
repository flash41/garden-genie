/**
 * render/start — Inngest function that generates a PDF from a completed plan job.
 *
 * Steps:
 *   1. fetch-job   — load validated_suggestions, shopping_list, dimensions from plan_jobs
 *   2. render-pdf  — generate PDF via @react-pdf/renderer (server-side, no browser)
 *   3. upload-pdf  — upload to Supabase Storage pdfs bucket
 *   4. persist     — write pdf_url back to plan_jobs row
 *
 * Triggered by: "render/start"
 * Data: { job_id: string }
 */

import React from 'react';
import { inngest } from '@/lib/inngest';
import { supabaseAdmin } from '@/lib/supabase-server';
import { PlanDocument } from '@/components/plan/pdf/PlanDocument';
import type { PlantPlacement } from '@/components/plan/planTypes';
import type { PlantingSuggestion, ShoppingItem } from '@/lib/planting/types';
import plantsFixture from '@/data/plants-fixture.json';
import type { PlantRecord } from '@/lib/planting/types';

const plants = plantsFixture as PlantRecord[];

function buildPlacements(
  suggestions: PlantingSuggestion[],
  shoppingList: ShoppingItem[],
): PlantPlacement[] {
  const nameMap = new Map(shoppingList.map(s => [s.plant_id, s.common_name]));
  const numberMap = new Map<string, number>();
  let next = 1;
  for (const s of suggestions) {
    if (!numberMap.has(s.plant_id)) numberMap.set(s.plant_id, next++);
  }
  const plantMap = new Map(plants.map(p => [p.id, p]));

  return suggestions.map(s => ({
    number: numberMap.get(s.plant_id) ?? 1,
    name: nameMap.get(s.plant_id) ?? s.plant_id,
    quantity: s.quantity,
    xMetres: s.x_metres,
    yMetres: s.y_metres,
    spreadMetres: plantMap.get(s.plant_id)?.spread_m ?? 0.5,
    light: 'full_sun' as const,
  }));
}

export const renderStartFunction = inngest.createFunction(
  { id: 'render-start', name: 'Render: Start', retries: 1, triggers: [{ event: 'render/start' }] },
  async ({ event, step }) => {
    const { job_id } = event.data as { job_id: string };

    // ── Step 1: fetch job ─────────────────────────────────────────────────────
    const jobData = await step.run('fetch-job', async () => {
      const { data, error } = await supabaseAdmin
        .from('plan_jobs')
        .select(
          'id, status, width_metres, depth_metres, camera_facing, validated_suggestions, shopping_list, created_at',
        )
        .eq('id', job_id)
        .single();

      if (error || !data) throw new Error(`Job ${job_id} not found`);
      if ((data as { status: string }).status !== 'done') {
        throw new Error(`Job ${job_id} is not done (status: ${(data as { status: string }).status})`);
      }
      return data as {
        id: string;
        status: string;
        width_metres: number;
        depth_metres: number;
        camera_facing: string;
        validated_suggestions: PlantingSuggestion[];
        shopping_list: ShoppingItem[];
        created_at: string;
      };
    });

    // ── Step 2: render PDF ────────────────────────────────────────────────────
    const pdfBuffer = await step.run('render-pdf', async () => {
      const placements = buildPlacements(
        jobData.validated_suggestions ?? [],
        jobData.shopping_list ?? [],
      );

      const doc = React.createElement(PlanDocument, {
        widthMetres: jobData.width_metres,
        depthMetres: jobData.depth_metres,
        plants: placements,
        shoppingList: jobData.shopping_list ?? [],
        cameraFacing: jobData.camera_facing,
        seed: 42,
        generatedAt: jobData.created_at,
      });

      // Dynamic import keeps @react-pdf/renderer (pure ESM) out of the
      // module graph at parse time — it loads only when this step runs.
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const buffer = await (renderToBuffer as (doc: React.ReactElement) => Promise<Buffer>)(doc);
      // Return as base64 — Inngest serialises step outputs as JSON
      return buffer.toString('base64');
    });

    // ── Step 3: upload PDF ────────────────────────────────────────────────────
    const pdfUrl = await step.run('upload-pdf', async () => {
      const pdfBytes = Buffer.from(pdfBuffer, 'base64');
      const storagePath = `plan-${job_id}.pdf`;

      const { error } = await supabaseAdmin.storage
        .from('pdfs')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (error) throw new Error(`PDF upload failed: ${error.message}`);

      const { data: urlData } = supabaseAdmin.storage
        .from('pdfs')
        .getPublicUrl(storagePath);

      return urlData.publicUrl;
    });

    // ── Step 4: persist ───────────────────────────────────────────────────────
    return await step.run('persist-pdf-url', async () => {
      await supabaseAdmin
        .from('plan_jobs')
        .update({ pdf_url: pdfUrl })
        .eq('id', job_id);

      return { job_id, pdf_url: pdfUrl };
    });
  },
);
