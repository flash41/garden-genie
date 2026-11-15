/**
 * sun-grid.ts — Rule-of-thumb sun/shade grid for a rectangular garden
 *
 * Divides the plot into 0.5 m cells and labels each cell as
 * 'full_sun', 'part_shade', or 'shade'.
 *
 * RULE OF THUMB (documented as such — not a full solar simulation):
 *
 * The camera faces toward the rear boundary, so the compass direction the
 * camera faces IS the direction of the rear boundary. E.g. if the camera
 * faces North, the rear boundary is on the North side.
 *
 * Sun path: Northern Hemisphere — sun is primarily from the South.
 *           Southern Hemisphere — sun is primarily from the North.
 *
 * For each boundary that runs PERPENDICULAR to the sun path
 * (i.e. the boundary casts a long shadow into the garden):
 *   - Cells within 1× boundary height: shade
 *   - Cells within 2× boundary height: part_shade
 *
 * For boundaries running ALONG (parallel to) the sun path
 * (east or west sides), their shadow sweeps across the garden daily:
 *   - Cells within 1× boundary height from that boundary: part_shade
 *
 * Everything else: full_sun
 *
 * When multiple rules apply to a cell, the most restrictive wins
 * (shade > part_shade > full_sun).
 *
 * Compass directions: N, NE, E, SE, S, SW, W, NW (the direction the camera faces
 * = the direction of the rear boundary).
 */

export type SunLabel = 'full_sun' | 'part_shade' | 'shade';

export type Compass = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface BoundaryHeights {
  rear:  number; // height of rear boundary in metres (default 1.8)
  front: number;
  left:  number;
  right: number;
}

export interface SunGridResult {
  widthMetres: number;
  depthMetres: number;
  cellSizeMetres: number;
  /** cols = Math.ceil(widthMetres / cellSize), rows = Math.ceil(depthMetres / cellSize) */
  cols: number;
  rows: number;
  /**
   * grid[row][col] — row 0 is the REAR of the garden (furthest from camera),
   * row (rows-1) is the FRONT. col 0 is the left side.
   */
  grid: SunLabel[][];
}

const CELL = 0.5; // metres per cell

export function buildSunGrid(
  widthMetres: number,
  depthMetres: number,
  cameraFacesDirection: Compass,
  hemisphere: 'north' | 'south',
  heights: Partial<BoundaryHeights> = {},
): SunGridResult {
  const h: BoundaryHeights = {
    rear:  heights.rear  ?? 1.8,
    front: heights.front ?? 1.8,
    left:  heights.left  ?? 1.8,
    right: heights.right ?? 1.8,
  };

  const cols = Math.ceil(widthMetres / CELL);
  const rows = Math.ceil(depthMetres / CELL);

  // Which cardinal direction does the sun come FROM?
  // Northern hemisphere: sun is from the south → cast shadows toward north
  // Southern hemisphere: sun is from the north → cast shadows toward south
  const sunFrom: 'south' | 'north' = hemisphere === 'north' ? 'south' : 'north';

  // Map the garden's physical sides using the camera direction (= direction to rear boundary).
  // "rear" in garden coords = cameraFacesDirection in compass.
  const sides = gardenSideDirections(cameraFacesDirection);

  // Initialise all cells to full_sun
  const grid: SunLabel[][] = Array.from({ length: rows }, () =>
    Array<SunLabel>(cols).fill('full_sun'),
  );

  // For each boundary, apply its shadow rules.
  // A boundary on the north side (facing south toward the garden), in northern hemisphere
  // (sun from south), is on the sun-side → no shadow cast INTO the garden from that boundary.
  // A boundary on the south side (facing north), in northern hemisphere, casts shadow northward.

  const boundaryList: Array<{
    side: 'rear' | 'front' | 'left' | 'right';
    direction: Compass;
    height: number;
  }> = [
    { side: 'rear',  direction: sides.rear,  height: h.rear  },
    { side: 'front', direction: sides.front, height: h.front },
    { side: 'left',  direction: sides.left,  height: h.left  },
    { side: 'right', direction: sides.right, height: h.right },
  ];

  for (const boundary of boundaryList) {
    applyShadow(grid, cols, rows, boundary.side, boundary.direction, boundary.height, sunFrom);
  }

  return { widthMetres, depthMetres, cellSizeMetres: CELL, cols, rows, grid };
}

// ─── Shadow application ───────────────────────────────────────────────────────

