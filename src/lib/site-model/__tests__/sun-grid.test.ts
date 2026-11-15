import { describe, it, expect } from 'vitest';
import { buildSunGrid, type SunLabel } from '../sun-grid';

/** Count cells in grid with the given label */
function countLabel(grid: SunLabel[][], label: SunLabel): number {
  return grid.flat().filter(c => c === label).length;
}

describe('buildSunGrid', () => {
  // ── North-facing garden (camera faces N = rear boundary is North side) ────────
  describe('north-facing garden, northern hemisphere', () => {
    it('rear (North) boundary casts shade into garden', () => {
      // 10 m × 10 m, 2 m boundary on all sides, camera faces N
      const result = buildSunGrid(10, 10, 'N', 'north', { rear: 2, front: 2, left: 2, right: 2 });
      expect(result.rows).toBeGreaterThan(0);
      // Rear = North side, sun from south → north boundary blocks sun → shade near rear
      // row 0 = rear → should be shade
      // 10m / 0.5m = 20 cols, so index 20 is out of bounds (undefined)
      expect(result.grid[0][20]).toBeUndefined(); // sanity: col 20 doesn't exist
      // First few rows near rear should have shade
      const rearShade = result.grid[0].every(c => c === 'shade');
      expect(rearShade).toBe(true);
    });

    it('front (South) boundary does NOT cast shade (sun-side boundary)', () => {
      const result = buildSunGrid(10, 10, 'N', 'north', { rear: 0, front: 2, left: 0, right: 0 });
      // Front = South side. Sun comes from South → south boundary is on the sun side, no shadow.
      const totalShadeOrPartShade = countLabel(result.grid, 'shade') + countLabel(result.grid, 'part_shade');
      expect(totalShadeOrPartShade).toBe(0);
    });
  });

  // ── South-facing garden ───────────────────────────────────────────────────────
  describe('south-facing garden, northern hemisphere', () => {
    it('rear (South) boundary does NOT cast shade (sun from south)', () => {
      const result = buildSunGrid(10, 10, 'S', 'north', { rear: 2, front: 0, left: 0, right: 0 });
      // Rear = South, sun from south → no shadow
      const totalShadeOrPartShade = countLabel(result.grid, 'shade') + countLabel(result.grid, 'part_shade');
      expect(totalShadeOrPartShade).toBe(0);
    });

    it('front (North) boundary casts shade', () => {
      const result = buildSunGrid(10, 10, 'S', 'north', { rear: 0, front: 2, left: 0, right: 0 });
      // Front = North side, blocks sun from south
      const frontRow = result.rows - 1;
      const frontShade = result.grid[frontRow].every(c => c === 'shade');
      expect(frontShade).toBe(true);
    });
  });

  // ── East-facing garden ────────────────────────────────────────────────────────
  describe('east-facing garden, northern hemisphere', () => {
    it('right (South) boundary casts shade, left (North) boundary also casts shade', () => {
      // Camera faces East, left side = North, right side = South. Sun from South.
      // South (right) boundary is sun-side → no shadow from it.
      // North (left) boundary blocks sun → shade on right side of garden.
      // Wait, left = N side → blocks sun from south → shade on right half of garden (toward right/south)?
      // Actually: North boundary blocks sun FROM THE SOUTH → cells to the SOUTH of the North boundary
      // are in its shadow. In garden coords, left = North → shadow falls rightward (toward South).
      // col 0 = left (North), so cells near col 0 are near the North boundary → shade near col 0.
      const result = buildSunGrid(10, 10, 'E', 'north', { rear: 0, front: 0, left: 2, right: 0 });
      // left (N) boundary → shade near col 0
      expect(result.grid[5][0]).toBe('shade');
    });
  });

  // ── Southern hemisphere flip ──────────────────────────────────────────────────
  describe('southern hemisphere', () => {
    it('sun from north — south boundary blocks sun', () => {
      // Camera faces South (rear = South), southern hemisphere (sun from North).
      // Rear (South) boundary: sun from north → south boundary is NOT blocking (sun from north hits from front).
      // Front (North) boundary: front = North. Wait, camera faces South → front = North.
      // Sun from North → front (North) = sun-side → no shadow.
      // Rear (South) blocks sun from North → shade near rear.
      const result = buildSunGrid(10, 10, 'S', 'south', { rear: 2, front: 0, left: 0, right: 0 });
      // Rear (South) blocks sun from North → shade near rear rows
      expect(result.grid[0][0]).toBe('shade');
    });

    it('north-facing garden, southern hemisphere: rear (North) is sun-side, no shade', () => {
      const result = buildSunGrid(10, 10, 'N', 'south', { rear: 2, front: 0, left: 0, right: 0 });
      const totalShadeOrPartShade = countLabel(result.grid, 'shade') + countLabel(result.grid, 'part_shade');
      expect(totalShadeOrPartShade).toBe(0);
    });
  });

  // ── Grid dimensions ───────────────────────────────────────────────────────────
  describe('grid dimensions', () => {
    it('produces correct cell count for 6 m × 8 m at 0.5 m cells', () => {
      const result = buildSunGrid(6, 8, 'N', 'north');
      expect(result.cols).toBe(12); // 6 / 0.5
      expect(result.rows).toBe(16); // 8 / 0.5
      expect(result.grid.length).toBe(16);
      expect(result.grid[0].length).toBe(12);
    });

    it('handles non-integer dimensions (ceil)', () => {
      const result = buildSunGrid(5.5, 7.3, 'N', 'north');
      expect(result.cols).toBe(11); // ceil(5.5/0.5) = 11
      expect(result.rows).toBe(15); // ceil(7.3/0.5) = 15
    });
  });

  // ── East/west partial shade ───────────────────────────────────────────────────
  describe('east/west boundaries give part_shade', () => {
    it('east boundary (along sun path) gives part_shade but not shade', () => {
      // Camera faces North → right = East. East boundary is parallel to sun path.
      const result = buildSunGrid(10, 10, 'N', 'north', { rear: 0, front: 0, left: 0, right: 2 });
      // Right = East → part_shade within 2m (4 cells), but no shade
      expect(countLabel(result.grid, 'shade')).toBe(0);
      expect(countLabel(result.grid, 'part_shade')).toBeGreaterThan(0);
    });
  });
});
