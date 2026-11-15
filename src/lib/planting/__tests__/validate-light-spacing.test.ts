import { describe, it, expect } from 'vitest';
import { validateSuggestions, lookupSunCell } from '../validate';
import type { PlantingSuggestion, PlantRecord } from '../types';
import type { SunLabel } from '@/lib/site-model/sun-grid';

// ── Helpers ──────────────────────────────────────────────────────────────────

const W = 6;
const D = 10;

function makeP(overrides: Partial<PlantRecord> = {}): PlantRecord {
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

function sug(overrides: Partial<PlantingSuggestion> = {}): PlantingSuggestion {
  return {
    plant_id: 'p001',
    quantity: 1,
    x_metres: 2,
    y_metres: 5,
    notes: 'test',
    ...overrides,
  };
}

// Build a simple sun grid: all full_sun except row 0 (rear) = shade
function buildTestSunGrid(): SunLabel[][] {
  // 6m wide, 10m deep, cell = 0.5m => cols=12, rows=20
  const rows = 20;
  const cols = 12;
  const grid: SunLabel[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: SunLabel[] = [];
    for (let c = 0; c < cols; c++) {
      if (r < 4) row.push('shade');        // rear 2m = shade
      else if (r < 8) row.push('part_shade'); // next 2m = part shade
      else row.push('full_sun');            // rest = full sun
      }
    grid.push(row);
  }
  return grid;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('lookupSunCell', () => {
  it('returns shade for a position at the rear of the garden', () => {
    const grid = buildTestSunGrid();
    // y=9.5 is near the rear (row 0-ish)
    const result = lookupSunCell(3, 9.5, W, D, grid);
    expect(result).toBe('shade');
  });

  it('returns full_sun for a position at the front', () => {
    const grid = buildTestSunGrid();
    // y=1 is near the front
    const result = lookupSunCell(3, 1, W, D, grid);
    expect(result).toBe('full_sun');
  });

  it('returns part_shade for a mid-zone position', () => {
    const grid = buildTestSunGrid();
    // y=7 => row = 20-1 - floor(7/0.5) = 19-14 = 5, which is in part_shade (rows 4-7)
    const result = lookupSunCell(3, 7, W, D, grid);
    expect(result).toBe('part_shade');
  });
});

describe('validateSuggestions - light checks', () => {
  const sunGrid = buildTestSunGrid();

  it('rejects a shade-only plant in a full-sun cell', () => {
    const shadeOnlyPlant = makeP({ id: 'p010', light: ['shade'] });
    const plantMap = new Map([['p010', shadeOnlyPlant]]);
    const knownIds = new Set(['p010']);

    // y=1 is full_sun zone
    const result = validateSuggestions(
      [sug({ plant_id: 'p010', y_metres: 1 })],
      knownIds, W, D,
      { sunGrid, plantMap },
    );

    expect(result.valid).toHaveLength(0);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].kind).toBe('wrong_light');
  });

  it('rejects a full-sun-only plant in a shade cell', () => {
    const fullSunPlant = makeP({ id: 'p011', light: ['full_sun'] });
    const plantMap = new Map([['p011', fullSunPlant]]);
    const knownIds = new Set(['p011']);

    // y=9.5 is shade zone
    const result = validateSuggestions(
      [sug({ plant_id: 'p011', y_metres: 9.5 })],
      knownIds, W, D,
      { sunGrid, plantMap },
    );

    expect(result.valid).toHaveLength(0);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].kind).toBe('wrong_light');
  });

  it('accepts a plant whose light list matches the cell', () => {
    const plant = makeP({ id: 'p012', light: ['full_sun', 'part_shade'] });
    const plantMap = new Map([['p012', plant]]);
    const knownIds = new Set(['p012']);

    // y=1 is full_sun zone, plant accepts full_sun
    const result = validateSuggestions(
      [sug({ plant_id: 'p012', y_metres: 1 })],
      knownIds, W, D,
      { sunGrid, plantMap },
    );

    expect(result.valid).toHaveLength(1);
    expect(result.issues).toHaveLength(0);
  });

  it('accepts a shade-tolerant plant in a shade cell', () => {
    const plant = makeP({ id: 'p013', light: ['shade', 'part_shade'] });
    const plantMap = new Map([['p013', plant]]);
    const knownIds = new Set(['p013']);

    // y=9.5 is shade zone
    const result = validateSuggestions(
      [sug({ plant_id: 'p013', y_metres: 9.5 })],
      knownIds, W, D,
      { sunGrid, plantMap },
    );

    expect(result.valid).toHaveLength(1);
    expect(result.issues).toHaveLength(0);
  });

  it('valid plans pass without sun grid', () => {
    const knownIds = new Set(['p001']);
    const result = validateSuggestions(
      [sug()],
      knownIds, W, D,
    );
    expect(result.valid).toHaveLength(1);
    expect(result.issues).toHaveLength(0);
  });
});

