/**
 * Shared types for the planting engine (Stage 5).
 * No external dependencies — safe to import from server or client.
 */

import type { SunLabel } from '@/lib/site-model/sun-grid';

// ─── Plant fixture shape (mirrors public.plants table) ────────────────────────

export type RhsHardiness = 'H1a' | 'H1b' | 'H1c' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7';

export type PlantType =
  | 'Tree' | 'Shrub' | 'Perennial' | 'Annual' | 'Grass'
  | 'Groundcover' | 'Climber' | 'Fern' | 'Bamboo' | 'Bulb';

export interface PlantRecord {
  id: string;
  botanical_name: string;
  common_name: string;
  plant_type: PlantType;
  rhs_hardiness: RhsHardiness;
  usda_zone_min: number;
  usda_zone_max: number;
  light: SunLabel[];
  soil: string[];
  moisture: string;
  height_m: number;
  spread_m: number;
  evergreen: boolean;
  season_of_interest: string[];
  style_tags: string[];
  description: string | null;
  native_regions: string[];
  source_urls: string[];
  reviewed: boolean;
}

// ─── Site context passed to the planting engine ───────────────────────────────

export interface SiteContext {
  widthMetres: number;
  depthMetres: number;
  /** Dominant sun label across the garden — drives plant shortlisting */
  dominantLight: SunLabel;
  /** RHS hardiness of the user's location */
  rhsHardiness: RhsHardiness;
  /** User-chosen style keywords, e.g. ['cottage', 'wildlife'] */
  styleTags: string[];
}

// ─── Shortlist output ─────────────────────────────────────────────────────────

export interface ShortlistedPlant {
  plant: PlantRecord;
  /** 0–1 score for ordering suggestions */
  score: number;
}

// ─── Gemini generate output ───────────────────────────────────────────────────

export interface PlantingSuggestion {
  plant_id: string;
  quantity: number;
  x_metres: number;
  y_metres: number;
  notes: string;
}

export interface GenerateResult {
  suggestions: PlantingSuggestion[];
  /** Raw Gemini response, kept for debugging */
  rawText: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationIssue =
  | { kind: 'unknown_id';      plant_id: string }
  | { kind: 'out_of_bounds';   plant_id: string; x: number; y: number }
  | { kind: 'negative_qty';    plant_id: string; qty: number }
  | { kind: 'duplicate_pos';   plant_id: string; x: number; y: number };

export interface ValidationResult {
  valid: PlantingSuggestion[];
  issues: ValidationIssue[];
}

// ─── Shopping list ────────────────────────────────────────────────────────────

export interface ShoppingItem {
  plant_id: string;
  common_name: string;
  botanical_name: string;
  quantity: number;
  /** Approx GBP price bracket for a standard 2 L pot */
  price_bracket: 'under_5' | '5_to_10' | '10_to_20' | 'over_20';
}
