/**
 * styles.ts — the fixed list of garden styles (agreed 16 Nov 2026).
 *
 * Every plant's `style_tags` uses ONLY these ids, and the customer picks from
 * the same list, so a chosen style always has something to match. Other
 * descriptive words (fragrant, hedging, ground cover...) live in each plant's
 * `feature_tags` and play no part in style matching.
 *
 * Pure data: safe to import from client and server code.
 */

export const GARDEN_STYLES = [
  { id: 'cottage',         label: 'Cottage' },
  { id: 'contemporary',    label: 'Modern and minimal' },
  { id: 'mediterranean',   label: 'Mediterranean and dry' },
  { id: 'wildlife',        label: 'Wildlife and pollinator' },
  { id: 'japanese',        label: 'Japanese-inspired' },
  { id: 'woodland',        label: 'Woodland and shade' },
  { id: 'coastal',         label: 'Coastal' },
  { id: 'formal',          label: 'Formal and classic' },
  { id: 'prairie',         label: 'Naturalistic and prairie' },
  { id: 'low_maintenance', label: 'Low maintenance' },
] as const;

export type GardenStyleId = (typeof GARDEN_STYLES)[number]['id'];

export const GARDEN_STYLE_IDS: readonly string[] = GARDEN_STYLES.map(s => s.id);

/** Most styles a customer may pick at once. */
export const MAX_STYLES = 3;

export function isGardenStyle(value: unknown): value is GardenStyleId {
  return typeof value === 'string' && GARDEN_STYLE_IDS.includes(value);
}

/** Keeps only known style ids, de-duplicated, capped at MAX_STYLES. */
export function cleanStyleSelection(values: unknown): GardenStyleId[] {
  if (!Array.isArray(values)) return [];
  const out: GardenStyleId[] = [];
  for (const v of values) {
    if (isGardenStyle(v) && !out.includes(v)) out.push(v);
    if (out.length === MAX_STYLES) break;
  }
  return out;
}

export function styleLabel(id: string): string {
  return GARDEN_STYLES.find(s => s.id === id)?.label ?? id;
}
