/**
 * planTypes.ts — shared types for the code-drawn garden plan
 *
 * These are the ONLY types PlanSvg depends on. The shopping list uses the
 * same PlantPlacement structure so plant numbers can never disagree between
 * the drawing and the list.
 */

import type { SunLabel } from '@/lib/site-model/sun-grid';

export interface PlantPlacement {
  /** Plant number shown in the drawing and in the shopping list */
  number: number;
  /** Botanical or common name for the legend */
  name: string;
  /** Quantity at this placement (usually 1; groups share the same number) */
  quantity: number;
  /** Position in metres from bottom-left of the top-down plot */
  xMetres: number;
  yMetres: number;
  /** Mature spread in metres — sets circle radius */
  spreadMetres: number;
  /** Sun requirement — used to verify cell compatibility */
  light: SunLabel | 'full_sun' | 'part_shade' | 'shade';
}

export interface PlanSvgProps {
  /** Garden width in metres (left to right) */
  widthMetres: number;
  /** Garden depth in metres (front = bottom to rear = top in SVG) */
  depthMetres: number;
  /** Sun grid: grid[row][col], row 0 = rear, row (rows-1) = front */
  sunGrid?: SunLabel[][];
  /** Cell size in metres (must match the sun grid, usually 0.5 m) */
  cellSizeMetres?: number;
  /** Plants to draw */
  plants: PlantPlacement[];
  /**
   * Compass direction the camera faces (= direction of the rear boundary).
   * Used for the north arrow.  Default: 'N'.
   */
  cameraFacing?: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  /**
   * Seed for the hand-sketched wobble PRNG. Defaults to 42. Must be a
   * positive integer. The same seed always produces the same wobble, so a
   * given input set always renders identically.
   */
  seed?: number;
  /** SVG width in CSS px (default 600) */
  svgWidth?: number;
}
