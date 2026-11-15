/**
 * PlanSvg.tsx — Code-drawn top-down garden plan as pure SVG
 *
 * Renders on the server (RSC) and on the client. No browser APIs used.
 * No randomness — all visual variation is derived from a seeded PRNG so
 * the same props always produce the same drawing.
 *
 * Layout (SVG coordinate system: origin top-left, +y downward):
 *   - Rear of garden = top of SVG
 *   - Front of garden = bottom of SVG
 *   - sun grid rows: row 0 = rear (top), row (rows-1) = front (bottom)
 */

import type { PlanSvgProps, PlantPlacement } from './planTypes';
import type { SunLabel } from '@/lib/site-model/sun-grid';

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN = 48;         // px around the plan area
const SCALE_BAR_M = 2;     // metres represented by the scale bar
const WOBBLE_MAX = 1.8;    // max px wobble per line segment
const SUN_OPACITY  = 0.18;
const SHADE_OPACITY = 0.28;

// ─── Colour palette (Forest & Gold) ──────────────────────────────────────────

const COLOURS = {
  boundary: '#064e3b',
  grid:     '#c8d5cc',
  fullSun:  '#fef08a',   // faint yellow
  partShade:'#93c5fd',   // faint blue
  shade:    '#6366f1',   // faint indigo
  plant:    '#064e3b',
  plantFill:'#d1fae5',
  number:   '#064e3b',
  legend:   '#1a2e22',
  note:     '#64748b',
  north:    '#064e3b',
  scaleBar: '#374151',
  ink:      '#1a2e22',
};

// ─── Seeded PRNG (xorshift32) ─────────────────────────────────────────────────

function makePrng(seed: number) {
  let s = (seed >>> 0) || 1;
  return function rand(): number {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) / 0xffffffff);
  };
}

// ─── Wobble helpers ───────────────────────────────────────────────────────────

/**
 * Returns an SVG `d` attribute for a "hand-drawn" line from (x1,y1) to (x2,y2).
 * Adds up to `wobbleMax` px of perpendicular offset at a midpoint.
 */
function wobblyLine(
  x1: number, y1: number,
  x2: number, y2: number,
  rand: () => number,
  wobbleMax = WOBBLE_MAX,
): string {
  const mx = (x1 + x2) / 2 + (rand() - 0.5) * wobbleMax;
  const my = (y1 + y2) / 2 + (rand() - 0.5) * wobbleMax;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

/**
 * Returns an SVG `d` attribute for a closed quadrilateral with slightly
 * wobbly sides — gives the boundary an "inked on paper" look.
 */
function wobblyRect(
  x: number, y: number,
  w: number, h: number,
  rand: () => number,
): string {
  const tl = [x, y], tr = [x + w, y], br = [x + w, y + h], bl = [x, y + h];
  const pts = [tl, tr, br, bl, tl];
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const mx = (ax + bx) / 2 + (rand() - 0.5) * WOBBLE_MAX * 1.5;
    const my = (ay + by) / 2 + (rand() - 0.5) * WOBBLE_MAX * 1.5;
    if (i === 0) d += `M${ax},${ay} `;
    d += `Q${mx},${my} ${bx},${by} `;
  }
  return d;
}

// ─── Compass → north-arrow rotation ──────────────────────────────────────────

const COMPASS_TO_DEG: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

// ─── Main component ───────────────────────────────────────────────────────────

