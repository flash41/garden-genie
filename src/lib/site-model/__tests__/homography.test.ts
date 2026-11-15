import { describe, it, expect } from 'vitest';
import { computeHomography, applyHomography } from '../homography';

describe('computeHomography / applyHomography', () => {
  it('maps a unit square to itself (identity)', () => {
    const pts: Array<[number, number]> = [[0,0],[1,0],[1,1],[0,1]];
    const H = computeHomography(pts, pts);
    for (const [x, y] of pts) {
      const [ox, oy] = applyHomography(H, x, y);
      expect(ox).toBeCloseTo(x, 8);
      expect(oy).toBeCloseTo(y, 8);
    }
  });

  it('maps a unit square to a translated square', () => {
    const src: Array<[number, number]> = [[0,0],[1,0],[1,1],[0,1]];
    const dst: Array<[number, number]> = [[2,3],[3,3],[3,4],[2,4]];
    const H = computeHomography(src, dst);
    for (let i = 0; i < 4; i++) {
      const [ox, oy] = applyHomography(H, src[i][0], src[i][1]);
      expect(ox).toBeCloseTo(dst[i][0], 6);
      expect(oy).toBeCloseTo(dst[i][1], 6);
    }
  });

  it('round-trips through forward and inverse homography', () => {
    // A realistic set of perspective control points (normalised image coords)
    const imgPoints: Array<[number, number]> = [
      [0.1, 0.8],  // front-left
      [0.9, 0.8],  // front-right
      [0.6, 0.35], // rear-right
      [0.4, 0.35], // rear-left
    ];
    const topDown: Array<[number, number]> = [[0,1],[1,1],[1,0],[0,0]];

    const H_fwd = computeHomography(imgPoints, topDown);
    const H_inv = computeHomography(topDown, imgPoints);

    for (let i = 0; i < 4; i++) {
      // Forward: image → top-down
      const [tx, ty] = applyHomography(H_fwd, imgPoints[i][0], imgPoints[i][1]);
      expect(tx).toBeCloseTo(topDown[i][0], 6);
      expect(ty).toBeCloseTo(topDown[i][1], 6);

      // Inverse: top-down → image
      const [ix, iy] = applyHomography(H_inv, topDown[i][0], topDown[i][1]);
      expect(ix).toBeCloseTo(imgPoints[i][0], 6);
      expect(iy).toBeCloseTo(imgPoints[i][1], 6);
    }
  });

  it('projects an interior point correctly', () => {
    // Rectangle: front at y=0.8, rear at y=0.35, left at x=0.1, right at x=0.9
    // The centre of the top-down rectangle (0.5, 0.5) should project to roughly the
    // centroid of the four trapezoid corners in the image.
    const imgPoints: Array<[number, number]> = [
      [0.1, 0.8],  // front-left
      [0.9, 0.8],  // front-right
      [0.6, 0.35], // rear-right
      [0.4, 0.35], // rear-left
    ];
    const topDown: Array<[number, number]> = [[0,1],[1,1],[1,0],[0,0]];
    const H_inv = computeHomography(topDown, imgPoints);
    // Centre of top-down (0.5, 0.5) → somewhere between front and rear
    const [ix, iy] = applyHomography(H_inv, 0.5, 0.5);
    expect(ix).toBeGreaterThan(0.3);
    expect(ix).toBeLessThan(0.7);
    expect(iy).toBeGreaterThan(0.4);
    expect(iy).toBeLessThan(0.75);
  });
});
