import { describe, it, expect } from 'vitest';
import { shortlistPlants } from '../shortlist';
import type { PlantRecord, SiteContext } from '../types';

function makeP(overrides: Partial<PlantRecord>): PlantRecord {
  return {
    id: 'p001',
    botanical_name: 'Test plant',
    common_name: 'Test',
    plant_type: 'Perennial',
    rhs_hardiness: 'H5',
    usda_zone_min: 5,
    usda_zone_max: 9,
    light: ['full_sun', 'part_shade'],
    soil: ['Loam'],
    moisture: 'moist_well_drained',
    height_m: 0.6,
    spread_m: 0.5,
    evergreen: false,
    season_of_interest: ['summer'],
    style_tags: ['cottage'],
    description: null,
    native_regions: [],
    source_urls: [],
    reviewed: false,
    ...overrides,
  };
}

const ctx: SiteContext = {
  widthMetres: 6,
  depthMetres: 10,
  dominantLight: 'full_sun',
  rhsHardiness: 'H5',
  styleTags: ['cottage'],
};

describe('shortlistPlants', () => {
  it('passes a matching plant', () => {
    const result = shortlistPlants([makeP({})], ctx);
    expect(result).toHaveLength(1);
  });

  it('filters out plants that are too tender', () => {
    // H3 plant in an H5 site — not hardy enough
    const result = shortlistPlants([makeP({ rhs_hardiness: 'H3' })], ctx);
    expect(result).toHaveLength(0);
  });

  it('passes a plant hardier than the site', () => {
    // H7 plant in an H5 site — fine
    const result = shortlistPlants([makeP({ rhs_hardiness: 'H7' })], ctx);
    expect(result).toHaveLength(1);
  });

  it('filters out shade-only plants in a full_sun site', () => {
    const result = shortlistPlants([makeP({ light: ['shade'] })], ctx);
    expect(result).toHaveLength(0);
  });

  it('passes a part_shade plant in a part_shade site', () => {
    const result = shortlistPlants(
      [makeP({ light: ['part_shade'] })],
      { ...ctx, dominantLight: 'part_shade' },
    );
    expect(result).toHaveLength(1);
  });

  it('passes a shade plant in a shade site', () => {
    const result = shortlistPlants(
      [makeP({ light: ['shade'] })],
      { ...ctx, dominantLight: 'shade' },
    );
    expect(result).toHaveLength(1);
  });

  it('passes a full_sun plant in a shade site? No — shade requires shade tolerance', () => {
    // A full_sun-only plant cannot go in shade
    const result = shortlistPlants(
      [makeP({ light: ['full_sun'] })],
      { ...ctx, dominantLight: 'shade' },
    );
    expect(result).toHaveLength(0);
  });

  it('scores style tag match higher', () => {
    const noTag = makeP({ id: 'p002', style_tags: [], season_of_interest: [] });
    const withTag = makeP({ id: 'p001', style_tags: ['cottage'], season_of_interest: [] });
    const result = shortlistPlants([noTag, withTag], ctx);
    // withTag should come first (higher score)
    expect(result[0].plant.id).toBe('p001');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('respects the limit parameter', () => {
    const plants = Array.from({ length: 10 }, (_, i) => makeP({ id: `p0${i + 1}` }));
    const result = shortlistPlants(plants, ctx, 5);
    expect(result).toHaveLength(5);
  });

  it('returns empty for empty input', () => {
    expect(shortlistPlants([], ctx)).toHaveLength(0);
  });
});