describe('validateSuggestions - spacing checks', () => {
  it('rejects plants closer than half the sum of their spreads', () => {
    const p1 = makeP({ id: 'p001', spread_m: 2 });
    const p2 = makeP({ id: 'p002', spread_m: 2 });
    const plantMap = new Map([['p001', p1], ['p002', p2]]);
    const knownIds = new Set(['p001', 'p002']);

    // Both at similar positions, 0.5m apart (need 2m)
    const result = validateSuggestions(
      [
        sug({ plant_id: 'p001', x_metres: 2, y_metres: 5 }),
        sug({ plant_id: 'p002', x_metres: 2.5, y_metres: 5 }),
      ],
      knownIds, W, D,
      { plantMap },
    );

    expect(result.valid).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].kind).toBe('too_close');
  });

  it('allows same plant drifts at 60% of spread', () => {
    const p1 = makeP({ id: 'p001', spread_m: 1.0 });
    const plantMap = new Map([['p001', p1]]);
    const knownIds = new Set(['p001']);

    // Same plant, 0.7m apart. Threshold = 1.0 * 0.6 = 0.6m, so 0.7 > 0.6 = OK
    const result = validateSuggestions(
      [
        sug({ plant_id: 'p001', x_metres: 2, y_metres: 5 }),
        sug({ plant_id: 'p001', x_metres: 2.7, y_metres: 5 }),
      ],
      knownIds, W, D,
      { plantMap },
    );

    expect(result.valid).toHaveLength(2);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects same plant drifts too close (under 60% of spread)', () => {
    const p1 = makeP({ id: 'p001', spread_m: 2.0 });
    const plantMap = new Map([['p001', p1]]);
    const knownIds = new Set(['p001']);

    // Same plant, 0.5m apart. Threshold = 2.0 * 0.6 = 1.2m, so 0.5 < 1.2 = rejected
    const result = validateSuggestions(
      [
        sug({ plant_id: 'p001', x_metres: 2, y_metres: 5 }),
        sug({ plant_id: 'p001', x_metres: 2.5, y_metres: 5 }),
      ],
      knownIds, W, D,
      { plantMap },
    );

    expect(result.valid).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].kind).toBe('too_close');
  });

  it('allows well-spaced plants', () => {
    const p1 = makeP({ id: 'p001', spread_m: 1.0 });
    const p2 = makeP({ id: 'p002', spread_m: 1.0 });
    const plantMap = new Map([['p001', p1], ['p002', p2]]);
    const knownIds = new Set(['p001', 'p002']);

    // 3m apart, threshold = 1.0m
    const result = validateSuggestions(
      [
        sug({ plant_id: 'p001', x_metres: 1, y_metres: 5 }),
        sug({ plant_id: 'p002', x_metres: 4, y_metres: 5 }),
      ],
      knownIds, W, D,
      { plantMap },
    );

    expect(result.valid).toHaveLength(2);
    expect(result.issues).toHaveLength(0);
  });
});
