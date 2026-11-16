/**
 * plan/start — Inngest function that runs the planting pipeline.
 *
 * Triggered by the event "plan/start" sent from /api/plan/create.
 * Steps:
 *   1. shortlist   — filter plants from fixture by hardiness + light + style
 *   2. generate    — call Gemini for planting suggestions
 *   3. validate    — pure validation of Gemini output (light + spacing + bounds)
 *   4. repair      — one model call for violations, then re-validate; drop anything still bad
 *   5. persist     — write shopping list + final results to plan_jobs row
 */

import { inngest } from '@/lib/inngest';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  shortlistPlants,
  buildPlantingPrompt,
  buildRepairPrompt,
  validateSuggestions,
  isViable,
  buildShoppingList,
} from '@/lib/planting';
import { generateSuggestions } from '@/lib/planting/generate';
import { buildSunGrid } from '@/lib/site-model/sun-grid';
import type { Compass } from '@/lib/site-model/sun-grid';
import plantsFixture from '@/data/plants-fixture.json';
import type { PlantRecord, SiteContext, PlantingSuggestion, ValidationIssue } from '@/lib/planting/types';

const plants = plantsFixture as PlantRecord[];

type PlanStartData = {
  job_id: string;
  width_metres: number;
  depth_metres: number;
  dominant_light: string;
  rhs_hardiness: string;
  style_tags: string[];
  camera_facing: string;
  hemisphere?: 'north' | 'south';
  boundary_heights?: { rear: number; front: number; left: number; right: number };
  location?: string;
  photo_path?: string | null;
};

async function setStatus(jobId: string, status: string) {
  await supabaseAdmin
    .from('plan_jobs')
    .update({ status })
    .eq('id', jobId);
}

