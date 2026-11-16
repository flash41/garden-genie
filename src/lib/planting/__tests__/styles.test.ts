import { describe, it, expect } from 'vitest';
import plants from '../../../data/plants-fixture.json';
import { GARDEN_STYLE_IDS, MAX_STYLES, cleanStyleSelection } from '../styles';

describe('garden styles', () => {
  it('every plant has at least one style, all from the fixed list', () => {
    for (const p of plants as { id: string; style_tags: string[] }[]) {
      expect(p.style_tags.length, p.id).toBeGreaterThan(0);
      for (const t of p.style_tags) expect(GARDEN_STYLE_IDS, `${p.id}: ${t}`).toContain(t);
    }
  });

  it('every style has enough plants to build a plan from', () => {
    for (const id of GARDEN_STYLE_IDS) {
      const n = (plants as { style_tags: string[] }[]).filter(p => p.style_tags.includes(id)).length;
      expect(n, id).toBeGreaterThanOrEqual(12);
    }
  });

  it('cleans a selection: drops unknowns and duplicates, caps the count', () => {
    expect(cleanStyleSelection(['cottage', 'nonsense', 'cottage', 42])).toEqual(['cottage']);
    expect(cleanStyleSelection(GARDEN_STYLE_IDS as unknown[]).length).toBe(MAX_STYLES);
    expect(cleanStyleSelection('cottage')).toEqual([]);
  });
});
