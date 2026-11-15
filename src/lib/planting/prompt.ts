/**
 * prompt.ts — Build the Gemini prompt for planting suggestions.
 *
 * Returns a single system+user prompt string.
 * Pure function — no I/O, no imports from server-only modules.
 */

import type { ShortlistedPlant, SiteContext } from './types';

export function buildPlantingPrompt(
  shortlist: ShortlistedPlant[],
  ctx: SiteContext,
): string {
  const plantLines = shortlist
    .map(({ plant }) =>
      `- ${plant.id}: ${plant.common_name} (${plant.botanical_name}), ` +
      `${plant.plant_type}, H: ${plant.height_m}m, spread: ${plant.spread_m}m, ` +
      `light: ${plant.light.join('/')}, evergreen: ${plant.evergreen}, ` +
      `seasons: ${plant.season_of_interest.join('/')}, tags: ${plant.style_tags.join('/')}`,
    )
    .join('\n');

  return `You are a professional UK garden designer creating a planting plan.

GARDEN SIZE: ${ctx.widthMetres}m wide x ${ctx.depthMetres}m deep
DOMINANT LIGHT: ${ctx.dominantLight}
HARDINESS: ${ctx.rhsHardiness} (UK)
STYLE PREFERENCES: ${ctx.styleTags.length > 0 ? ctx.styleTags.join(', ') : 'no preference'}

AVAILABLE PLANTS (use only these IDs):
${plantLines}

TASK: Suggest a planting layout for this garden. Return ONLY a JSON array — no prose, no markdown fences.

Each element must be an object with exactly these keys:
  "plant_id"  : string  — one of the IDs listed above
  "quantity"  : number  — integer >= 1
  "x_metres"  : number  — distance from the left boundary (0 to ${ctx.widthMetres})
  "y_metres"  : number  — distance from the front boundary (0 to ${ctx.depthMetres})
  "notes"     : string  — one sentence about placement rationale

RULES:
- Use 6 to 12 distinct plant IDs.
- Spread plants across the full garden area; avoid clustering near one corner.
- For trees and large shrubs (height > 2m), place near the rear boundary (y_metres > ${(ctx.depthMetres * 0.6).toFixed(1)}).
- Respect the light constraints listed above.
- Keep x_metres in [0, ${ctx.widthMetres}] and y_metres in [0, ${ctx.depthMetres}].
- Each entry represents one planting position; for drifts, repeat the same plant_id at different positions.

Return only the JSON array.`;
}
