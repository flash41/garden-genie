import { describe, it, expect } from 'vitest';
import { validateSuggestions, isViable } from '../validate';
import type { PlantingSuggestion } from '../types';

const KNOWN = new Set(['p001', 'p002', 'p003']);
const W = 6;
const D = 10;

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

describe('validateSuggestions', () => {
  it('accepts a clean suggestion', () => {
    const result = validateSuggestions([sug()], KNOWN, W, D);
    expect(result.valid).toHaveLength(1);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects an unknown plant_id', () => {
    const result = validateSuggestions([sug({ plant_id: 'p999' })], KNOWN, W, D);
    expect(result.valid).toHaveLength(0);
    expect(result.issues[0].kind).toBe('unknown_id');
  });

  it('rejects x out of bounds', () => {
    const result = validateSuggestions([sug({ x_metres: 7 })], KNOWN, W, D);
    expect(result.issues[0].kind).toBe('out_of_bounds');
  });

  it('rejects y out of bounds', () => {
    const result = validateSuggestions([sug({ y_metres: 11 })], KNOWN, W, D);
    expect(result.issues[0].kind).toBe('out_of_bounds');
  });

  it('allows positions within tolerance (0.1 m over)', () => {
    const result = validateSuggestions([sug({ x_metres: 6.05 })], KNOWN, W, D);
    // 6.05 is within 0.1 tolerance of W=6
    expect(result.valid).toHaveLength(1);
  });

  it('rejects negative quantity', () => {
    const result = validateSuggestions([sug({ quantity: 0 })], KNOWN, W, D);
    expect(result.issues[0].kind).toBe('negative_qty');
  });

  it('rejects non-integer quantity', () => {
    const result = validateSuggestions([sug({ quantity: 1.5 })], KNOWN, W, D);
    expect(result.issues[0].kind).toBe('negative_qty');
  });

  it('rejects duplicate position for same plant', () => {
    const s = sug();
    const result = validateSuggestions([s, { ...s }], KNOWN, W, D);
    expect(result.valid).toHaveLength(1);
    expect(result.issues[0].kind).toBe('duplicate_pos');
  });

  it('allows same plant at different positions', () => {
    const result = validateSuggestions(
      [sug({ x_metres: 1 }), sug({ x_metres: 3 })],
      KNOWN, W, D,
    );
    expect(result.valid).toHaveLength(2);
  });

  it('allows different plants at same position', () => {
    const result = validateSuggestions(
      [sug({ plant_id: 'p001' }), sug({ plant_id: 'p002' })],
      KNOWN, W, D,
    );
    expect(result.valid).toHaveLength(2);
  });
});

describe('isViable', () => {
  it('returns true when valid count >= minSuggestions', () => {
    const result = { valid: [sug(), sug({ x_metres: 3 }), sug({ x_metres: 4 }), sug({ x_metres: 5 })], issues: [] };
    expect(isViable(result)).toBe(true);
  });

  it('returns false when valid count < minSuggestions', () => {
    const result = { valid: [sug()], issues: [] };
    expect(isViable(result)).toBe(false);
  });
});
