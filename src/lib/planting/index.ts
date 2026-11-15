/**
 * Barrel export for the planting engine.
 * generate.ts is intentionally NOT re-exported here — it uses fetch and
 * process.env, so callers should import it directly from server-side code.
 */

export { shortlistPlants } from './shortlist';
export { buildPlantingPrompt } from './prompt';
export { validateSuggestions, isViable } from './validate';
export { repairSuggestions } from './repair';
export { buildShoppingList } from './shopping-list';
export type {
  PlantRecord,
  PlantType,
  RhsHardiness,
  SiteContext,
  ShortlistedPlant,
  PlantingSuggestion,
  GenerateResult,
  ValidationIssue,
  ValidationResult,
  ShoppingItem,
} from './types';
