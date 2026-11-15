/**
 * repair.ts — One repair round for invalid planting suggestions.
 *
 * Strategy (in order):
 *   - unknown_id: drop the entry (can't guess what plant was meant)
 *   - out_of_bounds: clamp x/y to garden bounds
 *   - negative_qty: set quantity to 1
 *   - duplicate_pos: nudge position by +0.5 m in X
 *
 * Returns repaired suggestions (all previously-valid ones are kept as-is;
 * repairable invalid ones are fixed; unrepairable ones are dropped).
 */

import type { PlantingSuggestion, ValidationResult } from './types';

export function repairSuggestions(
  validationResult: ValidationResult,
  widthMetres: number,
  depthMetres: number,
): PlantingSuggestion[] {
  const repaired: PlantingSuggestion[] = [...validationResult.valid];

  for (const issue of validationResult.issues) {
    switch (issue.kind) {
      case 'unknown_id':
        // Cannot repair — drop silently
        break;

      case 'out_of_bounds': {
        // Find the original suggestion and clamp it
        repaired.push({
          plant_id: issue.plant_id,
          quantity: 1,
          x_metres: Math.max(0, Math.min(widthMetres, issue.x)),
          y_metres: Math.max(0, Math.min(depthMetres, issue.y)),
          notes: 'Position clamped to garden boundary.',
        });
        break;
      }

      case 'negative_qty': {
        // Find the original position from other valid entries for this plant, or place centrally
        const existing = repaired.find(s => s.plant_id === issue.plant_id);
        const x = existing ? existing.x_metres + 0.5 : widthMetres / 2;
        const y = existing ? existing.y_metres : depthMetres / 2;
        repaired.push({
          plant_id: issue.plant_id,
          quantity: 1,
          x_metres: Math.min(x, widthMetres),
          y_metres: Math.min(y, depthMetres),
          notes: 'Quantity corrected to 1.',
        });
        break;
      }

      case 'duplicate_pos': {
        // Nudge the duplicate by 0.5 m in X, clamping to bounds
        const nudgedX = Math.min(issue.x + 0.5, widthMetres);
        repaired.push({
          plant_id: issue.plant_id,
          quantity: 1,
          x_metres: nudgedX,
          y_metres: issue.y,
          notes: 'Position adjusted to avoid overlap.',
        });
        break;
      }
    }
  }

  return repaired;
}
