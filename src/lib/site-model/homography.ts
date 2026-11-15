/**
 * homography.ts — 4-point planar homography
 *
 * Copied and adapted from the computeHomography / applyHomography functions
 * in src/inngest/functions/pipeline.ts. Those functions were originally
 * written to map between normalised photo coordinates and a top-down
 * rectangle; the maths is unchanged here, just extracted so the geometry
 * library can run without the Inngest runtime.
 *
 * All coordinate values are expected to be in [0,1] normalised space
 * (i.e. divided by image width/height), but the functions work correctly
 * for any consistent unit system.
 */

/**
 * Compute the 3×3 projective homography H (stored flat, row-major, 9 values)
 * that maps each src[i] → dst[i] for 4 point correspondences.
 *
 * Uses Gaussian elimination on the 8×8 DLT system.
 */
export function computeHomography(
  src: ReadonlyArray<readonly [number, number]>,
  dst: ReadonlyArray<readonly [number, number]>,
): number[] {
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = src[i];
    const [dx, dy] = dst[i];
    A.push([-sx, -sy, -1,  0,   0,   0, sx * dx, sy * dx, dx]);
    A.push([ 0,   0,   0, -sx, -sy, -1, sx * dy, sy * dy, dy]);
  }

  const n = 8;
  const b: number[] = A.map(row => -row[8]);
  const M: number[][] = A.map(row => row.slice(0, 8));

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    [b[col], b[maxRow]] = [b[maxRow], b[col]];
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j < n; j++) M[row][j] -= factor * M[col][j];
      b[row] -= factor * b[col];
    }
  }

  const h: number[] = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    h[i] = b[i];
    for (let j = i + 1; j < n; j++) h[i] -= M[i][j] * h[j];
    h[i] /= M[i][i];
  }
  return [...h, 1]; // h33 = 1
}

/**
 * Apply homography h (9-element flat row-major matrix) to point (x, y).
 * Returns the projected (x', y') after dividing by the homogeneous weight.
 */
export function applyHomography(
  h: ReadonlyArray<number>,
  x: number,
  y: number,
): [number, number] {
  const w = h[6] * x + h[7] * y + h[8];
  return [
    (h[0] * x + h[1] * y + h[2]) / w,
    (h[3] * x + h[4] * y + h[5]) / w,
  ];
}
