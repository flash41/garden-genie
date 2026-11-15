/**
 * shopping-list.ts — Aggregate validated suggestions into a shopping list.
 *
 * Groups by plant_id, sums quantities, looks up display names.
 */

import type { PlantingSuggestion, PlantRecord, ShoppingItem } from './types';

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
