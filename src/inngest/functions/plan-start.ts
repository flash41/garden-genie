/**
 * plan/start — Inngest function that runs the planting pipeline.
 *
 * Triggered by the event "plan/start" sent from /api/plan/create.
 * Steps:
 *   1. shortlist   — filter plants from fixture by hardiness + light + style
 *   2. generate    — call Gemini for planting suggestions
 *   3. validate    — pure validation of Gemini output
 *   4. repair      — one repair round for any invalid entries
 *   5. persist     — write shopping list + final results to plan_jobs row
 */

import { inngest } from '@/lib/inngest';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  shortlistPlants,
  buildPlantingPrompt,
  validateSuggestions,
  isViable,
  repairSuggestions,
  buildShoppingList,
} from '@/lib/planting';
import { generateSuggestions } from '@/lib/planting/generate';
import plantsFixture from '@/data/plants-fixture.json';
import type { PlantRecord, SiteContext } from '@/lib/planting/types';

const plants = plantsFixture as PlantRecord[];

type PlanStartData = {
  job_id: string;
  width_metres: number;
  depth_metres: number;
  dominant_light: string;
  rhs_hardiness: string;
  style_tags: string[];
  camera_facing: string;
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
    } = event.data as PlanStartData;

    const ctx: SiteContext = {
      widthMetres: width_metres,
      depthMetres: depth_metres,
      dominantLight: dominant_light as SiteContext['dominantLight'],
      rhsHardiness: rhs_hardiness as SiteContext['rhsHardiness'],
      styleTags: style_tags,
    };

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
        return generateSuggestions(prompt);
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
        );
      });

      // ── Step 4: repair ─────────────────────────────────────────────────────
      const repairedSuggestions = await step.run('repair', async () => {
        await setStatus(job_id, 'repairing');
        if (isViable(validationResult)) {
          return validationResult.valid;
        }
        return repairSuggestions(validationResult, width_metres, depth_metres);
      });

      // ── Step 5: persist ────────────────────────────────────────────────────
      const persistResult = await step.run('persist', async () => {
        const plantMap = new Map(plants.map(p => [p.id, p]));
        const shoppingList = buildShoppingList(repairedSuggestions, plantMap);

        await supabaseAdmin
          .from('plan_jobs')
          .update({
            status: 'done',
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

      // ── Step 6: kick off render (PDF generation) ───────────────────────────
      await step.sendEvent('trigger-render', {
        name: 'render/start',
        data: { job_id },
      });

      return persistResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from('plan_jobs')
        .update({ status: 'failed', error_message: message })
        .eq('id', job_id);
      throw err; // re-throw so Inngest marks the run as failed
    }
  },
);
