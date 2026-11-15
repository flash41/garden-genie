/**
 * prompt.ts — Build the Gemini prompt for planting suggestions.
 *
 * Returns a single system+user prompt string.
 * Pure function — no I/O, no imports from server-only modules.
 */

import type { ShortlistedPlant, SiteContext } from './types';
import type { SunLabel } from '@/lib/site-model/sun-grid';

/**
 * Build a compact text map of the sun grid at 1 m resolution.
 * Each cell is represented as F (full_sun), P (part_shade), or S (shade).
 * Row 0 = rear (top of garden), last row = front.
 */
function buildLightMap(
  sunGrid: SunLabel[][],
  widthMetres: number,
  depthMetres: number,
): string {
  const CELL = 0.5; // sun grid cell size
  const STEP = 2; // sample every 2 cells = 1 m resolution
  const rows = sunGrid.length;
  const cols = sunGrid[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return '';

  const labelChar: Record<SunLabel, string> = {
    full_sun: 'F',
    part_shade: 'P',
    shade: 'S',
  };

  const lines: string[] = [];
  lines.push('LIGHT MAP (1 m grid, row 0 = rear, last row = front):');
  lines.push('Legend: F = full sun, P = part shade, S = shade');
  lines.push('');

  for (let r = 0; r < rows; r += STEP) {
    let line = '';
    for (let c = 0; c < cols; c += STEP) {
      line += labelChar[sunGrid[r][c]] ?? '?';
    }
    lines.push('  ' + line);
  }

  return lines.join('\n');
}

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

  // Build location/climate description from hardiness + location
  const climateParts: string[] = [];
  climateParts.push(`Hardiness rating: ${ctx.rhsHardiness}`);
  if (ctx.location) climateParts.push(`Location: ${ctx.location}`);
  const climateDesc = climateParts.join('. ');

  // Build light map if sun grid is available
  const lightMapSection = ctx.sunGrid
    ? '\n' + buildLightMap(ctx.sunGrid, ctx.widthMetres, ctx.depthMetres) + '\n'
    : '';

  return `You are a professional garden designer creating a planting plan.

GARDEN SIZE: ${ctx.widthMetres}m wide x ${ctx.depthMetres}m deep
CLIMATE: ${climateDesc}
STYLE PREFERENCES: ${ctx.styleTags.length > 0 ? ctx.styleTags.join(', ') : 'no preference'}
${lightMapSection}
AVAILABLE PLANTS (use only these IDs):
${plantLines}

TASK: Suggest a planting layout for this garden. Return ONLY a JSON array -- no prose, no markdown fences.

Each element must be an object with exactly these keys:
  "plant_id"  : string  -- one of the IDs listed above
  "quantity"  : number  -- integer >= 1
  "x_metres"  : number  -- distance from the left boundary (0 to ${ctx.widthMetres})
  "y_metres"  : number  -- distance from the front boundary (0 to ${ctx.depthMetres})
  "notes"     : string  -- one sentence about placement rationale

RULES:
- Use 6 to 12 distinct plant IDs.
- Spread plants across the full garden area; avoid clustering near one corner.
- For trees and large shrubs (height > 2m), place near the rear boundary (y_metres > ${(ctx.depthMetres * 0.6).toFixed(1)}).
- Each plant MUST sit in a zone whose light level is in that plant's light list. Check the light map above.
- Keep x_metres in [0, ${ctx.widthMetres}] and y_metres in [0, ${ctx.depthMetres}].
- Each entry represents one planting position; for drifts, repeat the same plant_id at different positions.
- Space plants at least half the sum of their spreads apart.

Return only the JSON array.`;
}

/**
 * Build a repair prompt that receives only the violations and returns replacements.
 */
export function buildRepairPrompt(
  violations: Array<{ plant_id: string; x: number; y: number; reason: string }>,
  shortlist: ShortlistedPlant[],
  ctx: SiteContext,
): string {
  const plantLines = shortlist
    .map(({ plant }) =>
      `- ${plant.id}: ${plant.common_name}, light: ${plant.light.join('/')}, spread: ${plant.spread_m}m`,
    )
    .join('\n');

  const lightMapSection = ctx.sunGrid
    ? '\n' + buildLightMap(ctx.sunGrid, ctx.widthMetres, ctx.depthMetres) + '\n'
    : '';

  const violationLines = violations
    .map(v => `  - ${v.plant_id} at (${v.x}, ${v.y}): ${v.reason}`)
    .join('\n');

  return `The following plant placements failed validation:
${violationLines}

Garden: ${ctx.widthMetres}m x ${ctx.depthMetres}m
${lightMapSection}
Available plants:
${plantLines}

For each violation, suggest a replacement placement that is valid. Return ONLY a JSON array of objects with:
  "plant_id", "quantity", "x_metres", "y_metres", "notes"

Each plant must sit in a zone whose light level is in its light list. Space plants apart.
If no valid replacement exists for a position, omit it from the array.
Return only the JSON array.`;
}