export function PlanSvg({
  widthMetres,
  depthMetres,
  sunGrid,
  cellSizeMetres = 0.5,
  plants,
  cameraFacing = 'N',
  seed = 42,
  svgWidth = 600,
}: PlanSvgProps) {
  const rand = makePrng(seed);

  // Plan area in px
  const planW = svgWidth - MARGIN * 2;
  const planH = planW * (depthMetres / widthMetres);
  const svgH = planH + MARGIN * 2 + 60; // extra for legend

  // Convert metres to px
  const mToPx = planW / widthMetres;

  // Top-left of the plan area in SVG coords
  const ox = MARGIN;
  const oy = MARGIN;

  // Helper: metres from plot origin → SVG px
  // x: 0=left, widthMetres=right
  // y: 0=front(bottom), depthMetres=rear(top)  → inverted in SVG
  function px(xm: number, ym: number): [number, number] {
    return [ox + xm * mToPx, oy + (depthMetres - ym) * mToPx];
  }

  // ── 1. Sun grid tinting ────────────────────────────────────────────────────
  const shadeRects: React.ReactNode[] = [];
  if (sunGrid && sunGrid.length > 0) {
    const rows = sunGrid.length;
    const cols = sunGrid[0]?.length ?? 0;
    const cellPx = cellSizeMetres * mToPx;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const label: SunLabel = sunGrid[row]?.[col] ?? 'full_sun';
        if (label === 'full_sun') continue;
        const fill = label === 'shade' ? COLOURS.shade : COLOURS.partShade;
        const opacity = label === 'shade' ? SHADE_OPACITY : SUN_OPACITY;
        // row 0 = rear (top of SVG), row (rows-1) = front (bottom)
        const xPx = ox + col * cellPx;
        const yPx = oy + row * cellPx;
        shadeRects.push(
          <rect
            key={`shade-${row}-${col}`}
            x={xPx} y={yPx}
            width={cellPx + 0.5} height={cellPx + 0.5}
            fill={fill} opacity={opacity}
          />
        );
      }
    }
  }

  // ── 2. 1 m grid ───────────────────────────────────────────────────────────
  const gridLines: React.ReactNode[] = [];
  for (let xm = 1; xm < widthMetres; xm++) {
    const [x1, y1] = [ox + xm * mToPx, oy];
    const [, y2] = [ox + xm * mToPx, oy + planH];
    gridLines.push(
      <path
        key={`gv-${xm}`}
        d={wobblyLine(x1, y1, x1, y2, rand, 0.8)}
        stroke={COLOURS.grid} strokeWidth={0.6} fill="none"
      />
    );
  }
  for (let ym = 1; ym < depthMetres; ym++) {
    const [x1, y1] = [ox, oy + ym * mToPx];
    const [x2] = [ox + planW, oy + ym * mToPx];
    gridLines.push(
      <path
        key={`gh-${ym}`}
        d={wobblyLine(x1, y1, x2, y1, rand, 0.8)}
        stroke={COLOURS.grid} strokeWidth={0.6} fill="none"
      />
    );
  }

  // ── 3. Boundary outline ────────────────────────────────────────────────────
  const boundaryPath = wobblyRect(ox, oy, planW, planH, rand);

  // ── 4. Plant circles ──────────────────────────────────────────────────────
  const plantElements: React.ReactNode[] = [];
  for (const plant of plants) {
    const [cx, cy] = px(plant.xMetres, plant.yMetres);
    const r = Math.max(5, (plant.spreadMetres / 2) * mToPx);
    // wobble the circle centre slightly
    const wx = cx + (rand() - 0.5) * 2;
    const wy = cy + (rand() - 0.5) * 2;
    plantElements.push(
      <g key={`plant-${plant.number}`}>
        <circle
          cx={wx} cy={wy} r={r}
          fill={COLOURS.plantFill} fillOpacity={0.6}
          stroke={COLOURS.plant} strokeWidth={1.4}
          strokeDasharray={`${r * 0.6} ${r * 0.2}`}
        />
        <text
          x={wx} y={wy + 4}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={Math.max(9, Math.min(13, r * 0.75))}
          fontFamily="Georgia, serif"
          fill={COLOURS.number}
          fontWeight="600"
        >
          {plant.number}
        </text>
      </g>
    );
  }

  // ── 5. North arrow ────────────────────────────────────────────────────────
  const arrowX = ox + planW - 28;
  const arrowY = oy + 28;
  const northRotation = COMPASS_TO_DEG[cameraFacing] ?? 0;
  // Camera faces rear boundary. North arrow rotates so the N tip points north.
  // "rear" is at the top of the SVG, cameraFacing says which compass direction is at the top.
  // So the north arrow (pointing to true north) must be rotated by 180° - cameraFacing degrees.
  const arrowRot = (180 - northRotation + 360) % 360;

  // ── 6. Scale bar ──────────────────────────────────────────────────────────
  const scaleBarPx = SCALE_BAR_M * mToPx;
  const sbX = ox + 10;
  const sbY = oy + planH + 14;

  // ── 7. Legend ─────────────────────────────────────────────────────────────
  // Deduplicate by number
  const seen = new Set<number>();
  const legendItems: PlantPlacement[] = [];
  for (const p of plants) {
    if (!seen.has(p.number)) {
      seen.add(p.number);
      legendItems.push(p);
    }
  }
  const legendY = oy + planH + 36;
  const legendCols = 2;
  const legendItemH = 15;
  const legendRows = Math.ceil(legendItems.length / legendCols);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${svgWidth} ${svgH}`}
      style={{ width: '100%', height: 'auto', maxWidth: svgWidth }}
      aria-label="Top-down garden planting plan"
      role="img"
    >
      <defs>
        <style>{`
          text { font-family: Georgia, serif; }
        `}</style>
      </defs>

      {/* Background */}
      <rect width={svgWidth} height={svgH} fill="#F8F9F8" />

      {/* Sun tinting */}
      {shadeRects}

      {/* 1 m grid */}
      {gridLines}

      {/* Boundary */}
      <path
        d={boundaryPath}
        stroke={COLOURS.boundary} strokeWidth={2.2}
        fill="none" strokeLinejoin="round"
      />

      {/* Plant circles */}
      {plantElements}

      {/* North arrow */}
      <g transform={`translate(${arrowX}, ${arrowY}) rotate(${arrowRot})`}>
        <line x1={0} y1={12} x2={0} y2={-12} stroke={COLOURS.north} strokeWidth={1.5} />
        <polygon points="0,-14 -5,-4 5,-4" fill={COLOURS.north} />
        <text x={0} y={20} textAnchor="middle" fontSize={9} fill={COLOURS.north} fontWeight="600">N</text>
      </g>

      {/* Scale bar */}
      <g>
        <line x1={sbX} y1={sbY} x2={sbX + scaleBarPx} y2={sbY} stroke={COLOURS.scaleBar} strokeWidth={1.5} />
        <line x1={sbX} y1={sbY - 3} x2={sbX} y2={sbY + 3} stroke={COLOURS.scaleBar} strokeWidth={1.5} />
        <line x1={sbX + scaleBarPx} y1={sbY - 3} x2={sbX + scaleBarPx} y2={sbY + 3} stroke={COLOURS.scaleBar} strokeWidth={1.5} />
        <text x={sbX + scaleBarPx / 2} y={sbY - 5} textAnchor="middle" fontSize={9} fill={COLOURS.scaleBar}>
          {SCALE_BAR_M} m
        </text>
      </g>

      {/* Indicative note */}
      <text
        x={ox + planW / 2} y={sbY}
        textAnchor="middle" fontSize={8.5}
        fill={COLOURS.note} fontStyle="italic"
      >
        Indicative plan, approximate scale
      </text>

      {/* Legend */}
      {legendItems.map((p, i) => {
        const col = i % legendCols;
        const row = Math.floor(i / legendCols);
        const lx = ox + col * (planW / legendCols);
        const ly = legendY + row * legendItemH;
        return (
          <g key={`leg-${p.number}`}>
            <circle cx={lx + 6} cy={ly + 4} r={5} fill={COLOURS.plantFill} stroke={COLOURS.plant} strokeWidth={1} />
            <text x={lx + 7} y={ly + 4} fontSize={6} fill={COLOURS.number} textAnchor="middle" dominantBaseline="middle" fontWeight="600">{p.number}</text>
            <text x={lx + 15} y={ly + 7} fontSize={8.5} fill={COLOURS.legend}>
              {p.name}
            </text>
          </g>
        );
      })}

      {/* Bottom padding rect for height */}
      <rect
        x={ox} y={legendY + legendRows * legendItemH + 4}
        width={1} height={1} fill="none"
      />
    </svg>
  );
}
