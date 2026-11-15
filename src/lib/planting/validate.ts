/**
 * validate.ts — Pure validation for Gemini planting suggestions.
 *
 * Checks:
 *   - plant_id is in the known set
 *   - x_metres and y_metres are within garden bounds (with 0.1 m tolerance)
 *   - quantity >= 1
 *   - no two suggestions have the exact same (plant_id, x, y) position
 *   - per-position light: sun-grid cell must be in the plant's light list
 *   - spacing: no two plants closer than half the sum of their spreads
 *     (except deliberate drifts of the same plant at 60% of spread)
 *
 * Returns { valid, issues } — invalid entries are separated out rather than
 * crashing the whole plan. The repair round (in repair.ts) attempts to fix
 * or remove invalid entries before they reach the shopping list.
 */

import type { PlantRecord, PlantingSuggestion, ValidationResult, ValidationIssue } from './types';
import type { SunLabel } from '@/lib/site-model/sun-grid';

const POSITION_TOLERANCE = 0.1; // metres
const CELL_SIZE = 0.5; // metres — must match sun-grid.ts

/**
 * Look up the sun-grid cell for a given (x, y) position.
 * Grid row 0 = rear (top), row (rows-1) = front (bottom).
 * y_metres is measured from the front boundary (y=0 = front, y=depth = rear).
 */
export function lookupSunCell(
  x: number,
  y: number,
  widthMetres: number,
  depthMetres: number,
  sunGrid: SunLabel[][],
): SunLabel | null {
  if (sunGrid.length === 0) return null;
  const rows = sunGrid.length;
  const cols = sunGrid[0].length;
  const col = Math.min(cols - 1, Math.max(0, Math.floor(x / CELL_SIZE)));
  // y=0 is front = row (rows-1), y=depth is rear = row 0
  const row = Math.min(rows - 1, Math.max(0, rows - 1 - Math.floor(y / CELL_SIZE)));
  return sunGrid[row][col];
}

export function validateSuggestions(
  suggestions: PlantingSuggestion[],
  knownIds: Set<string>,
  widthMetres: number,
  depthMetres: number,
  opts?: {
    sunGrid?: SunLabel[][];
    plantMap?: Map<string, PlantRecord>;
  },
): ValidationResult {
  const valid: PlantingSuggestion[] = [];
  const issues: ValidationIssue[] = [];
  const sunGrid = opts?.sunGrid;
  const plantMap = opts?.plantMap;

  // Track seen positions to detect duplicates
  const seenPos = new Set<string>();

  for (const s of suggestions) {
    const posKey = `${s.plant_id}:${s.x_metres.toFixed(2)}:${s.y_metres.toFixed(2)}`;

    if (!knownIds.has(s.plant_id)) {
      issues.push({ kind: 'unknown_id', plant_id: s.plant_id });
      continue;
    }

    if (
      s.x_metres < -POSITION_TOLERANCE ||
      s.x_metres > widthMetres + POSITION_TOLERANCE ||
      s.y_metres < -POSITION_TOLERANCE ||
      s.y_metres > depthMetres + POSITION_TOLERANCE
    ) {
      issues.push({ kind: 'out_of_bounds', plant_id: s.plant_id, x: s.x_metres, y: s.y_metres });
      continue;
    }

    if (s.quantity < 1 || !Number.isInteger(s.quantity)) {
      issues.push({ kind: 'negative_qty', plant_id: s.plant_id, qty: s.quantity });
      continue;
    }

    if (seenPos.has(posKey)) {
      issues.push({ kind: 'duplicate_pos', plant_id: s.plant_id, x: s.x_metres, y: s.y_metres });
      continue;
    }

    // Clamp to bounds (within tolerance)
    const cx = Math.max(0, Math.min(widthMetres, s.x_metres));
    const cy = Math.max(0, Math.min(depthMetres, s.y_metres));

    // Per-position light check
    let cellLight: SunLabel | null = null;
    if (sunGrid && plantMap) {
      cellLight = lookupSunCell(cx, cy, widthMetres, depthMetres, sunGrid);
      if (cellLight) {
        const plant = plantMap.get(s.plant_id);
        if (plant && !plant.light.includes(cellLight)) {
          issues.push({
            kind: 'wrong_light',
            plant_id: s.plant_id,
            x: s.x_metres,
            y: s.y_metres,
            cell_light: cellLight,
            plant_light: plant.light,
          });
          continue;
        }
      }
    }

    // Spacing check: compare against already-accepted valid entries
    if (plantMap) {
      const plantA = plantMap.get(s.plant_id);
      let tooClose = false;
      for (const v of valid) {
        const plantB = plantMap.get(v.plant_id);
        if (!plantA || !plantB) continue;
        const dx = cx - v.x_metres;
        const dy = cy - v.y_metres;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (plantA.spread_m + plantB.spread_m) / 2;
        // Allow deliberate drifts of the same plant at 60% of spread
        const threshold = s.plant_id === v.plant_id ? minDist * 0.6 : minDist;
        if (dist < threshold) {
          issues.push({
            kind: 'too_close',
            plant_id: s.plant_id,
            x: s.x_metres,
            y: s.y_metres,
            other_id: v.plant_id,
            distance: Math.round(dist * 100) / 100,
            min_distance: Math.round(threshold * 100) / 100,
          });
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
    }

    seenPos.add(posKey);

    valid.push({
      ...s,
      x_metres: cx,
      y_metres: cy,
      light: cellLight ?? s.light,
    });
  }

  return { valid, issues };
}

/**
 * Returns true if the result has enough valid suggestions to build a plan.
 */
export function isViable(result: ValidationResult, minSuggestions = 4): boolean {
  return result.valid.length >= minSuggestions;
}
