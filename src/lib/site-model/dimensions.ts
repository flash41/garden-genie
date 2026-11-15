/**
 * dimensions.ts — Recover top-down dimensions from a perspective photograph
 *
 * Given four corner points of a rectangular garden in a photo, one known
 * measurement (rear boundary width by default), and optional depth, this
 * module returns the width, depth, and area of the garden.
 *
 * When depth is NOT provided the algorithm estimates it using the standard
 * rectangle aspect-ratio recovery from vanishing points, as in Zhang and He's
 * whiteboard scanning method ("Document Rectification and Enhancement",
 * Zhang et al.). Key formula: for two sets of parallel lines (depth lines and
 * width lines), their vanishing points VP1 and VP2 must be conjugate with
 * respect to the absolute conic. Assuming square pixels and principal point
 * at the image centre this gives:
 *
 *   f² = − (a1·a2 + b1·b2)
 *
 * where (a1,b1) and (a2,b2) are the centred pixel coordinates of the two
 * vanishing points.
 *
 * Degenerate cases returned as { confidence: 'depth_required' }:
 *   – Near fronto-parallel view (VP very far from image → lines nearly parallel)
 *   – f² ≤ 0 (lines not orthogonal in 3D → invalid input or tilted camera)
 *   – Negative estimated depth
 */

import { computeHomography } from './homography';

export interface CornerPoints {
  /** Normalised [0,1] image coordinate — front-left corner of garden */
  frontLeft:  { x: number; y: number };
  /** Front-right corner */
  frontRight: { x: number; y: number };
  /** Rear-left corner */
  rearLeft:   { x: number; y: number };
  /** Rear-right corner */
  rearRight:  { x: number; y: number };
}

export type DimensionsConfidence =
  | 'measured'       // depth was provided by user
  | 'estimated'      // depth derived from vanishing points
  | 'depth_required' // geometry is degenerate — cannot estimate depth

export interface DimensionsResult {
  confidence: DimensionsConfidence;
  widthMetres: number;
  depthMetres: number;
  areaMetres: number;
  /** Set when confidence === 'depth_required' */
  reason?: string;
}

/**
 * Recover top-down garden dimensions.
 *
 * @param corners        Four corner points in normalised [0,1] image coords
 * @param pixelWidth     Image width in pixels (used for aspect-ratio recovery)
 * @param pixelHeight    Image height in pixels
 * @param knownMetres    The known measurement in metres
 * @param which          Whether the known measurement is the rear or front width (default 'rear')
 * @param depthMetres    Optional known depth — skips estimation if provided
 */