export const planStartFunction = inngest.createFunction(
  { id: 'plan-start', name: 'Plan: Start', retries: 1, triggers: [{ event: 'plan/start' }] },
  async ({ event, step }) => {
    const {
      job_id,
      width_metres,
      depth_metres,
      dominant_light,
      rhs_hardiness,
      style_tags,
      camera_facing,
      hemisphere = 'north',
      boundary_heights,
      location,
      photo_path,
    } = event.data as PlanStartData;

    // Server-side sun grid build (never trust browser-sent grid)
    const sunGridResult = buildSunGrid(
      width_metres,
      depth_metres,
      camera_facing as Compass,
      hemisphere,
      boundary_heights,
    );

    const ctx: SiteContext = {
      widthMetres: width_metres,
      depthMetres: depth_metres,
      dominantLight: dominant_light as SiteContext['dominantLight'],
      rhsHardiness: rhs_hardiness as SiteContext['rhsHardiness'],
      styleTags: style_tags,
      cameraFacing: camera_facing,
      hemisphere,
      boundaryHeights: boundary_heights,
      sunGrid: sunGridResult.grid,
      location,
    };

    const plantMap = new Map(plants.map(p => [p.id, p]));

    try {
      // ── Step 1: shortlist ──────────────────────────────────────────────────
      const shortlist = await step.run('shortlist', async () => {
        await setStatus(job_id, 'generating');
        const sl = shortlistPlants(plants, ctx, 20);
        await supabaseAdmin
          .from('plan_jobs')
          .update({ shortlist_ids: sl.map(s => s.plant.id) })
          .eq('id', job_id);
        return sl;
      });

      // ── Step 2: generate ───────────────────────────────────────────────────
      const generateResult = await step.run('generate', async () => {
        const prompt = buildPlantingPrompt(shortlist, ctx);
        // Load the photo from storage INSIDE the step: image bytes must never
        // cross an Inngest step boundary (about 4 MB limit strands the job).
        let image: { mimeType: string; base64: string } | undefined;
        if (photo_path) {
          const { data: photo, error: photoError } = await supabaseAdmin.storage
            .from('pipeline-assets')
            .download(photo_path);
          if (photo && !photoError) {
            const ext = photo_path.split('.').pop()?.toLowerCase() ?? 'jpg';
            const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            image = { mimeType, base64: Buffer.from(await photo.arrayBuffer()).toString('base64') };
          } else {
            // A missing photo should not sink the plan: carry on from the site model alone.
            console.warn('[plan-start] photo download failed, continuing without it:', photoError?.message);
          }
        }
        return generateSuggestions(prompt, image);
      });

      // ── Step 3: validate ───────────────────────────────────────────────────
      const validationResult = await step.run('validate', async () => {
        await setStatus(job_id, 'validating');
        await supabaseAdmin
          .from('plan_jobs')
          .update({ raw_suggestions: generateResult.suggestions as unknown as Record<string, unknown>[] })
          .eq('id', job_id);
        const knownIds = new Set(shortlist.map(s => s.plant.id));
        return validateSuggestions(
          generateResult.suggestions,
          knownIds,
          width_metres,
          depth_metres,
          { sunGrid: sunGridResult.grid, plantMap },
        );
      });

      // ── Step 4: repair ─────────────────────────────────────────────────────
      const repairedSuggestions = await step.run('repair', async () => {
        await setStatus(job_id, 'repairing');

        // If already viable, skip repair
        if (isViable(validationResult) && validationResult.issues.length === 0) {
          return validationResult.valid;
        }

        // Build violation list for the repair model call
        const repairableIssues = validationResult.issues.filter(
          i => i.kind === 'wrong_light' || i.kind === 'too_close',
        );

        let repairSuggestions: PlantingSuggestion[] = [];

        if (repairableIssues.length > 0) {
          const violations = repairableIssues.map(i => {
            if (i.kind === 'wrong_light') {
              return {
                plant_id: i.plant_id,
                x: i.x,
                y: i.y,
                reason: `Light mismatch: cell is ${i.cell_light}, plant needs ${i.plant_light.join('/')}`,
              };
            }
            // too_close
            return {
              plant_id: i.plant_id,
              x: i.x,
              y: i.y,
              reason: `Too close to ${(i as { other_id: string }).other_id} (${(i as { distance: number }).distance}m, need ${(i as { min_distance: number }).min_distance}m)`,
            };
          });

          try {
            const repairPrompt = buildRepairPrompt(violations, shortlist, ctx);
            const repairResult = await generateSuggestions(repairPrompt);

            // Validate the repair suggestions too
            const knownIds = new Set(shortlist.map(s => s.plant.id));
            // Combine existing valid + repair candidates and re-validate spacing together
            const combined = [...validationResult.valid, ...repairResult.suggestions];
            const revalidated = validateSuggestions(
              combined,
              knownIds,
              width_metres,
              depth_metres,
              { sunGrid: sunGridResult.grid, plantMap },
            );
            return revalidated.valid;
          } catch {
            // Repair call failed; fall through to code-only cleanup
          }
        }

        // Code-only cleanup: keep the valid ones, drop anything still failing
        return validationResult.valid;
      });

      // ── Step 5: persist ────────────────────────────────────────────────────
      const persistResult = await step.run('persist', async () => {
        const shoppingList = buildShoppingList(repairedSuggestions, plantMap);

        await supabaseAdmin
          .from('plan_jobs')
          .update({
            planting_status: 'complete',
            validated_suggestions: repairedSuggestions as unknown as Record<string, unknown>[],
            shopping_list: shoppingList as unknown as Record<string, unknown>[],
          })
          .eq('id', job_id);

        return {
          job_id,
          suggestions_count: repairedSuggestions.length,
          shopping_items: shoppingList.length,
        };
      });

      // ── Step 6: kick off render + PDF ──────────────────────────────────────
      await step.sendEvent('trigger-render', {
        name: 'garden-render/start',
        data: { job_id },
      });

      await step.sendEvent('trigger-pdf', {
        name: 'plan-pdf/start',
        data: { job_id },
      });

      return persistResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from('plan_jobs')
        .update({ planting_status: 'failed', planting_error: message })
        .eq('id', job_id);
      throw err; // re-throw so Inngest marks the run as failed
    }
  },
);