function applyShadow(
  grid: SunLabel[][],
  cols: number,
  rows: number,
  side: 'rear' | 'front' | 'left' | 'right',
  boundaryCompass: Compass,
  height: number,
  sunFrom: 'south' | 'north',
): void {
  if (height <= 0) return;

  const shadeCells  = Math.ceil(height / CELL);       // cells within 1× height → shade
  const partShCells = Math.ceil((height * 2) / CELL); // cells within 2× height → part_shade

  // Determine whether this boundary is "blocking the sun" or "along the sun path"
  const isSunBlocking = isOpposedToSun(boundaryCompass, sunFrom);
  const isAlongSunPath = isParallelToSunPath(boundaryCompass, sunFrom);

  if (!isSunBlocking && !isAlongSunPath) return; // sun-side boundary, no shadow cast

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let distCells: number;

      if (side === 'rear') {
        distCells = row; // row 0 = rear
      } else if (side === 'front') {
        distCells = rows - 1 - row; // row (rows-1) = front
      } else if (side === 'left') {
        distCells = col; // col 0 = left
      } else {
        distCells = cols - 1 - col; // col (cols-1) = right
      }

      let label: SunLabel;
      if (isSunBlocking) {
        if (distCells < shadeCells)   label = 'shade';
        else if (distCells < partShCells) label = 'part_shade';
        else continue;
      } else {
        // Along sun path — part_shade within 1× height
        if (distCells < shadeCells) label = 'part_shade';
        else continue;
      }

      if (moreRestrictive(label, grid[row][col])) {
        grid[row][col] = label;
      }
    }
  }
}

function moreRestrictive(a: SunLabel, b: SunLabel): boolean {
  const rank: Record<SunLabel, number> = { shade: 2, part_shade: 1, full_sun: 0 };
  return rank[a] > rank[b];
}

/**
 * Returns true if the boundary is on the SHADED side of the garden
 * (i.e. it blocks sunlight coming from sunFrom and casts shadow INTO the garden).
 *
 * Sun from south means a SOUTH-side boundary is a sun-side boundary (no shadow).
 * A NORTH-side boundary is on the shaded side (casts shadow southward into garden).
 */
function isOpposedToSun(dir: Compass, sunFrom: 'south' | 'north'): boolean {
  // A boundary on the OPPOSITE side of where sun comes from casts shadow INTO the garden.
  if (sunFrom === 'south') {
    // Sun from south → north-side boundaries cast shadow
    return compassHasNorth(dir);
  } else {
    // Sun from north → south-side boundaries cast shadow
    return compassHasSouth(dir);
  }
}

/**
 * Returns true if the boundary runs roughly parallel to the sun's east-west path
 * (i.e. is an east or west boundary). These sweep shadow across the garden.
 */
function isParallelToSunPath(dir: Compass, _sunFrom: 'south' | 'north'): boolean {
  return dir === 'E' || dir === 'W';
}

function compassHasNorth(dir: Compass): boolean {
  return dir === 'N' || dir === 'NE' || dir === 'NW';
}

function compassHasSouth(dir: Compass): boolean {
  return dir === 'S' || dir === 'SE' || dir === 'SW';
}

// ─── Compass helpers ──────────────────────────────────────────────────────────

interface GardenSides {
  rear:  Compass;
  front: Compass;
  left:  Compass;
  right: Compass;
}

/**
 * Given the direction the camera faces (= direction of the rear boundary),
 * return the compass direction of each garden side.
 *
 * Camera faces North → rear = North, front = South, left = West, right = East.
 */
function gardenSideDirections(cameraFacing: Compass): GardenSides {
  const opposites: Record<Compass, Compass> = {
    N: 'S', NE: 'SW', E: 'W', SE: 'NW',
    S: 'N', SW: 'NE', W: 'E', NW: 'SE',
  };
  const leftOf: Record<Compass, Compass> = {
    N: 'W', NE: 'NW', E: 'N', SE: 'NE',
    S: 'E', SW: 'SE', W: 'S', NW: 'SW',
  };
  const rightOf: Record<Compass, Compass> = {
    N: 'E', NE: 'SE', E: 'S', SE: 'SW',
    S: 'W', SW: 'NW', W: 'N', NW: 'NE',
  };

  return {
    rear:  cameraFacing,
    front: opposites[cameraFacing],
    left:  leftOf[cameraFacing],
    right: rightOf[cameraFacing],
  };
}
