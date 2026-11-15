/**
 * shopping-list.ts — Aggregate validated suggestions into a shopping list.
 *
 * Groups by plant_id, sums quantities, looks up display names,
 * and assigns a rough GBP price bracket based on plant type and size.
 */

import type { PlantingSuggestion, PlantRecord, ShoppingItem } from './types';

/** Rough price-bracket heuristics for a standard 2 L pot from a UK garden centre. */
function priceBracket(plant: PlantRecord): ShoppingItem['price_bracket'] {
  if (plant.plant_type === 'Tree') return 'over_20';
  if (plant.plant_type === 'Shrub' && plant.height_m > 1.5) return '10_to_20';
  if (plant.plant_type === 'Shrub') return '5_to_10';
  if (plant.plant_type === 'Climber') return '10_to_20';
  if (plant.plant_type === 'Bamboo') return '10_to_20';
  if (plant.plant_type === 'Grass' && plant.height_m > 1.0) return '5_to_10';
  if (plant.plant_type === 'Bulb') return 'under_5';
  return '5_to_10'; // Perennial, Annual, Groundcover, Fern, Grass (small)
}

export function buildShoppingList(
  suggestions: PlantingSuggestion[],
  plantMap: Map<string, PlantRecord>,
): ShoppingItem[] {
  const totals = new Map<string, number>();

  for (const s of suggestions) {
    totals.set(s.plant_id, (totals.get(s.plant_id) ?? 0) + s.quantity);
  }

  const items: ShoppingItem[] = [];
  for (const [plantId, quantity] of totals) {
    const plant = plantMap.get(plantId);
    if (!plant) continue;
    items.push({
      plant_id: plantId,
      common_name: plant.common_name,
      botanical_name: plant.botanical_name,
      quantity,
      price_bracket: priceBracket(plant),
    });
  }

  // Sort: trees first, then shrubs, then everything else; within group by quantity desc
  const typeOrder: Record<string, number> = {
    Tree: 0, Shrub: 1, Climber: 2, Bamboo: 3, Grass: 4,
    Perennial: 5, Fern: 6, Groundcover: 7, Annual: 8, Bulb: 9,
  };
  items.sort((a, b) => {
    const pa = plantMap.get(a.plant_id)!;
    const pb = plantMap.get(b.plant_id)!;
    const typeDiff = (typeOrder[pa.plant_type] ?? 99) - (typeOrder[pb.plant_type] ?? 99);
    return typeDiff !== 0 ? typeDiff : b.quantity - a.quantity;
  });

  return items;
}
