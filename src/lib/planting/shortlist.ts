/**
 * shortlist.ts — Filter and score plants for a given site context.
 *
 * Hard filters (must pass all):
 *   1. RHS hardiness: plant's hardiness >= site hardiness (H7 is hardiest)
 *   2. Light tolerance: plant accepts the site's dominant light level
 *
 * Scoring (0–1, higher = better match):
 *   - 0.5 pts if at least one style_tag matches site styleTags
 *   - 0.3 pts if plant's dominant season_of_interest covers summer (year-round interest bonus)
 *   - 0.2 pts if plant is evergreen (structural value)
 *
 * Returns up to `limit` plants ordered by score descending.
 */

import type { PlantRecord, SiteContext, ShortlistedPlant, RhsHardiness } from './types';
import type { SunLabel } from '@/lib/site-model/sun-grid';

// RHS hardiness scale: H1a (tender) → H7 (very hardy).
// Higher index = hardier.
const RHS_ORDER: RhsHardiness[] = ['H1a', 'H1b', 'H1c', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7'];

function rhsIndex(h: RhsHardiness): number {
  return RHS_ORDER.indexOf(h);
}

/**
 * Returns true if the plant is hardy enough for the site.
 * A plant with hardiness H5 (index 4) can survive at a site needing H4 (index 3).
 * So plant index >= site index.
 */
function isHardyEnough(plantHardiness: RhsHardiness, siteHardiness: RhsHardiness): boolean {
  return rhsIndex(plantHardiness) >= rhsIndex(siteHardiness);
}

/**
 * Returns true if the plant tolerates the site's light level.
 * A full-sun plant cannot go in shade; a shade plant can go anywhere.
 */
function toleratesLight(plantLight: SunLabel[], siteLight: SunLabel): boolean {
  // 'shade' tolerates everything; 'part_shade' tolerates part_shade and shade
  if (siteLight === 'full_sun') return plantLight.includes('full_sun');
  if (siteLight === 'part_shade') return plantLight.includes('part_shade') || plantLight.includes('shade');
  // siteLight === 'shade'
  return plantLight.includes('shade');
}

function scorePlant(plant: PlantRecord, ctx: SiteContext): number {
  let s = 0;
  if (ctx.styleTags.length > 0 && plant.style_tags.some(t => ctx.styleTags.includes(t))) s += 0.5;
  if (plant.season_of_interest.includes('summer')) s += 0.3;
  if (plant.evergreen) s += 0.2;
  return Math.min(1, s);
}

export function shortlistPlants(
  plants: PlantRecord[],
  ctx: SiteContext,
  limit = 20,
): ShortlistedPlant[] {
  const passing = plants.filter(p =>
    isHardyEnough(p.rhs_hardiness, ctx.rhsHardiness) &&
    toleratesLight(p.light, ctx.dominantLight),
  );

  const scored = passing.map(p => ({ plant: p, score: scorePlant(p, ctx) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