export function recoverDimensions(
  corners: CornerPoints,
  pixelWidth: number,
  pixelHeight: number,
  knownMetres: number,
  which: 'rear' | 'front' = 'rear',
  depthMetres?: number,
): DimensionsResult {
  const { frontLeft: fl, frontRight: fr, rearLeft: rl, rearRight: rr } = corners;

  // The known width — rear by default, front if specified.
  // We always call this "widthMetres" (the rear boundary).
  // If the measurement is the front boundary, the rear boundary is derived
  // from the homography scale ratio between front and rear.
  let widthMetres: number;
  let estimatedDepth: number;

  if (depthMetres !== undefined && depthMetres > 0) {
    // Depth supplied — use it directly.
    if (which === 'rear') {
      widthMetres = knownMetres;
    } else {
      // Front width supplied — scale to rear using homography
      widthMetres = scaleFrontToRear(corners, knownMetres);
    }
    return {
      confidence: 'measured',
      widthMetres,
      depthMetres,
      areaMetres: widthMetres * depthMetres,
    };
  }

  // --- Vanishing-point aspect-ratio recovery ---

  const W = pixelWidth;
  const H = pixelHeight;
  const cx = W / 2;
  const cy = H / 2;

  // Vanishing point of depth lines (intersection of left-side and right-side lines)
  const vp_depth = lineIntersect(
    [fl.x * W, fl.y * H], [rl.x * W, rl.y * H],
    [fr.x * W, fr.y * H], [rr.x * W, rr.y * H],
  );

  // Vanishing point of width lines (intersection of front and rear lines)
  const vp_width = lineIntersect(
    [fl.x * W, fl.y * H], [fr.x * W, fr.y * H],
    [rl.x * W, rl.y * H], [rr.x * W, rr.y * H],
  );

  if (!vp_depth || !vp_width) {
    return {
      confidence: 'depth_required',
      widthMetres: knownMetres,
      depthMetres: 0,
      areaMetres: 0,
      reason: 'Garden boundary lines appear parallel — cannot estimate depth without a measurement.',
    };
  }

  // Degenerate: VP is very far away (near fronto-parallel view).
  // Threshold: if VP is > 20× the larger image dimension from centre, unreliable.
  const diagThreshold = Math.max(W, H) * 20;
  const vpdDist = Math.hypot(vp_depth[0] - cx, vp_depth[1] - cy);
  const vpwDist = Math.hypot(vp_width[0] - cx, vp_width[1] - cy);
  if (vpdDist > diagThreshold || vpwDist > diagThreshold) {
    return {
      confidence: 'depth_required',
      widthMetres: knownMetres,
      depthMetres: 0,
      areaMetres: 0,
      reason: 'Near fronto-parallel view — garden lines are nearly parallel. Provide depth measurement.',
    };
  }

  // Orthogonality of VP directions gives focal length squared
  const a1 = vp_depth[0] - cx, b1 = vp_depth[1] - cy;
  const a2 = vp_width[0] - cx, b2 = vp_width[1] - cy;
  const fSq = -(a1 * a2 + b1 * b2);

  if (fSq <= 0) {
    return {
      confidence: 'depth_required',
      widthMetres: knownMetres,
      depthMetres: 0,
      areaMetres: 0,
      reason: 'Invalid perspective geometry (non-positive focal length squared). Provide depth measurement.',
    };
  }

  const f = Math.sqrt(fSq);

  // Build homography: top-down (u,v) → image pixels
  // Convention: (0,0) = rearLeft, (1,0) = rearRight, (0,1) = frontLeft, (1,1) = frontRight
  const H_inv = computeHomography(
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[rl.x * W, rl.y * H], [rr.x * W, rr.y * H],
     [fl.x * W, fl.y * H], [fr.x * W, fr.y * H]],
  );

  // Column vectors of H_inv (in pixel coords, homogeneous):
  // h1 = u-direction (rear-to-rear = width direction), h2 = v-direction (rear-to-front = depth)
  const h1 = [H_inv[0], H_inv[3], H_inv[6]]; // d(image_pix)/d(u)
  const h2 = [H_inv[1], H_inv[4], H_inv[7]]; // d(image_pix)/d(v)

  // Apply K^{-1} to get directions in normalised camera coords
  const n1 = vecNorm3(h1, cx, cy, f);
  const n2 = vecNorm3(h2, cx, cy, f);

  if (n1 === 0 || n2 === 0) {
    return {
      confidence: 'depth_required',
      widthMetres: knownMetres,
      depthMetres: 0,
      areaMetres: 0,
      reason: 'Degenerate homography — corners may be collinear.',
    };
  }

  // aspect_ratio = widthMetres / depthMetres = n1 / n2
  // (n1 is the magnitude corresponding to 1 unit in width, n2 for 1 unit in depth)
  const aspectRatio = n1 / n2; // > 1 means wider than deep

  if (which === 'rear') {
    widthMetres = knownMetres;
    estimatedDepth = knownMetres / aspectRatio;
  } else {
    // Front width was given — scale to rear via homography front/rear width ratio
    widthMetres = scaleFrontToRear(corners, knownMetres);
    estimatedDepth = widthMetres / aspectRatio;
  }

  if (estimatedDepth <= 0) {
    return {
      confidence: 'depth_required',
      widthMetres,
      depthMetres: 0,
      areaMetres: 0,
      reason: 'Negative estimated depth — check corner placement.',
    };
  }

  return {
    confidence: 'estimated',
    widthMetres,
    depthMetres: estimatedDepth,
    areaMetres: widthMetres * estimatedDepth,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Intersection of two lines defined by two points each. Returns null if parallel. */
function lineIntersect(
  p1: [number, number], p2: [number, number],
  p3: [number, number], p4: [number, number],
): [number, number] | null {
  const d1x = p2[0] - p1[0], d1y = p2[1] - p1[1];
  const d2x = p4[0] - p3[0], d2y = p4[1] - p3[1];
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-9) return null;
  const dx = p3[0] - p1[0], dy = p3[1] - p1[1];
  const t = (dx * d2y - dy * d2x) / cross;
  return [p1[0] + t * d1x, p1[1] + t * d1y];
}

/**
 * Compute |K^{-1} h| — the magnitude of a homogeneous image column vector
 * after applying the inverse camera calibration matrix.
 * K = diag(f, f, 1) with principal point (cx, cy).
 */
function vecNorm3(h: number[], cx: number, cy: number, f: number): number {
  const nx = (h[0] - cx * h[2]) / f;
  const ny = (h[1] - cy * h[2]) / f;
  const nz = h[2];
  return Math.sqrt(nx * nx + ny * ny + nz * nz);
}

/**
 * When the front width is given, estimate the rear width using the perspective
 * ratio derived from the corner positions.
 */
function scaleFrontToRear(corners: CornerPoints, frontWidthMetres: number): number {
  const { frontLeft: fl, frontRight: fr, rearLeft: rl, rearRight: rr } = corners;
  const frontSpan = Math.hypot(fr.x - fl.x, fr.y - fl.y);
  const rearSpan  = Math.hypot(rr.x - rl.x, rr.y - rl.y);
  if (frontSpan < 1e-9) return frontWidthMetres;
  return frontWidthMetres * (rearSpan / frontSpan);
}
