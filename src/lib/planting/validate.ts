/**
 * validate.ts — Pure validation for Gemini planting suggestions.
 *
 * Checks:
 *   - plant_id is in the known set
 *   - x_metres and y_metres are within garden bounds (with 0.1 m tolerance)
 *   - quantity >= 1
 *   - no two suggestions have the exact same (plant_id, x, y) position
 *
 * Returns { valid, issues } — invalid entries are separated out rather than
 * crashing the whole plan. The repair round (in repair.ts) attempts to fix
 * or remove invalid entries before they reach the shopping list.
 */

import type { PlantingSuggestion, ValidationResult, ValidationIssue } from './types';

const POSITION_TOLERANCE = 0.1; // metres

export function validateSuggestions(
  suggestions: PlantingSuggestion[],
  knownIds: Set<string>,
  widthMetres: number,
  depthMetres: number,
): ValidationResult {
  const valid: PlantingSuggestion[] = [];
  const issues: ValidationIssue[] = [];

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

    seenPos.add(posKey);

    // Clamp to bounds (within tolerance) before accepting
    valid.push({
      ...s,
      x_metres: Math.max(0, Math.min(widthMetres, s.x_metres)),
      y_metres: Math.max(0, Math.min(depthMetres, s.y_metres)),
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
