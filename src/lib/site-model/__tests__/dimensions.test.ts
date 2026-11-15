/**
 * dimensions.test.ts
 *
 * Uses a synthetic perspective projection of a 6 m × 10 m rectangular garden
 * with a camera rotated 15° around the vertical axis (so width lines are NOT
 * horizontal and both vanishing points are finite). This allows the VP-based
 * focal-length estimation to work, which requires two finite VPs.
 *
 * Camera setup: f=600px, 1200×900, at (0, 0, 1.5m), looking at (0, 10, 0)
 * and rotated 15° around the world-Z axis (compass turn). This gives all four
 * corners safely inside [0,1] image space.
 */
import { describe, it, expect } from 'vitest';
import { recoverDimensions, type CornerPoints } from '../dimensions';

// ─── Camera constants ─────────────────────────────────────────────────────────

const F  = 600;
const W  = 1200, H  = 900;
const CX = 600,  CY = 450;

// 15° rotation around world Z (compass bearing)
const DEG15 = (15 * Math.PI) / 180;
const c15 = Math.cos(DEG15), s15 = Math.sin(DEG15);

// Camera at (0, 0, 1.5), pointing toward (0, 10, 0):
// Look direction before rotation (unnorm): (0, 10, -1.5)
// Camera right before rotation: (1, 0, 0)
// After rotating both by 15° around Z:
//   zc = (-s15*0.9889, c15*0.9889, -0.1483) where 0.9889=10/10.112, 0.1483=1.5/10.112
//   xc = (c15, s15, 0)
// Camera down (yc): precomputed so that yc = zc × xc and z-component < 0

const zc = [-s15 * 0.98893, c15 * 0.98893, -0.14834];
const xc = [c15, s15, 0];
// yc = zc × xc
const yc = [
  zc[1] * xc[2] - zc[2] * xc[1],
  zc[2] * xc[0] - zc[0] * xc[2],
  zc[0] * xc[1] - zc[1] * xc[0],
];

// Camera position in world
const CAM = [0, 0, 1.5];

function projectPoint(xw: number, yw: number): { x: number; y: number } {
  const dx = xw - CAM[0], dy = yw - CAM[1], dz = 0 - CAM[2];
  const pcX = xc[0] * dx + xc[1] * dy + xc[2] * dz;
  const pcY = yc[0] * dx + yc[1] * dy + yc[2] * dz;
  const pcZ = zc[0] * dx + zc[1] * dy + zc[2] * dz;
  return {
    x: (F * pcX / pcZ + CX) / W,
    y: (F * pcY / pcZ + CY) / H,
  };
}

function buildCorners(wM: number, dM: number, startY = 5): CornerPoints {
  const hw = wM / 2;
  return {
    frontLeft:  projectPoint(-hw, startY),
    frontRight: projectPoint( hw, startY),
    rearLeft:   projectPoint(-hw, startY + dM),
    rearRight:  projectPoint( hw, startY + dM),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('recoverDimensions', () => {
  it('all synthetic corners are within [0,1] image range', () => {
    const c = buildCorners(6, 10);
    for (const pt of [c.frontLeft, c.frontRight, c.rearLeft, c.rearRight]) {
      expect(pt.x).toBeGreaterThan(0);
      expect(pt.x).toBeLessThan(1);
      expect(pt.y).toBeGreaterThan(0);
      expect(pt.y).toBeLessThan(1);
    }
  });

  it('recovers a 6 m × 10 m garden within 5%', () => {
    const corners = buildCorners(6, 10);
    const result = recoverDimensions(corners, W, H, 6, 'rear');
    expect(result.confidence).toBe('estimated');
    expect(result.widthMetres).toBeCloseTo(6, 2);
    const relErr = Math.abs(result.depthMetres - 10) / 10;
    expect(relErr).toBeLessThan(0.05);
  });

  it('recovers a 4 m × 8 m garden within 5%', () => {
    const corners = buildCorners(4, 8);
    const result = recoverDimensions(corners, W, H, 4, 'rear');
    expect(result.confidence).toBe('estimated');
    const relErr = Math.abs(result.depthMetres - 8) / 8;
    expect(relErr).toBeLessThan(0.05);
  });

  it('uses provided depth directly (confidence = measured)', () => {
    const corners = buildCorners(6, 10);
    const result = recoverDimensions(corners, W, H, 6, 'rear', 10);
    expect(result.confidence).toBe('measured');
    expect(result.widthMetres).toBeCloseTo(6, 4);
    expect(result.depthMetres).toBeCloseTo(10, 4);
    expect(result.areaMetres).toBeCloseTo(60, 4);
  });

  it('returns depth_required for straight-on symmetric view (VP at principal point)', () => {
    // Classic straight-on garden photo: front and rear boundaries are horizontal.
    // Both width-line VPs at infinity → lineIntersect returns null → depth_required.
    const corners: CornerPoints = {
      frontLeft:  { x: 0.1,  y: 0.75 },
      frontRight: { x: 0.9,  y: 0.75 },
      rearLeft:   { x: 0.35, y: 0.35 },
      rearRight:  { x: 0.65, y: 0.35 },
    };
    const result = recoverDimensions(corners, W, H, 6, 'rear');
    expect(result.confidence).toBe('depth_required');
    expect(result.reason).toBeTruthy();
  });

  it('computes area correctly when depth is provided', () => {
    const corners = buildCorners(5, 12);
    const result = recoverDimensions(corners, W, H, 5, 'rear', 12);
    expect(result.areaMetres).toBeCloseTo(60, 4);
  });

  it('returns depth_required when both depth-line slopes are parallel (rectangular trapezoid)', () => {
    // Perfectly rectangular (not trapezoidal) — depth lines are vertical → VP at infinity
    const corners: CornerPoints = {
      frontLeft:  { x: 0.1, y: 0.8 },
      frontRight: { x: 0.9, y: 0.8 },
      rearLeft:   { x: 0.1, y: 0.2 },
      rearRight:  { x: 0.9, y: 0.2 },
    };
    const result = recoverDimensions(corners, W, H, 8, 'rear');
    expect(result.confidence).toBe('depth_required');
  });
});
