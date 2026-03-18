'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import PDFButton from "@/components/PDFButton";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CREATIVITY_LEVELS = [
  { level: 1, name: "Minimal",          description: "Potted plants, loose stone or gravel surfaces, minor soft landscaping only. No structural changes. Garden remains recognisably the same." },
  { level: 2, name: "Subtle",           description: "In-ground border planting added, lawn retained, simple low-maintenance planting scheme. One or two new surface materials introduced." },
  { level: 3, name: "Considered",       description: "Lawn partially replaced, defined planting zones, new path or edging treatment, moderate planting variety. A clearly designed garden but not radically different." },
  { level: 4, name: "Ambitious",        description: "Significant replanting, new hard surface areas, structural planting including shrubs and small trees, possible level change or raised bed. Garden transformed but practical." },
  { level: 5, name: "Full transformation", description: "Complete redesign. Extensive hard landscaping, architectural planting, water features or focal structures possible, full in-ground planting scheme. Garden unrecognisable from original." },
];

const DESIGN_LANGUAGES = [
  { value: "japanese-zen",        label: "Japanese Zen" },
  { value: "english-cottage",     label: "English Cottage" },
  { value: "city-garden",         label: "City Garden" },
  { value: "mediterranean",       label: "Mediterranean" },
  { value: "modern-minimalist",   label: "Modern Minimalist" },
  { value: "wildlife-garden",     label: "Wildlife & Pollinator Garden" },
  { value: "kitchen-garden",      label: "Kitchen & Herb Garden" },
  { value: "tropical-lush",       label: "Tropical & Lush" },
  { value: "nordic-naturalistic", label: "Nordic Naturalistic" },
  { value: "formal-classical",    label: "Formal Classical" },
];

const GEMINI_MODEL = "gemini-2.5-flash";

// ── SYSTEM PROMPT — plain English, no poetic language ────────────────────────
const SYSTEM_PROMPT = `You are a a landscape architect and botanist producing professional garden design proposals.

TONE AND LANGUAGE RULES — CRITICAL:
- Write in plain, direct English throughout. 
- No poetic descriptions, metaphors, or flowery language.
- Write as you would in a professional technical report: factual, specific, and concise.
- Bad example: "A verdant tapestry of undulating textures cascades across the sunlit canvas"
- Good example: "A mix of low-growing perennials and ornamental grasses fills the border"
- Descriptions should state what something is and what it does, not how it feels.

You MUST return ONLY a valid JSON object (no markdown fences, no commentary) matching this exact schema:

{
  "overview": {
    "tagline": "string — one factual headline summarising the design outcome",
    "scopeDescription": "string — 3-4 sentences describing the project scope in plain terms",
    "objectives": ["4-6 specific, measurable design objectives"],
    "estimatedAreaSqm": number
  },
  "siteAnalysis": {
    "sunProfile": {
      "primaryOrientation": "N|NE|E|SE|S|SW|W|NW",
      "morningLight": "Full Sun|Partial Shade|Full Shade|Variable",
      "afternoonLight": "Full Sun|Partial Shade|Full Shade|Variable",
      "shadingElements": ["string array"]
    },
    "soil": {
      "type": "Clay|Sandy|Loam|Chalky|Peaty|Silty|Unknown",
      "drainageRating": 1,
      "drainageNotes": "string",
      "recommendedAmendments": ["string array"]
    },
    "hardinessZone": "string e.g. USDA Zone 8b",
    "existingFeatures": [
      { "id": "F1", "label": "string", "type": "Tree|Structure|Wall|Path|Water|Utility|Other", "disposition": "Retain|Remove|Relocate|Repurpose", "notes": "string" }
    ],
    "microclimates": [
      { "zone": "string", "description": "string", "impact": "Positive|Negative|Neutral" }
    ],
    "topographyNotes": "string",
    "accessConstraints": "string"
  },
  "designConcept": {
    "conceptStatement": "string — 3-4 sentences describing the design approach plainly",
    "rationale": "string — factual explanation of why this design suits the site",
    "principles": ["4-6 specific design principles"],
    "colourPalette": ["hex or named colour strings"],
    "materialMoods": ["string array of material types"]
  },
  "spatialLayout": {
    "zones": [
      { "id": "Z1", "name": "string", "type": "Entertainment|Contemplation|Utility|Planting Bed|Water Feature|Children's Area|Kitchen Garden|Entrance|Transition", "areaSqm": 0, "description": "string", "sightLineNotes": "string" }
    ],
    "circulationRoutes": [
      { "id": "R1", "from": "zone id", "to": "zone id", "surfaceTreatment": "string", "widthM": 0, "notes": "string" }
    ],
    "compositionNotes": "string",
    "focalPoints": ["string array"]
  },
  "plantingSpecification": {
    "plants": [
      {
        "id": "P1",
        "botanicalName": "string",
        "commonName": "string",
        "cultivar": "string or null",
        "type": "Tree|Shrub|Perennial|Annual|Grass|Groundcover|Climber|Fern|Bamboo|Bulb",
        "quantity": 0,
        "matureSize": "string e.g. 3-4m H x 2-3m W",
        "spacingM": 0,
        "sunRequirement": "Full Sun|Partial Shade|Full Shade|Variable",
        "waterRequirement": "Low|Moderate|High",
        "hardinessRating": "string",
        "growthRate": "Slow|Moderate|Fast",
        "seasonalInterest": { "spring": "string", "summer": "string", "autumn": "string", "winter": "string" },
        "designRationale": "string — plain explanation of why this plant was chosen",
        "layer": "Canopy|Understorey|Shrub|Ground|Climber",
        "gridLocation": "string e.g. B3 or C4-D5",
        "zoneIds": ["zone id strings"]
      }
    ],
    "layeringStrategy": "string",
    "densityNotes": "string",
    "seasonalNarrative": "string — plain description of how the garden changes through the year"
  },
  "hardscapeSpecification": {
    "materials": [
      { "id": "M1", "element": "string", "material": "string", "finish": "string", "colour": "string", "unitCostRange": "string", "notes": "string" }
    ],
    "boundaryTreatments": ["string array"],
    "waterFeatures": ["string array"],
    "focalStructures": ["string array"],
    "lighting": [
      { "id": "L1", "type": "Uplighter|Path Light|Flood|String|Feature|Underwater", "location": "string", "colourTempK": 0, "notes": "string" }
    ],
    "paletteNarrative": "string"
  },
  "soilAndIrrigation": {
    "soilPreparationPlan": "string",
    "drainageStrategy": "string",
    "mulchingRecommendation": "string",
    "irrigationZones": [
      { "id": "I1", "name": "string", "type": "Drip|Spray|Micro-spray|Soaker Hose|Manual", "coverageAreaSqm": 0, "notes": "string" }
    ],
    "rainwaterHarvestingNotes": "string"
  },
  "implementationPlan": {
    "tasks": [
      { "id": "T1", "phase": "Phase 1 — Hardscape|Phase 2 — Planting|Phase 3 — Finishing", "task": "string", "estimatedDays": 0, "notes": "string" }
    ],
    "totalWeeks": 0,
    "criticalPathNotes": "string"
  },
  "maintenanceSchedule": {
    "tasks": [
      { "season": "Spring|Summer|Autumn|Winter", "task": "string", "frequency": "Weekly|Fortnightly|Monthly|Annually|As Required", "notes": "string" }
    ],
    "annualPruningRegime": "string",
    "feedingSchedule": "string",
    "longTermManagementNotes": "string",
    "professionalVisitsPerYear": 0
  },
  "costEstimate": {
    "currency": "GBP",
    "lines": [
      { "category": "string", "description": "string", "low": 0, "high": 0, "notes": "string" }
    ],
    "contingencyPercent": 15,
    "costingNotes": "string"
  },
  "visualPrompt": "string — detailed description for image generation of the redesigned garden",
  "confidence": 0.0,
  "caveats": ["string array"]
}

GRID INSTRUCTION: The image has a 6-column x 6-row reference grid (columns A-F, rows 1-6).
Assign every plant a gridLocation string (e.g. "B3", "C4-D5") based on the visible site layout.
Design language: DESIGN_LANGUAGE_PLACEHOLDER
All plants must suit the observed hardiness zone and site conditions.`;

// ─── DESIGN TOKENS — Modern Professional ─────────────────────────────────────

const C = {
  // Core palette
  brand:       "#0a3d2b",      // deep forest green
  brandMid:    "#1a5c3f",      // mid forest green
  brandLight:  "#e8f5ee",      // light green tint
  accent:      "#b8962e",      // antique gold
  accentLight: "#f8f0d8",      // pale gold tint

  // Neutrals — parchment palette
  ink:         "#2C1A0E",      // umber (near-black warm)
  inkMid:      "#4a3928",      // warm brown body text
  inkLight:    "#8a7e6e",      // warm grey secondary
  rule:        "#d9cdb8",      // cream-dark borders
  ruleDark:    "#c8bcaa",      // darker rule
  surface:     "#F4EFE4",      // parchment page bg
  card:        "#EDE6D3",      // linen card bg

  // Semantic
  red:         "#b91c1c",
  green:       "#166534",
  amber:       "#92400e",
  blue:        "#1e40af",

  // Radius & shadow
  r:           "4px",
  rLg:         "8px",
  shadow:      "0 1px 3px rgba(44,26,14,0.07)",
  shadowMd:    "0 4px 12px rgba(44,26,14,0.10)",

  // Fonts
  font:        "'DM Sans', 'Inter', 'Helvetica Neue', Arial, sans-serif",
  fontSerif:   "'Playfair Display', Georgia, serif",
};

// Base font size — 16px matches standard report body text
const BASE = 16;
const px = (n: number) => `${n}px`;

// ─── GRID OVERLAY CANVAS ──────────────────────────────────────────────────────

// ── Perspective + boundary helpers ────────────────────────────────────────────

function pointInPolygon(px: number, py: number, poly: Array<{x: number; y: number}>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function clampToBoundary(
  px: number, py: number,
  poly: Array<{x: number; y: number}>,
): {x: number; y: number} {
  if (pointInPolygon(px, py, poly)) return { x: px, y: py };
  const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
  // Binary search along line from centroid toward point — find last inside position
  let lo = 0, hi = 1, t = 0.5;
  for (let iter = 0; iter < 14; iter++) {
    const tx = cx + (px - cx) * t;
    const ty = cy + (py - cy) * t;
    if (pointInPolygon(tx, ty, poly)) { lo = t; } else { hi = t; }
    t = (lo + hi) / 2;
  }
  return { x: cx + (px - cx) * lo * 0.92, y: cy + (py - cy) * lo * 0.92 };
}

/** Maps a flat A–F × 1–6 grid position to perspective pixel coordinates on a photo.
 *  gridZ: real-world height above ground in metres (0.0 = ground level).
 *  calibHeightMetres: real height of the scale calibration object.
 *  calibPixelHeightPct: pixel height of calibration object as % of image height.
 *  foregroundYPercent: Y position of the foreground edge as % from top (default 85).
 */
function applyPerspectiveTransform(
  colIndex: number,   // 0–5 (A=0, F=5)
  rowIndex: number,   // 0–5 (row 1=0=rear, row 6=5=front)
  W: number, H: number,
  horizonLinePercent: number,
  vanishingPointXPercent: number,
  gridZ: number = 0,
  calibHeightMetres: number = 1.8,
  calibPixelHeightPct: number = 20,
  foregroundYPercent: number = 85,
): { x: number; y: number; scale: number } {
  const horizonY = H * (horizonLinePercent / 100);
  const frontY   = H * (foregroundYPercent / 100);
  const vpX      = W * (vanishingPointXPercent / 100);
  // t = 0 → rear (row 0), t = 1 → front (row 5)
  const t = rowIndex / 5;
  // Y: power curve compresses distant rows near the horizon
  const groundY = horizonY + (frontY - horizonY) * Math.pow(t, 1.8);
  // X: columns converge toward vanishing point at rear
  const colNorm = (colIndex + 0.5) / 6;
  const x = vpX + (colNorm * W - vpX) * t;
  // Marker scale: smaller at rear, full-size at front
  const scale = 0.50 + 0.50 * t;

  // Height offset: raised elements (gridZ > 0) appear higher in the photo.
  // Calibration gives pixels-per-metre at the rear (where calibration objects typically sit).
  // At depth t, apparent size scales with perspective (rear scale = 0.5, front = 1.0).
  let y = groundY;
  if (gridZ > 0 && calibHeightMetres > 0 && calibPixelHeightPct > 0) {
    const pixelsPerMetreBase = (H * calibPixelHeightPct / 100) / calibHeightMetres;
    const perspectiveScale = scale / 0.5; // normalise relative to rear scale
    y = groundY - gridZ * pixelsPerMetreBase * perspectiveScale;
  }

  return { x, y, scale };
}

interface PerspectiveData {
  horizonLinePercent: number;
  vanishingPointXPercent: number;
  cameraElevationAngle?: number;
  scaleCalibrationHeightMetres?: number;
  scaleCalibrationPixelHeightPercent?: number;
  foregroundYPercent?: number;
}
type BoundaryPolygon = Array<{ x: number; y: number }>;

function drawGridOverlay(
  canvas: HTMLCanvasElement,
  plants: any[],
  showMarkers: boolean = true,
  perspectiveData?: PerspectiveData | null,
  boundaryPolygon?: BoundaryPolygon | null,
  showGrid: boolean = true,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const COLS = 6, ROWS = 6;
  const colW = W / COLS;
  const rowH = H / ROWS;
  const LABELS = ['A','B','C','D','E','F'];

  if (showGrid) {
    // Interior grid lines only
    ctx.strokeStyle = 'rgba(184,150,46,0.45)';
    ctx.lineWidth = Math.max(1, W / 600);
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * colW, 0); ctx.lineTo(i * colW, H); ctx.stroke();
    }
    for (let i = 1; i < ROWS; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * rowH); ctx.lineTo(W, i * rowH); ctx.stroke();
    }

    // Column labels A-F with background pill
    const labelSize = Math.max(11, W / 50);
    ctx.font = `bold ${labelSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < COLS; i++) {
      const x = i * colW + colW / 2;
      const label = LABELS[i];
      const tw = ctx.measureText(label).width + 8;
      ctx.fillStyle = 'rgba(184,150,46,0.18)';
      ctx.fillRect(x - tw / 2, 2, tw, labelSize + 4);
      ctx.fillStyle = 'rgba(184,150,46,0.95)';
      ctx.fillText(label, x, 4);
    }

    // Row labels 1-6 with background
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < ROWS; i++) {
      const y = i * rowH + rowH / 2;
      const label = String(i + 1);
      const tw = ctx.measureText(label).width + 8;
      ctx.fillStyle = 'rgba(184,150,46,0.18)';
      ctx.fillRect(2, y - (labelSize + 4) / 2, tw, labelSize + 4);
      ctx.fillStyle = 'rgba(184,150,46,0.95)';
      ctx.fillText(label, 4, y);
    }
  }

  if (!showMarkers || !plants?.length) {
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    return;
  }

  // Convert boundary polygon from normalised (0–1) to canvas pixels
  const pixelPoly: BoundaryPolygon | null = (boundaryPolygon && boundaryPolygon.length >= 3)
    ? boundaryPolygon.map(p => ({ x: p.x * W, y: p.y * H }))
    : null;

  const BASE_MARKER_R = Math.max(14, W / 38);
  const placed: Array<{x: number; y: number; r: number}> = [];

  plants.forEach((plant, index) => {
    const loc = (plant.gridLocation || '').trim().toUpperCase();
    const match = loc.match(/^([A-F])(\d)/);
    let x: number, y: number, effectiveR: number;

    if (match) {
      const ci = Math.max(0, Math.min(5, match[1].charCodeAt(0) - 65));
      const ri = Math.max(0, Math.min(5, parseInt(match[2]) - 1));

      if (perspectiveData) {
        // Perspective photo: transform grid coords to pixel coords (with height offset for gridZ)
        const pt = applyPerspectiveTransform(
          ci, ri, W, H,
          perspectiveData.horizonLinePercent,
          perspectiveData.vanishingPointXPercent,
          plant.gridZ || 0,
          perspectiveData.scaleCalibrationHeightMetres || 1.8,
          perspectiveData.scaleCalibrationPixelHeightPercent || 20,
          perspectiveData.foregroundYPercent || 85,
        );
        x = pt.x;
        y = pt.y;
        effectiveR = BASE_MARKER_R * pt.scale;
      } else {
        // Aerial / flat view: inset 10% so markers stay inside drawn garden boundary
        const insetX = W * 0.10;
        const insetY = H * 0.10;
        const availW = W - insetX * 2;
        const availH = H - insetY * 2;
        x = insetX + ci * (availW / COLS) + (availW / COLS) / 2;
        y = insetY + ri * (availH / ROWS) + (availH / ROWS) / 2;
        effectiveR = BASE_MARKER_R;
      }
    } else {
      // Fallback: distribute evenly
      const cols = 4;
      x = ((index % cols) + 1) * (W / (cols + 1));
      y = (Math.floor(index / cols) + 2) * (H / 5);
      effectiveR = BASE_MARKER_R;
    }

    // Boundary polygon clamping — move any outside-boundary marker inside
    if (pixelPoly) {
      const clamped = clampToBoundary(x, y, pixelPoly);
      x = clamped.x;
      y = clamped.y;
    }

    // Basic canvas-edge clamping
    x = Math.max(effectiveR + 4, Math.min(W - effectiveR - 4, x));
    y = Math.max(effectiveR + 4, Math.min(H - effectiveR - 4, y));

    // Clash avoidance
    let attempts = 0;
    while (attempts < 10) {
      const clash = placed.find(p => Math.hypot(p.x - x, p.y - y) < (p.r + effectiveR) * 1.2);
      if (!clash) break;
      x += effectiveR * 2.0;
      if (x > W - effectiveR - 4) { x = effectiveR + 10; y += effectiveR * 2.0; }
      x = Math.max(effectiveR + 4, Math.min(W - effectiveR - 4, x));
      y = Math.max(effectiveR + 4, Math.min(H - effectiveR - 4, y));
      attempts++;
    }
    placed.push({ x, y, r: effectiveR });

    ctx.beginPath(); ctx.arc(x, y, effectiveR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,61,43,0.92)'; ctx.fill();
    ctx.strokeStyle = '#b8962e'; ctx.lineWidth = Math.max(1.5, W / 360); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(9, effectiveR * 0.85)}px Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), x, y);
  });

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function GridOverlayImage({ src, plants, label, showMarkers = true, perspectiveData, boundaryPolygon, showGrid = true }: {
  src: string; plants: any[]; label: string; showMarkers?: boolean;
  perspectiveData?: PerspectiveData | null;
  boundaryPolygon?: BoundaryPolygon | null;
  showGrid?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!src || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      drawGridOverlay(canvas, plants, showMarkers, perspectiveData, boundaryPolygon, showGrid);
    };
    img.onerror = () => {
      canvas.width = 600; canvas.height = 400;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 0, 600, 400);
      ctx.fillStyle = '#6b7280'; ctx.font = '15px Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('Image unavailable', 300, 200);
    };
    img.src = src;
  }, [src, plants, showMarkers, perspectiveData, boundaryPolygon, showGrid]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: C.r, border: `1px solid ${C.rule}` }} />
      <div style={{
        position: 'absolute', top: 8, left: 8,
        background: C.brand, color: C.accent,
        fontSize: px(10), fontFamily: C.font, letterSpacing: '0.12em',
        padding: '3px 10px', borderRadius: C.r, textTransform: 'uppercase', fontWeight: 700,
      }}>{label}</div>
    </div>
  );
}

// ─── SHARED UI PRIMITIVES ─────────────────────────────────────────────────────

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "32px 0 16px" }}>
      <span style={{
        background: C.brand, color: C.accent,
        fontSize: px(11), fontFamily: C.font, fontWeight: 700,
        padding: "3px 8px", borderRadius: C.r, letterSpacing: "0.08em"
      }}>{n}</span>
      <h2 style={{ margin: 0, fontFamily: C.fontSerif, fontSize: px(18), fontWeight: 600, color: C.ink }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: C.rule, marginLeft: 4 }} />
    </div>
  );
}

function Card({ children, style = {}, accent = false }: { children: React.ReactNode; style?: React.CSSProperties; accent?: boolean }) {
  return (
    <div style={{
      background: C.card, borderRadius: C.rLg,
      border: `1px solid ${C.rule}`,
      borderLeft: accent ? `4px solid ${C.accent}` : `1px solid ${C.rule}`,
      padding: "20px 22px", marginBottom: 14, boxShadow: C.shadow,
      ...style
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: px(11), color: C.inkLight, fontFamily: C.font, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{children}</div>;
}

function Body({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ margin: 0, fontFamily: C.font, fontSize: px(BASE), color: C.inkMid, lineHeight: 1.65, ...style }}>{children}</p>;
}

function Tag({ children, color = C.brand, bg = C.brandLight }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: C.r,
      background: bg, color, fontSize: px(12), fontFamily: C.font, fontWeight: 600,
      marginRight: 5, marginBottom: 3
    }}>{children}</span>
  );
}

function StatGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10, marginBottom: 18 }}>
      {items.map(({ label, value }) => (
        <div key={label} style={{
          background: C.card, borderRadius: C.r, padding: "12px 16px",
          border: `1px solid ${C.rule}`, borderLeft: `3px solid ${C.accent}`
        }}>
          <div style={{ fontSize: px(11), color: C.inkLight, fontFamily: C.font, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: px(BASE), color: C.ink, fontFamily: C.font, fontWeight: 500 }}>{value || "—"}</div>
        </div>
      ))}
    </div>
  );
}

// ─── DATA TABLE COMPONENTS ────────────────────────────────────────────────────

function PlantTable({ plants }: { plants: any[] }) {
  if (!plants?.length) return null;
  const cols = ["#", "Grid", "Botanical Name", "Common Name", "Type", "Qty", "Layer", "Sun", "Water", "Mature Size"];
  return (
    <div style={{ overflowX: "auto", borderRadius: C.rLg, border: `1px solid ${C.rule}`, marginTop: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.font, fontSize: px(14) }}>
        <thead>
          <tr style={{ background: C.brand }}>
            {cols.map(h => (
              <th key={h} style={{ padding: "10px 13px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plants.map((p, i) => (
            <tr key={p.id} style={{ background: i % 2 === 0 ? C.surface : C.card, borderBottom: `1px solid ${C.rule}` }}>
              <td style={{ padding: "9px 13px", color: C.accent, fontWeight: 700 }}>{i + 1}</td>
              <td style={{ padding: "9px 13px" }}>
                <span style={{ background: C.brand, color: C.accent, borderRadius: C.r, padding: "2px 8px", fontSize: px(12), fontWeight: 700 }}>{p.gridLocation || "—"}</span>
              </td>
              <td style={{ padding: "9px 13px", fontStyle: "italic", color: C.brand, fontWeight: 600 }}>{cleanPlantName(p.botanicalName)}</td>
              <td style={{ padding: "9px 13px", color: C.ink }}>{cleanPlantName(p.commonName)}{p.cultivar ? ` '${p.cultivar}'` : ""}</td>
              <td style={{ padding: "9px 13px" }}><Tag>{p.type}</Tag></td>
              <td style={{ padding: "9px 13px", textAlign: "center", fontWeight: 700, color: C.ink }}>{p.quantity}</td>
              <td style={{ padding: "9px 13px", color: C.inkMid }}>{p.layer}</td>
              <td style={{ padding: "9px 13px", color: C.inkMid }}>{p.sunRequirement}</td>
              <td style={{ padding: "9px 13px", color: C.inkMid }}>{p.waterRequirement}</td>
              <td style={{ padding: "9px 13px", color: C.inkMid, whiteSpace: "nowrap" }}>{p.matureSize}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeasonMatrix({ plants }: { plants: any[] }) {
  if (!plants?.length) return null;
  const seasons = ["spring","summer","autumn","winter"];
  const sBg: Record<string, string>   = { spring:"#dcfce7", summer:"#fef9c3", autumn:"#ffedd5", winter:"#dbeafe" };
  const sFg: Record<string, string>   = { spring:"#14532d", summer:"#713f12", autumn:"#7c2d12", winter:"#1e3a5f" };
  return (
    <div style={{ overflowX: "auto", borderRadius: C.rLg, border: `1px solid ${C.rule}`, marginTop: 14 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.font, fontSize: px(14) }}>
        <thead>
          <tr>
            <th style={{ padding: "10px 14px", background: C.surface, borderBottom: `1px solid ${C.rule}`, textAlign: "left", fontSize: px(12), color: C.inkLight, fontWeight: 600, width: 160 }}>Plant</th>
            {seasons.map(s => (
              <th key={s} style={{ padding: "10px 14px", background: sBg[s], color: sFg[s], textAlign: "center", fontSize: px(12), fontWeight: 700, textTransform: "capitalize", borderBottom: `1px solid ${C.rule}` }}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plants.map((p, i) => (
            <tr key={p.id} style={{ borderBottom: `1px solid ${C.rule}` }}>
              <td style={{ padding: "9px 14px", background: i%2===0?C.surface:C.card, fontSize: px(14), fontStyle: "italic", color: C.brand, fontWeight: 500 }}>{p.commonName}</td>
              {seasons.map(s => (
                <td key={p.id+s} style={{ padding: "9px 14px", background: i%2===0?C.surface:C.card, fontSize: px(14), color: C.inkMid, borderLeft: `1px solid ${C.rule}` }}>
                  {p.seasonalInterest?.[s] || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function detectCurrency(): string {
  if (typeof navigator === 'undefined') return 'EUR';
  const lang = navigator.language;
  if (lang === 'en-GB') return 'GBP';
  if (lang === 'en-IE') return 'EUR';
  if (lang.startsWith('en-US')) return 'USD';
  if (lang.startsWith('en-CA')) return 'CAD';
  if (lang.startsWith('en-AU')) return 'AUD';
  if (lang.startsWith('en-NZ')) return 'NZD';
  // For European locales default to EUR, others fall back to EUR
  return 'EUR';
}

function cleanPlantName(name: string): string {
  if (!name) return name;
  return name.replace(/('([^']+)')\s+\1/g, '$1').trim();
}

function ReferenceTable({ plants }: { plants: any[] }) {
  if (!plants?.length) return null;
  return (
    <div style={{ overflowX: "auto", borderRadius: C.rLg, border: `1px solid ${C.rule}`, marginTop: 14 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.font, fontSize: px(BASE - 1) }}>
        <thead>
          <tr style={{ background: C.brand }}>
            <th style={{ padding: "9px 12px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600, width: 36 }}>#</th>
            <th style={{ padding: "9px 12px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600, width: 56 }}>Grid</th>
            <th style={{ padding: "9px 12px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600 }}>Before (existing)</th>
            <th style={{ padding: "9px 12px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600 }}>After (proposed)</th>
          </tr>
        </thead>
        <tbody>
          {plants.map((p: any, i: number) => (
            <tr key={p.id} style={{ background: i % 2 === 0 ? C.surface : C.card, borderBottom: `1px solid ${C.rule}` }}>
              <td style={{ padding: "9px 12px", color: C.accent, fontWeight: 700, fontSize: px(13) }}>{i + 1}</td>
              <td style={{ padding: "9px 12px" }}>
                <span style={{ background: C.brand, color: C.accent, borderRadius: C.r, padding: "2px 7px", fontSize: px(11), fontWeight: 700 }}>{p.gridLocation || "—"}</span>
              </td>
              <td style={{ padding: "9px 12px", color: C.inkMid, fontSize: px(13) }}>{p.existingElement || "—"}</td>
              <td style={{ padding: "9px 12px" }}>
                <div style={{ fontStyle: "italic", color: C.brand, fontWeight: 600, fontSize: px(13) }}>{cleanPlantName(p.botanicalName)}</div>
                <div style={{ color: C.inkLight, fontSize: px(12) }}>{cleanPlantName(p.commonName)}{p.cultivar ? ` '${p.cultivar}'` : ""}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AfterPlantTable({ plants }: { plants: any[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!plants?.length) return null;
  return (
    <div>
      <div style={{ fontSize: px(12), color: C.inkMid, marginBottom: 8, fontStyle: 'italic' }}>
        Plant Reference — hover a row to highlight its position
      </div>
      <div style={{ overflowX: "auto", borderRadius: C.rLg, border: `1px solid ${C.rule}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.font, fontSize: px(BASE - 1) }}>
          <thead>
            <tr style={{ background: C.brand }}>
              <th style={{ padding: "9px 12px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600, width: 36 }}>#</th>
              <th style={{ padding: "9px 12px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600 }}>Plant Name</th>
              <th style={{ padding: "9px 12px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600, width: 60 }}>Grid</th>
              <th style={{ padding: "9px 12px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600 }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((p: any, i: number) => (
              <tr key={p.id || i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: hovered === i ? C.brandLight : i % 2 === 0 ? C.surface : C.card,
                  borderBottom: `1px solid ${C.rule}`, cursor: 'default', transition: 'background 0.1s',
                }}>
                <td style={{ padding: "9px 12px", color: C.accent, fontWeight: 700, fontSize: px(13) }}>{i + 1}</td>
                <td style={{ padding: "9px 12px" }}>
                  <div style={{ fontStyle: "italic", color: C.brand, fontWeight: 600, fontSize: px(13) }}>{cleanPlantName(p.botanicalName)}</div>
                  <div style={{ color: C.inkLight, fontSize: px(12) }}>{cleanPlantName(p.commonName)}{p.cultivar ? ` '${p.cultivar}'` : ""}</div>
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{ background: C.brand, color: C.accent, borderRadius: C.r, padding: "2px 7px", fontSize: px(11), fontWeight: 700 }}>{p.gridLocation || "—"}</span>
                </td>
                <td style={{ padding: "9px 12px", color: C.inkMid, fontSize: px(12) }}>
                  {p.type}{p.layer ? ` · ${p.layer}` : ''}{p.quantity > 1 ? ` · ×${p.quantity}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompassSelector({ value, onChange, required, hasAttempted }: { value: string; onChange: (dir: string) => void; required?: boolean; hasAttempted?: boolean }) {
  const directions = [
    { dir: "N",  label: "N",  x: 50, y: 12 },
    { dir: "NE", label: "NE", x: 82, y: 22 },
    { dir: "E",  label: "E",  x: 92, y: 50 },
    { dir: "SE", label: "SE", x: 82, y: 78 },
    { dir: "S",  label: "S",  x: 50, y: 88 },
    { dir: "SW", label: "SW", x: 18, y: 78 },
    { dir: "W",  label: "W",  x: 8,  y: 50 },
    { dir: "NW", label: "NW", x: 18, y: 22 },
  ];
  return (
    <div>
      <label style={{ display: "block", fontSize: px(12), color: C.inkLight, marginBottom: 6, fontWeight: 600 }}>
        Which direction does your garden face?{required && <span style={{ color: "#b91c1c" }}> *</span>}
      </label>
      <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 6px" }}>
        {/* Compass rose circle */}
        <svg viewBox="0 0 100 100" width="120" height="120" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="50" cy="50" r="46" fill={C.card} stroke={C.rule} strokeWidth="1.5" />
          <circle cx="50" cy="50" r="5" fill={C.ruleDark} />
          {/* Tick marks */}
          {directions.map(({ dir, x, y }) => {
            const isActive = value === dir;
            const angle = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }[dir] || 0;
            const rad = (angle - 90) * Math.PI / 180;
            const r1 = 28, r2 = 40;
            const x1 = 50 + r1 * Math.cos(rad), y1 = 50 + r1 * Math.sin(rad);
            const x2 = 50 + r2 * Math.cos(rad), y2 = 50 + r2 * Math.sin(rad);
            return (
              <line key={dir}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isActive ? C.accent : C.ruleDark}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
            );
          })}
        </svg>
        {/* Clickable direction buttons */}
        {directions.map(({ dir, label, x, y }) => {
          const isActive = value === dir;
          const isCardinal = ["N","E","S","W"].includes(dir);
          return (
            <button
              key={dir}
              onClick={() => onChange(value === dir ? '' : dir)}
              style={{
                position: "absolute",
                left: `${x}%`, top: `${y}%`,
                transform: "translate(-50%, -50%)",
                width: isCardinal ? 22 : 20,
                height: isCardinal ? 22 : 20,
                borderRadius: "50%",
                border: `2px solid ${isActive ? C.accent : C.ruleDark}`,
                background: isActive ? C.brand : C.surface,
                color: isActive ? C.accent : C.inkLight,
                fontSize: isCardinal ? px(9) : px(8),
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: C.font,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
                lineHeight: 1,
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div style={{ textAlign: "center", fontSize: px(11), color: C.inkLight, fontFamily: C.font }}>
        {value ? <span style={{ color: C.brand, fontWeight: 600 }}>{value} selected</span> : "This helps us suggest the right plants"}
      </div>
    </div>
  );
}

function CostTable({ costEstimate, currency: currencyProp }: { costEstimate: any; currency?: string }) {
  const [currency, setCurrency] = useState(currencyProp || 'GBP');
  useEffect(() => { setCurrency(currencyProp || detectCurrency()); }, [currencyProp]);
  if (!costEstimate?.lines?.length) return null;
  const lo = costEstimate.lines.reduce((s: number, l: any) => s + (l.low || 0), 0);
  const hi = costEstimate.lines.reduce((s: number, l: any) => s + (l.high || 0), 0);
  const mid = (lo + hi) / 2;
  const cont = mid * ((costEstimate.contingencyPercent || 15) / 100);
  const total = mid + cont;
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(navigator.language, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.round(n));
    } catch {
      return `${currency} ${Math.round(n).toLocaleString()}`;
    }
  };
  return (
    <div style={{ overflowX: "auto", borderRadius: C.rLg, border: `1px solid ${C.rule}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.font, fontSize: px(BASE - 1) }}>
        <thead>
          <tr style={{ background: C.brand }}>
            {["Category","Description","Low","High","Notes"].map(h => (
              <th key={h} style={{ padding: "10px 14px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {costEstimate.lines.map((l: any, i: number) => (
            <tr key={i} style={{ background: i%2===0?C.surface:C.card, borderBottom: `1px solid ${C.rule}` }}>
              <td style={{ padding: "10px 14px", fontWeight: 700, color: C.brand }}>{l.category}</td>
              <td style={{ padding: "10px 14px", color: C.ink }}>{l.description}</td>
              <td style={{ padding: "10px 14px", color: C.green, fontWeight: 600 }}>{fmt(l.low)}</td>
              <td style={{ padding: "10px 14px", color: C.red, fontWeight: 600 }}>{fmt(l.high)}</td>
              <td style={{ padding: "10px 14px", color: C.inkLight, fontSize: px(13) }}>{l.notes}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: C.surface, borderTop: `2px solid ${C.ruleDark}` }}>
            <td colSpan={2} style={{ padding: "10px 14px", fontWeight: 700, color: C.ink }}>Subtotal Range</td>
            <td style={{ padding: "10px 14px", fontWeight: 700, color: C.green }}>{fmt(lo)}</td>
            <td style={{ padding: "10px 14px", fontWeight: 700, color: C.red }}>{fmt(hi)}</td>
            <td />
          </tr>
          <tr style={{ background: C.accentLight }}>
            <td colSpan={2} style={{ padding: "10px 14px", color: C.amber, fontWeight: 600 }}>Contingency ({costEstimate.contingencyPercent || 15}%)</td>
            <td colSpan={2} style={{ padding: "10px 14px", color: C.amber, fontWeight: 700 }}>{fmt(cont)}</td>
            <td />
          </tr>
          <tr style={{ background: C.brand }}>
            <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 700, color: "#fff", fontSize: px(BASE) }}>Your total spend (materials + buffer)</td>
            <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 700, color: C.accent, fontSize: px(BASE) }}>{fmt(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── GRID OVERLAY GENERATOR (returns base64 data URL for PDF) ────────────────

function generateGridOverlay(
  src: string,
  plants: any[],
  showMarkers = true,
  perspectiveData?: PerspectiveData | null,
  boundaryPolygon?: BoundaryPolygon | null,
  showGrid = true,
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      drawGridOverlay(canvas, plants, showMarkers, perspectiveData, boundaryPolygon, showGrid);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = src;
  });
}


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function GardigApp() {
  const [step, setStep]               = useState<"upload"|"loading"|"result">("upload");
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [designLang, setDesignLang]   = useState("Japanese Zen");
  const [gardenOrientation, setGardenOrientation] = useState<string>('');
  const [clientName, setClientName]   = useState("");
  const [userEmail, setUserEmail]     = useState("");
  const [docData, setDocData]         = useState<any>(null);
  const [renderUrl, setRenderUrl]     = useState<string | null>(null);
  const [gridImageUrl, setGridImageUrl]         = useState<string | null>(null);
  const [aerialImageUrl, setAerialImageUrl]     = useState<string | null>(null);
  const [aerialGridImageUrl, setAerialGridImageUrl] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{ result: any; retried: boolean } | null>(null);
  const [turnstileToken, setTurnstileToken]     = useState('');
  const [userCurrency, setUserCurrency]         = useState('GBP');
  const [termsAccepted, setTermsAccepted]       = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState("overview");
  const [emailModal, setEmailModal]   = useState(false);
  const [emailAddr, setEmailAddr]     = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [emailError, setEmailError]   = useState<string | null>(null);
  const [showBefore, setShowBefore]   = useState(false);
  const [fileSizeError, setFileSizeError] = useState(false);
  const [selfSendToast, setSelfSendToast] = useState<string | null>(null);
  const [selfSendStatus, setSelfSendStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [hasAttempted, setHasAttempted]   = useState(false);
  const [creativityLevel, setCreativityLevel] = useState(3);
  const [fingerprint, setFingerprint]         = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Register Turnstile success callback on window
  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) => setTurnstileToken(token);
  }, []);

  // Detect currency from IP on mount
  useEffect(() => {
    fetch('http://ip-api.com/json/?fields=currency')
      .then(r => r.json())
      .then(d => { if (d.currency) setUserCurrency(d.currency); })
      .catch(() => { /* keep default GBP */ });
  }, []);

  const missingFields = () => {
    const missing: string[] = [];
    if (!imageDataUrl) missing.push("site photo");
    if (!userEmail || !userEmail.includes('@') || !userEmail.includes('.')) missing.push("valid email address");
    if (!designLang) missing.push("design language");
    if (!gardenOrientation) missing.push("garden orientation");
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) missing.push("security check");
    if (!termsAccepted) missing.push("Terms of Use agreement");
    return missing;
  };
  const isFormValid = () => missingFields().length === 0;

  const handleFile = (file: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setFileSizeError(true);
      setImageFile(null);
      setImageDataUrl(null);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setFileSizeError(false);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImageDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, []);

  const callUnifiedPipeline = async (base64Data: string, mimeType: string) => {
    const response = await fetch('/api/redesign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalImageBase64: base64Data,
        originalImageMimeType: mimeType,
        style: designLang,
        orientation: gardenOrientation || 'N',
        clientName: clientName || 'Private Client',
        turnstileToken,
        currency: userCurrency,
        creativityLevel,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Design pipeline failed (${response.status})`);
    }
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return {
      designJSON: data.designJSON || null,
      imageBase64: (data.imageError ? null : data.imageBase64) || null,
      aerialImageBase64: (data.imageError ? null : data.aerialImageBase64) || null,
      validationResult: data.validationResult || null,
      retried: data.retried || false,
      fingerprint: data.fingerprint || null,
    };
  };

  const handleAnalyse = async () => {
    setHasAttempted(true);
    if (!isFormValid()) return;
    setError(null);
    setDocData(null);
    setRenderUrl(null);
    setGridImageUrl(null);
    setAerialImageUrl(null);
    setAerialGridImageUrl(null);
    setValidationResult(null);
    setFingerprint(null);
    setStep("loading");
    try {
      if (!imageDataUrl) {
        setError("No image selected. Please upload a photo first.");
        return;
      }
      setLoadingMsg("Designing your garden...");
      const base64 = imageDataUrl.split(",")[1];
      const mimeType = imageDataUrl.split(";")[0].split(":")[1];

      const result = await callUnifiedPipeline(base64, mimeType);

      setDocData(result.designJSON);
      setRenderUrl(result.imageBase64);
      setAerialImageUrl(result.aerialImageBase64);
      setFingerprint(result.fingerprint);
      if (result.validationResult !== undefined) {
        setValidationResult({ result: result.validationResult, retried: result.retried });
      }

      // Build perspective data from fingerprint for photo-view overlays
      const fp = result.fingerprint;
      const perspData: PerspectiveData | null = (fp?.horizonLinePercent != null && fp?.vanishingPointXPercent != null)
        ? {
            horizonLinePercent: fp.horizonLinePercent,
            vanishingPointXPercent: fp.vanishingPointXPercent,
            cameraElevationAngle: fp.cameraElevationAngle,
            scaleCalibrationHeightMetres: fp.scaleCalibrationHeightMetres,
            scaleCalibrationPixelHeightPercent: fp.scaleCalibrationPixelHeightPercent,
            foregroundYPercent: fp.foregroundToBackgroundRatio != null
              ? 55 + (fp.foregroundToBackgroundRatio * 35)
              : 85,
          }
        : null;
      const bPoly: BoundaryPolygon | null = (fp?.boundaryPolygon?.length >= 3) ? fp.boundaryPolygon : null;

      // Generate annotated grid overlays for PDF (client-side canvas)
      setLoadingMsg("Annotating layout plans...");
      const plants = result.designJSON?.plantingSpecification?.plants || [];
      if (result.imageBase64 && plants.length > 0) {
        // Perspective render: markers only, no grid lines
        const overlay = await generateGridOverlay(result.imageBase64, plants, true, perspData, bPoly, false);
        setGridImageUrl(overlay || null);
      } else if (imageDataUrl && plants.length > 0) {
        const overlay = await generateGridOverlay(imageDataUrl, plants, true, perspData, bPoly, false);
        setGridImageUrl(overlay || null);
      }
      if (result.aerialImageBase64 && plants.length > 0) {
        // Aerial sketch: flat grid, no perspective transform, no boundary polygon
        console.log('[Aerial overlay] plants gridLocations:', plants.map((p: any) => `${p.commonName}: ${p.gridLocation}`));
        const aerialOverlay = await generateGridOverlay(result.aerialImageBase64, plants, true, null, null);
        setAerialGridImageUrl(aerialOverlay || null);
      }

      setLoadingMsg("Building proposal...");
      await new Promise(r => setTimeout(r, 300));
      setStep("result");
      setActiveTab("overview");
    } catch (err: any) {
      setError(err.message);
      setStep("upload");
    }
  };

  // ── UPLOAD SCREEN ──────────────────────────────────────────────────────────
  if (step === "upload") return (
    <div style={{ minHeight: "100vh", background: C.surface, fontFamily: C.font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box}
        .upload-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        @media(max-width:640px){
          .upload-form-grid{grid-template-columns:1fr}
          .upload-generate-btn{width:100%}
        }
        .creativity-slider{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:3px;outline:none;cursor:pointer;background:linear-gradient(to right,#0a3d2b 0%,#0a3d2b var(--cp,50%),#d9cdb8 var(--cp,50%),#d9cdb8 100%)}
        .creativity-slider::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#b8962e;border:2.5px solid #0a3d2b;cursor:pointer;box-shadow:0 1px 4px rgba(44,26,14,0.18)}
        .creativity-slider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#b8962e;border:2.5px solid #0a3d2b;cursor:pointer;box-shadow:0 1px 4px rgba(44,26,14,0.18)}
      `}</style>

      {/* Top bar */}
      <header style={{ background: C.brand, borderBottom: `1px solid rgba(184,150,46,0.3)`, height: 56, display: "flex", alignItems: "center", padding: "0 28px", gap: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: C.r, background: "rgba(184,150,46,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8962e" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg>
        </div>
        <span style={{ fontFamily: C.fontSerif, fontWeight: 700, fontSize: px(18), color: "#fff", letterSpacing: "1px" }}>Dedrab</span>
        <span style={{ fontSize: px(12), color: "rgba(255,255,255,0.45)", marginLeft: 2, letterSpacing: "0.05em" }}>dedrab.com</span>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "44px 24px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: px(10), letterSpacing: "0.15em", color: C.accent, textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: C.font }}>Site Analysis & Design</div>
          <h1 style={{ fontFamily: C.fontSerif, fontSize: px(32), margin: "0 0 10px", color: C.ink, fontWeight: 600 }}>Generate a Garden Design Proposal</h1>
          <p style={{ color: C.inkMid, maxWidth: 500, margin: 0, fontSize: px(BASE), lineHeight: 1.6, fontFamily: C.font }}>
            Upload a site photo to receive a full proposal — plant list, spatial layout, cost estimate, and proposed design render.
          </p>
        </div>

        <div className="upload-form-grid">
          {/* Upload */}
          <Card>
            <Label>01 — Site Photo <span style={{ color: C.red }}>*</span></Label>
            <div
              onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${imageDataUrl ? C.brand : (hasAttempted && !imageDataUrl ? "#fca5a5" : C.ruleDark)}`,
                borderRadius: C.r, padding: "20px 12px", textAlign: "center",
                cursor: "pointer", background: imageDataUrl ? C.brandLight : C.surface,
                minHeight: 170, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s"
              }}
            >
              {imageDataUrl
                ? <img src={imageDataUrl} alt="Preview" style={{ maxHeight: 150, maxWidth: "100%", borderRadius: C.r, objectFit: "cover" }} />
                : <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                    <div style={{ color: C.inkMid, fontSize: px(14), fontWeight: 500 }}>Drop image or click to browse</div>
                    <div style={{ color: C.inkLight, fontSize: px(12), marginTop: 3 }}>JPG, PNG, WEBP · Max 4 MB</div>
                  </div>
              }
            </div>
            {fileSizeError && (
              <div style={{
                marginTop: 10, padding: "10px 14px",
                background: C.surface, borderLeft: `3px solid ${C.accent}`,
                borderRadius: C.r, fontSize: px(13), color: C.red, lineHeight: 1.5,
              }}>
                Your file is too large — please try another image or reduce its size before uploading.
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </Card>

          {/* Project details */}
          <Card>
            <Label>02 — Project Details</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: px(12), color: C.inkLight, marginBottom: 5, fontWeight: 600 }}>Client Name <span style={{ color: C.inkLight, fontWeight: 400 }}>(optional)</span></label>
                <input value={clientName} onChange={(e: any) => setClientName(e.target.value)} placeholder="e.g. Johnson Residence"
                  style={{ width: "100%", padding: "9px 11px", border: `1px solid ${C.rule}`, borderRadius: C.r, fontFamily: C.font, fontSize: px(BASE - 1), color: C.ink, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: px(12), color: C.inkLight, marginBottom: 5, fontWeight: 600 }}>Your Email Address <span style={{ color: C.red }}>*</span></label>
                <input type="email" value={userEmail} onChange={(e: any) => setUserEmail(e.target.value)} placeholder="we'll send your plan here"
                  style={{ width: "100%", padding: "9px 11px", border: `1px solid ${hasAttempted && (!userEmail || !userEmail.includes('@') || !userEmail.includes('.')) ? "#fca5a5" : C.rule}`, borderRadius: C.r, fontFamily: C.font, fontSize: px(BASE - 1), color: C.ink, outline: "none" }} />
                <div style={{ fontSize: px(11), color: C.inkLight, marginTop: 4 }}>We only use this to send you your plan</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: px(12), color: C.inkLight, marginBottom: 5, fontWeight: 600 }}>Design Language <span style={{ color: C.red }}>*</span></label>
                <select value={designLang} onChange={(e: any) => setDesignLang(e.target.value)}
                  style={{ width: "100%", padding: "9px 11px", border: `1px solid ${C.rule}`, borderRadius: C.r, fontFamily: C.font, fontSize: px(BASE - 1), background: C.card, color: C.ink, outline: "none" }}>
                  {DESIGN_LANGUAGES.map(l => <option key={l.value} value={l.label}>{l.label}</option>)}
                </select>
              </div>
              <div style={{ borderTop: `1px solid ${hasAttempted && !gardenOrientation ? "#fca5a5" : C.rule}`, paddingTop: 14 }}>
                <CompassSelector value={gardenOrientation} onChange={setGardenOrientation} required hasAttempted={hasAttempted} />
              </div>
            </div>
          </Card>
        </div>

        {/* Creativity Level Slider */}
        {(() => {
          const cl = CREATIVITY_LEVELS[creativityLevel - 1];
          const pct = `${(creativityLevel - 1) / 4 * 100}%`;
          return (
            <div style={{ marginTop: 22, background: C.card, border: `1px solid ${C.rule}`, borderLeft: `4px solid ${C.accent}`, borderRadius: C.rLg, padding: "18px 22px", boxShadow: C.shadow }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
                <Label>03 — Creativity Level</Label>
                <span style={{ fontFamily: C.fontSerif, fontSize: px(15), fontWeight: 600, color: C.brand, whiteSpace: "nowrap" }}>
                  {creativityLevel} — {cl.name}
                </span>
              </div>
              <input
                type="range" min={1} max={5} step={1}
                value={creativityLevel}
                onChange={e => setCreativityLevel(Number(e.target.value))}
                className="creativity-slider"
                style={{ '--cp': pct } as React.CSSProperties}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, marginBottom: 10 }}>
                {CREATIVITY_LEVELS.map(l => (
                  <span key={l.level} style={{ fontSize: px(10), color: l.level === creativityLevel ? C.accent : C.inkLight, fontWeight: l.level === creativityLevel ? 700 : 400, fontFamily: C.font, letterSpacing: "0.04em", textAlign: "center", flex: 1 }}>
                    {l.level}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: px(13), color: C.inkMid, lineHeight: 1.55, fontFamily: C.font, borderTop: `1px solid ${C.rule}`, paddingTop: 10 }}>
                <span style={{ fontWeight: 600, color: C.brand }}>Level {creativityLevel}:</span> {cl.description}
              </div>
            </div>
          );
        })()}

        {error && (
          <div style={{ background: "#fef2f2", border: `1px solid #fca5a5`, borderRadius: C.r, padding: "11px 15px", color: C.red, fontSize: px(14), marginTop: 14 }}>
            ⚠ {error}
          </div>
        )}

        {hasAttempted && !isFormValid() && (
          <div style={{ background: "#fef2f2", border: `1px solid #fca5a5`, borderRadius: C.r, padding: "11px 15px", color: C.red, fontSize: px(14), marginTop: 14 }}>
            Please complete: <strong>{missingFields().join(", ")}</strong> before generating your plan.
          </div>
        )}

        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <div className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              data-callback="onTurnstileSuccess"
            />
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: px(13), color: C.inkMid, fontFamily: C.font }}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: C.brand, cursor: "pointer", flexShrink: 0 }}
            />
            <span>I agree to the <a href="/legal#terms" target="_blank" rel="noopener noreferrer" style={{ color: C.brand, textDecoration: "underline" }}>Terms of Use</a> and <a href="/legal#privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.brand, textDecoration: "underline" }}>Privacy Policy</a></span>
          </label>
        </div>

        <div style={{ textAlign: "center", marginTop: 22 }}>
          <button onClick={handleAnalyse} className="upload-generate-btn"
            style={{
              background: isFormValid() ? C.brand : "#d1d5db",
              color: isFormValid() ? C.accent : "#9ca3af",
              border: "none", padding: "14px 48px", borderRadius: C.r,
              fontSize: px(BASE), fontFamily: C.font, fontWeight: 700,
              cursor: isFormValid() ? "pointer" : "not-allowed",
              boxShadow: isFormValid() ? C.shadowMd : "none", letterSpacing: "0.01em",
              opacity: isFormValid() ? 1 : 0.5, transition: "all 0.15s"
            }}>
            Generate Design Proposal →
          </button>
        </div>
      </div>
    </div>
  );

  // ── LOADING SCREEN ─────────────────────────────────────────────────────────
  if (step === "loading") return (
    <div style={{ minHeight: "100vh", background: C.surface, fontFamily: C.font, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes ellipsis{0%,20%{content:'.'}40%,60%{content:'..'}80%,100%{content:'...'}} .ellipsis::after{content:'...';display:inline-block;animation:ellipsis 1.5s steps(3,end) infinite}`}</style>
      <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${C.rule}`, borderTopColor: C.accent, margin: "0 auto 24px", animation: "spin 0.75s linear infinite" }} />
        <div style={{ fontFamily: C.fontSerif, fontSize: px(22), fontWeight: 600, color: C.ink, marginBottom: 10 }}>Designing Your Garden</div>
        <div style={{ fontSize: px(14), color: C.inkLight, marginBottom: 20 }}>{loadingMsg}</div>
        <div style={{
          background: C.surface, border: `1px solid ${C.rule}`, borderLeft: `3px solid ${C.accent}`,
          borderRadius: C.r, padding: "14px 18px",
        }}>
          <div style={{ fontSize: px(BASE - 1), color: C.brand, fontWeight: 500, lineHeight: 1.6 }}>
            Please wait a moment while we build your plan<span className="ellipsis" />
          </div>
          <div style={{ fontSize: px(13), color: C.inkLight, marginTop: 4 }}>
            This might take a minute or two.
          </div>
        </div>
      </div>
    </div>
  );

  // ── RESULTS SCREEN ─────────────────────────────────────────────────────────
  const doc = docData || {};
  const plants = doc.plantingSpecification?.plants || [];

  const TABS = [
    { id: "overview",        label: "Overview" },
    { id: "visuals",         label: "Visuals" },
    { id: "layout-plan",     label: "Layout Plan" },
    { id: "site",            label: "Site Analysis" },
    { id: "concept",         label: "Design Concept" },
    { id: "spatial",         label: "Spatial Layout" },
    { id: "planting",        label: "Planting" },
    { id: "hardscape",       label: "Hardscape" },
    { id: "soil",            label: "Soil & Water" },
    { id: "implementation",  label: "Phasing" },
    { id: "maintenance",     label: "Maintenance" },
    { id: "costs",           label: "Cost Estimate" },
  ];

  async function safeJson(res: Response) {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error(`Server error (${res.status}) — please try again`);
    }
    return res.json();
  }

  async function sendPlan(pdfBase64: string) {
    setEmailStatus("sending");
    setEmailError(null);
    try {
      const res = await fetch('/api/send-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: emailAddr,
          pdfBase64,
          planTitle: docData?.overview?.tagline || 'Garden Design Plan',
          designStyle: designLang,
        }),
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error || 'Send failed');
      setEmailStatus("sent");
      console.log('Email sent, id:', json.id);
    } catch (e: unknown) {
      console.error('sendPlan error:', e);
      setEmailError(e instanceof Error ? e.message : 'Unknown error');
      setEmailStatus("error");
    }
  }

  async function sendToSelf(pdfBase64: string) {
    if (!userEmail) {
      setSelfSendToast('Please enter your email address before sending');
      setSelfSendStatus("error");
      setTimeout(() => { setSelfSendToast(null); setSelfSendStatus("idle"); }, 4000);
      return;
    }
    setSelfSendStatus("sending");
    try {
      const res = await fetch('/api/send-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: userEmail,
          pdfBase64,
          planTitle: docData?.overview?.tagline || 'Garden Design Plan',
          designStyle: designLang,
        }),
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error || 'Send failed');
      setSelfSendStatus("sent");
      setSelfSendToast(`Plan sent to ${userEmail}!`);
      console.log('Self-send email sent, id:', json.id);
      setTimeout(() => { setSelfSendToast(null); setSelfSendStatus("idle"); }, 5000);
    } catch (e: unknown) {
      console.error('sendToSelf error:', e);
      setSelfSendStatus("error");
      setSelfSendToast(e instanceof Error ? e.message : 'Failed to send. Please try again.');
      setTimeout(() => { setSelfSendToast(null); setSelfSendStatus("idle"); }, 5000);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.surface, fontFamily: C.font, color: C.ink, fontSize: px(BASE) }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box}
        .tab:hover{background:${C.brandLight}!important;color:${C.brand}!important}
        .tab{white-space:nowrap}
        .tab-bar-outer{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .grid-2col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .result-header-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
        @media(max-width:640px){
          .grid-2col{grid-template-columns:1fr}
          .result-header-actions{flex-wrap:wrap;gap:6px}
          .result-header-actions>*{flex:1 1 auto;min-width:0;font-size:11px!important;padding:7px 10px!important}
          .result-content-pad{padding:16px 12px 32px!important}
        }
        @media print{.noprint{display:none!important};body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      `}</style>

      {/* Sticky header */}
      <header className="noprint" style={{ background: C.brand, borderBottom: `1px solid rgba(184,150,46,0.3)`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: C.shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: C.r, background: "rgba(184,150,46,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8962e" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg>
          </div>
          <span style={{ fontFamily: C.fontSerif, fontWeight: 700, fontSize: px(18), color: "#fff", letterSpacing: "1px" }}>Dedrab</span>
          <span style={{ fontSize: px(12), color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>dedrab.com</span>
        </div>
        <div className="result-header-actions">
          <button onClick={() => {
            setStep("upload");
            setDocData(null);
            setRenderUrl(null);
            setGridImageUrl(null);
            setAerialImageUrl(null);
            setAerialGridImageUrl(null);
            setValidationResult(null);
            setFingerprint(null);
            setEmailModal(false);
            setEmailStatus("idle");
            setEmailError(null);
            setSelfSendStatus("idle");
            setSelfSendToast(null);
            setShowBefore(false);
          }}
            style={{ background: "rgba(255,255,255,0.08)", border: `1px solid rgba(255,255,255,0.2)`, color: "rgba(255,255,255,0.8)", padding: "7px 15px", borderRadius: C.r, cursor: "pointer", fontFamily: C.font, fontSize: px(13), fontWeight: 600 }}>
            ← New Analysis
          </button>
          <PDFButton
            doc={docData}
            imageBase64={renderUrl || ''}
            imageDataUrl={imageDataUrl || undefined}
            gridImageUrl={gridImageUrl || undefined}
            aerialImageUrl={aerialGridImageUrl || aerialImageUrl || undefined}
            style={designLang}
            clientName={clientName || undefined}
          />
          <PDFButton
            doc={docData}
            imageBase64={renderUrl || ''}
            imageDataUrl={imageDataUrl || undefined}
            gridImageUrl={gridImageUrl || undefined}
            aerialImageUrl={aerialGridImageUrl || aerialImageUrl || undefined}
            style={designLang}
            clientName={clientName || undefined}
            sendMode
            onPdfReady={sendToSelf}
            sendDisabled={selfSendStatus === 'sending'}
            sendLabel={selfSendStatus === 'sending' ? 'Sending…' : selfSendStatus === 'sent' ? 'Sent ✓' : 'Send to Me'}
          />
          <button
            onClick={() => { setEmailModal(true); setEmailStatus("idle"); setEmailAddr(userEmail); setEmailError(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: "rgba(255,255,255,0.08)", border: `1px solid rgba(255,255,255,0.2)`, color: "rgba(255,255,255,0.8)",
              padding: '8px 18px', borderRadius: C.r,
              cursor: 'pointer', fontFamily: C.font, fontSize: px(13), fontWeight: 600,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Send to Someone Else
          </button>
        </div>
      </header>

      {/* Send-to-self toast */}
      {selfSendToast && (
        <div style={{
          position: 'fixed', top: 66, right: 16, zIndex: 300,
          background: selfSendStatus === 'error' ? '#fef2f2' : C.brand,
          border: `1px solid ${selfSendStatus === 'error' ? '#fca5a5' : C.accent}`,
          borderRadius: C.r, padding: '10px 18px',
          fontSize: px(13), fontFamily: C.font, fontWeight: 600,
          color: selfSendStatus === 'error' ? C.red : C.accent,
          boxShadow: C.shadowMd,
        }}>
          {selfSendToast}
        </div>
      )}

      {/* Email modal */}
      {emailModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEmailModal(false); }}>
          <div style={{ background: C.card, borderRadius: C.rLg, width: 420, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ background: C.brand, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: px(15), fontWeight: 700, color: '#fff' }}>Send to Someone Else</div>
                <div style={{ fontSize: px(12), color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Send the PDF plan to any email address</div>
              </div>
              <button onClick={() => setEmailModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: 24 }}>
              {emailStatus === 'sent' ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                  <div style={{ fontWeight: 700, fontSize: px(15), color: C.green, marginBottom: 6 }}>Plan sent successfully</div>
                  <div style={{ fontSize: px(13), color: C.inkLight }}>Your garden plan has been emailed to <strong>{emailAddr}</strong></div>
                  <button onClick={() => setEmailModal(false)} style={{ marginTop: 20, background: C.brand, color: '#fff', border: 'none', padding: '9px 24px', borderRadius: C.r, cursor: 'pointer', fontFamily: C.font, fontSize: px(13), fontWeight: 600 }}>Done</button>
                </div>
              ) : (
                <>
                  <label style={{ display: 'block', fontSize: px(12), fontWeight: 600, color: C.inkMid, marginBottom: 6, letterSpacing: '0.03em' }}>Recipient email address</label>
                  <input
                    type="email"
                    value={emailAddr}
                    onChange={(e) => setEmailAddr(e.target.value)}
                    placeholder="name@example.com"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.rule}`, borderRadius: C.r, fontSize: px(14), fontFamily: C.font, color: C.ink, outline: 'none', boxSizing: 'border-box' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && emailAddr) document.getElementById('email-send-btn')?.click(); }}
                  />
                  {emailStatus === 'error' && (
                    <div style={{ marginTop: 10, fontSize: px(13), color: C.red }}>{emailError || 'Failed to send. Please try again.'}</div>
                  )}
                  <div style={{ marginTop: 16, fontSize: px(12), color: C.inkLight, lineHeight: 1.5 }}>
                    The PDF plan will be attached to a branded Dedrab email sent from hello@dedrab.com.
                  </div>
                  <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => setEmailModal(false)} style={{ background: C.surface, border: `1px solid ${C.rule}`, color: C.inkMid, padding: '9px 18px', borderRadius: C.r, cursor: 'pointer', fontFamily: C.font, fontSize: px(13), fontWeight: 600 }}>Cancel</button>
                    <PDFButton
                      doc={docData}
                      imageBase64={renderUrl || ''}
                      imageDataUrl={imageDataUrl || undefined}
                      gridImageUrl={gridImageUrl || undefined}
                      aerialImageUrl={aerialGridImageUrl || aerialImageUrl || undefined}
                      style={designLang}
                      clientName={clientName || undefined}
                      onPdfReady={sendPlan}
                      sendMode
                      sendDisabled={!emailAddr || emailStatus === 'sending'}
                      sendLabel={emailStatus === 'sending' ? 'Sending…' : 'Send'}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Title bar */}
      <div style={{ background: C.brand, padding: "18px 24px", borderBottom: `3px solid ${C.accent}` }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ fontSize: px(11), letterSpacing: "0.14em", color: C.accent, textTransform: "uppercase", fontWeight: 700, marginBottom: 5 }}>
            {designLang} · Garden Design Proposal
          </div>
          <h1 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: px(22), letterSpacing: "-0.01em" }}>
            {doc.overview?.tagline || "Garden Design Proposal"}
          </h1>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: px(14), marginTop: 5 }}>
            {clientName || "Client"} · {new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div className="noprint tab-bar-outer" style={{ background: C.card, borderBottom: `1px solid ${C.rule}`, overflowX: "auto" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", padding: "0 24px" }}>
          {TABS.map(t => (
            <button key={t.id} className="tab"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "13px 15px", border: "none", background: "transparent",
                cursor: "pointer", fontFamily: C.font, fontSize: px(13),
                fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? C.brand : C.inkLight,
                borderBottom: activeTab === t.id ? `3px solid ${C.accent}` : "3px solid transparent",
                whiteSpace: "nowrap", transition: "all 0.12s"
              }}>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="result-content-pad" style={{ maxWidth: 980, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && <>
          <SectionTitle n="01" title="Project Overview" />
          <Card accent>
            <Body>{doc.overview?.scopeDescription}</Body>
          </Card>
          <StatGrid items={[
            { label: "Client",            value: clientName || "Private Client" },
            { label: "Design Language",   value: designLang },
            { label: "Estimated Area",    value: doc.overview?.estimatedAreaSqm ? `${doc.overview.estimatedAreaSqm} m²` : "—" },
            { label: "Report Date",       value: new Date().toLocaleDateString("en-GB") },
            { label: "Confidence",         value: doc.confidence ? `${Math.round(doc.confidence * 100)}%` : "—" },
          ]} />
          {doc.overview?.objectives?.length > 0 && (
            <Card>
              <Label>Design Objectives</Label>
              <ul style={{ margin: 0, padding: "0 0 0 20px", fontSize: px(BASE), lineHeight: 1.9, color: C.inkMid }}>
                {doc.overview.objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}
              </ul>
            </Card>
          )}
          {doc.caveats?.length > 0 && (
            <div style={{ background: C.accentLight, border: `1px solid #e5d06a`, borderRadius: C.r, padding: "11px 15px", fontSize: px(14), color: C.amber }}>
              <strong>Analysis notes: </strong>{doc.caveats.join(" · ")}
            </div>
          )}
        </>}

        {/* ── SITE ANALYSIS ── */}
        {activeTab === "site" && <>
          <SectionTitle n="02" title="Site Analysis" />
          <StatGrid items={[
            { label: "Orientation",    value: doc.siteAnalysis?.sunProfile?.primaryOrientation },
            { label: "Morning Light",  value: doc.siteAnalysis?.sunProfile?.morningLight },
            { label: "Afternoon Light",value: doc.siteAnalysis?.sunProfile?.afternoonLight },
            { label: "Hardiness Zone", value: doc.siteAnalysis?.hardinessZone },
            { label: "Soil Type",      value: doc.siteAnalysis?.soil?.type },
            { label: "Drainage",       value: doc.siteAnalysis?.soil?.drainageRating ? `${doc.siteAnalysis.soil.drainageRating}/5` : "—" },
          ]} />
          {doc.siteAnalysis?.soil?.drainageNotes && (
            <Card><Label>Drainage Notes</Label><Body>{doc.siteAnalysis.soil.drainageNotes}</Body></Card>
          )}
          {doc.siteAnalysis?.existingFeatures?.length > 0 && (
            <Card>
              <Label>Existing Features</Label>
              {doc.siteAnalysis.existingFeatures.map((f: any) => (
                <div key={f.id} style={{ display: "flex", gap: 12, padding: "9px 12px", background: C.surface, borderRadius: C.r, marginBottom: 8, fontSize: px(BASE - 1) }}>
                  <Tag color={f.disposition==="Retain"?C.green:f.disposition==="Remove"?C.red:C.amber}
                       bg={f.disposition==="Retain"?"#f0fdf4":f.disposition==="Remove"?"#fef2f2":"#fffbeb"}>
                    {f.disposition}
                  </Tag>
                  <div>
                    <strong style={{ color: C.ink }}>{f.label}</strong> <span style={{ color: C.inkLight }}>({f.type})</span>
                    {f.notes && <div style={{ color: C.inkMid, marginTop: 2, fontSize: px(13) }}>{f.notes}</div>}
                  </div>
                </div>
              ))}
            </Card>
          )}
          {doc.siteAnalysis?.topographyNotes && (
            <Card><Label>Topography</Label><Body>{doc.siteAnalysis.topographyNotes}</Body></Card>
          )}
          {doc.siteAnalysis?.accessConstraints && (
            <Card><Label>Access Constraints</Label><Body>{doc.siteAnalysis.accessConstraints}</Body></Card>
          )}
        </>}

        {/* ── DESIGN CONCEPT ── */}
        {activeTab === "concept" && <>
          <SectionTitle n="03" title="Design Concept" />
          <Card accent>
            <Label>Concept Statement</Label>
            <Body>{doc.designConcept?.conceptStatement}</Body>
          </Card>
          {doc.designConcept?.rationale && (
            <Card><Label>Rationale</Label><Body>{doc.designConcept.rationale}</Body></Card>
          )}
          {doc.designConcept?.principles?.length > 0 && (
            <Card>
              <Label>Design Principles</Label>
              <div className="grid-2col" style={{ gap: 10, marginTop: 4 }}>
                {doc.designConcept.principles.map((p: string, i: number) => (
                  <div key={i} style={{ padding: "11px 14px", background: C.surface, borderRadius: C.r, fontSize: px(BASE), color: C.inkMid, borderLeft: `3px solid ${C.accent}` }}>
                    {p}
                  </div>
                ))}
              </div>
            </Card>
          )}
          {doc.designConcept?.colourPalette?.length > 0 && (
            <Card>
              <Label>Colour Palette</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                {doc.designConcept.colourPalette.map((col: string, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: px(BASE - 1) }}>
                    <div style={{ width: 26, height: 26, borderRadius: C.r, background: col, border: `1px solid ${C.rule}` }} />
                    <span style={{ color: C.inkMid }}>{col}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>}

        {/* ── SPATIAL LAYOUT ── */}
        {activeTab === "spatial" && <>
          <SectionTitle n="04" title="Spatial Layout" />
          {doc.spatialLayout?.zones?.length > 0 && (
            <Card>
              <Label>Design Zones</Label>
              <div className="grid-2col" style={{ gap: 12, marginTop: 8 }}>
                {doc.spatialLayout.zones.map((z: any) => (
                  <div key={z.id} style={{ padding: "14px 16px", background: C.surface, borderRadius: C.r, border: `1px solid ${C.rule}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <strong style={{ fontSize: px(BASE), color: C.brand }}>{z.name}</strong>
                      <Tag>{z.type}</Tag>
                    </div>
                    {z.areaSqm && <div style={{ fontSize: px(12), color: C.accent, fontWeight: 700, marginBottom: 5 }}>{z.areaSqm} m²</div>}
                    <Body style={{ fontSize: px(BASE - 1) }}>{z.description}</Body>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {doc.spatialLayout?.circulationRoutes?.length > 0 && (
            <Card>
              <Label>Circulation Routes</Label>
              {doc.spatialLayout.circulationRoutes.map((r: any) => (
                <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 12px", background: C.surface, borderRadius: C.r, marginBottom: 7, fontSize: px(BASE - 1) }}>
                  <span style={{ color: C.accent, fontWeight: 700 }}>→</span>
                  <span><strong>{r.from}</strong> to <strong>{r.to}</strong></span>
                  <span style={{ color: C.inkMid }}>{r.surfaceTreatment}</span>
                  {r.widthM && <span style={{ color: C.inkLight }}>{r.widthM}m wide</span>}
                </div>
              ))}
            </Card>
          )}
          {doc.spatialLayout?.compositionNotes && (
            <Card><Body>{doc.spatialLayout.compositionNotes}</Body></Card>
          )}
        </>}

        {/* ── PLANTING ── */}
        {activeTab === "planting" && <>
          <SectionTitle n="05" title="Planting Specification" />
          <div style={{ background: C.brand, color: "#fff", borderRadius: C.r, padding: "12px 16px", marginBottom: 18, fontSize: px(14), display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 16 }}>⊞</span>
            <span><strong style={{ color: C.accent }}>Grid Reference: </strong>Grid locations (A–F, rows 1–6) match the annotated images in the Visuals tab.</span>
          </div>
          <PlantTable plants={plants} />
          {doc.plantingSpecification?.layeringStrategy && (
            <Card style={{ marginTop: 18 }}><Label>Layering Strategy</Label><Body>{doc.plantingSpecification.layeringStrategy}</Body></Card>
          )}

          {plants.length > 0 && <>
            <SectionTitle n="05b" title="Seasonal Interest" />
            <SeasonMatrix plants={plants} />
          </>}

          {plants.length > 0 && <>
            <SectionTitle n="05c" title="Plant Notes" />
            {plants.map((p: any, i: number) => (
              <Card key={p.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 14, padding: "16px 18px", marginBottom: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: C.r, background: C.brand, color: C.accent, fontSize: px(15), fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px" }}>{i + 1}</div>
                  <div style={{ fontSize: px(11), color: C.accent, fontWeight: 700 }}>{p.gridLocation}</div>
                </div>
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontStyle: "italic", color: C.brand, fontWeight: 600, fontSize: px(BASE) }}>{p.botanicalName}</span>
                    {p.cultivar && <span style={{ color: C.inkLight, fontSize: px(BASE - 1) }}>'{p.cultivar}'</span>}
                    <span style={{ color: C.inkMid, fontSize: px(BASE - 1) }}>— {p.commonName}</span>
                    <Tag>{p.type}</Tag>
                  </div>
                  <Body style={{ fontSize: px(BASE - 1), marginBottom: 7 }}>{p.designRationale}</Body>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: px(13), color: C.inkLight }}>
                    <span>Qty: <strong style={{ color: C.ink }}>{p.quantity}</strong></span>
                    <span>·</span><span>{p.matureSize}</span>
                    <span>·</span><span>{p.hardinessRating}</span>
                    <span>·</span><span>{p.growthRate} growth</span>
                  </div>
                </div>
              </Card>
            ))}
          </>}
        </>}

        {/* ── HARDSCAPE ── */}
        {activeTab === "hardscape" && <>
          <SectionTitle n="06" title="Hardscape & Materials" />
          {doc.hardscapeSpecification?.paletteNarrative && (
            <Card accent><Body>{doc.hardscapeSpecification.paletteNarrative}</Body></Card>
          )}
          {doc.hardscapeSpecification?.materials?.length > 0 && (
            <div style={{ overflowX: "auto", borderRadius: C.rLg, border: `1px solid ${C.rule}`, marginBottom: 18 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.font, fontSize: px(BASE - 1) }}>
                <thead>
                  <tr style={{ background: C.brand }}>
                    {["Element","Material","Finish","Colour","Unit Cost","Notes"].map(h => (
                      <th key={h} style={{ padding: "10px 13px", color: "#fff", textAlign: "left", fontSize: px(12), fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doc.hardscapeSpecification.materials.map((m: any, i: number) => (
                    <tr key={m.id} style={{ background: i%2===0?C.surface:C.card, borderBottom: `1px solid ${C.rule}` }}>
                      <td style={{ padding: "9px 13px", fontWeight: 700, color: C.brand }}>{m.element}</td>
                      <td style={{ padding: "9px 13px", color: C.ink }}>{m.material}</td>
                      <td style={{ padding: "9px 13px", color: C.inkMid }}>{m.finish}</td>
                      <td style={{ padding: "9px 13px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 14, height: 14, borderRadius: 3, background: m.colour, border: `1px solid ${C.rule}`, display: "inline-block" }} />
                          {m.colour}
                        </span>
                      </td>
                      <td style={{ padding: "9px 13px", color: C.green, fontWeight: 600 }}>{m.unitCostRange}</td>
                      <td style={{ padding: "9px 13px", color: C.inkLight, fontSize: px(13) }}>{m.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid-2col" style={{ gap: 14 }}>
            {doc.hardscapeSpecification?.boundaryTreatments?.length > 0 && (
              <Card>
                <Label>Boundary Treatments</Label>
                {doc.hardscapeSpecification.boundaryTreatments.map((t: string, i: number) => (
                  <div key={i} style={{ fontSize: px(BASE - 1), color: C.inkMid, padding: "5px 0", borderBottom: `1px solid ${C.rule}` }}>• {t}</div>
                ))}
              </Card>
            )}
            {doc.hardscapeSpecification?.focalStructures?.length > 0 && (
              <Card>
                <Label>Focal Structures</Label>
                {doc.hardscapeSpecification.focalStructures.map((f: string, i: number) => (
                  <div key={i} style={{ fontSize: px(BASE - 1), color: C.inkMid, padding: "5px 0", borderBottom: `1px solid ${C.rule}` }}>• {f}</div>
                ))}
              </Card>
            )}
          </div>
        </>}

        {/* ── SOIL & IRRIGATION ── */}
        {activeTab === "soil" && <>
          <SectionTitle n="07" title="Soil, Drainage & Irrigation" />
          <div className="grid-2col" style={{ gap: 14, marginBottom: 14 }}>
            {[
              { label: "Soil Preparation",     val: doc.soilAndIrrigation?.soilPreparationPlan },
              { label: "Drainage Strategy",     val: doc.soilAndIrrigation?.drainageStrategy },
              { label: "Mulching",              val: doc.soilAndIrrigation?.mulchingRecommendation },
              { label: "Rainwater Harvesting",  val: doc.soilAndIrrigation?.rainwaterHarvestingNotes },
            ].filter(x => x.val).map(({ label, val }) => (
              <Card key={label}><Label>{label}</Label><Body>{val}</Body></Card>
            ))}
          </div>
          {doc.soilAndIrrigation?.irrigationZones?.length > 0 && (
            <Card>
              <Label>Irrigation Zones</Label>
              {doc.soilAndIrrigation.irrigationZones.map((z: any) => (
                <div key={z.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 12px", background: C.surface, borderRadius: C.r, marginBottom: 7, fontSize: px(BASE - 1) }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Tag color={C.blue} bg="#eff6ff">{z.type}</Tag>
                    <div>
                      <strong style={{ color: C.ink }}>{z.name}</strong>
                      {z.notes && <div style={{ color: C.inkMid, fontSize: px(13), marginTop: 2 }}>{z.notes}</div>}
                    </div>
                  </div>
                  <span style={{ color: C.inkLight, fontSize: px(13) }}>{z.coverageAreaSqm} m²</span>
                </div>
              ))}
            </Card>
          )}
        </>}

        {/* ── PHASING ── */}
        {activeTab === "implementation" && <>
          <SectionTitle n="08" title="Implementation Phasing" />
          <StatGrid items={[
            { label: "Total Duration",  value: doc.implementationPlan?.totalWeeks ? `${doc.implementationPlan.totalWeeks} weeks` : "—" },
            { label: "Critical Path",   value: doc.implementationPlan?.criticalPathNotes || "—" },
          ]} />
          {["Phase 1 — Hardscape","Phase 2 — Planting","Phase 3 — Finishing"].map(phase => {
            const tasks = doc.implementationPlan?.tasks?.filter((t: any) => t.phase === phase) || [];
            if (!tasks.length) return null;
            return (
              <Card key={phase}>
                <Label>{phase}</Label>
                {tasks.map((t: any) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.rule}` }}>
                    <div>
                      <div style={{ fontSize: px(BASE), color: C.ink }}>{t.task}</div>
                      {t.notes && <div style={{ fontSize: px(13), color: C.inkLight, marginTop: 2 }}>{t.notes}</div>}
                    </div>
                    <div style={{ fontSize: px(13), color: C.accent, fontWeight: 700, minWidth: 50, textAlign: "right" }}>{t.estimatedDays}d</div>
                  </div>
                ))}
              </Card>
            );
          })}
        </>}

        {/* ── MAINTENANCE ── */}
        {activeTab === "maintenance" && <>
          <SectionTitle n="09" title="Maintenance Schedule" />
          <StatGrid items={[
            { label: "Deep Maintenance Days/Year",  value: String(doc.maintenanceSchedule?.professionalVisitsPerYear || "—") },
            { label: "Annual Pruning",             value: doc.maintenanceSchedule?.annualPruningRegime || "—" },
            { label: "Feeding Schedule",           value: doc.maintenanceSchedule?.feedingSchedule || "—" },
          ]} />
          {["Spring","Summer","Autumn","Winter"].map(season => {
            const tasks = doc.maintenanceSchedule?.tasks?.filter((t: any) => t.season === season) || [];
            if (!tasks.length) return null;
            return (
              <Card key={season}>
                <Label>{season}</Label>
                {tasks.map((t: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.rule}`, fontSize: px(BASE) }}>
                    <span style={{ color: C.inkMid }}>{t.task}</span>
                    <Tag color={C.inkLight} bg={C.surface}>{t.frequency}</Tag>
                  </div>
                ))}
              </Card>
            );
          })}
          {doc.maintenanceSchedule?.longTermManagementNotes && (
            <Card accent><Label>Long-Term Management</Label><Body>{doc.maintenanceSchedule.longTermManagementNotes}</Body></Card>
          )}
        </>}

        {/* ── COSTS ── */}
        {activeTab === "costs" && <>
          <SectionTitle n="10" title="Approximation of Costs" />
          <div style={{ marginBottom: 16, padding: "12px 16px", background: C.brandLight, borderRadius: C.r, border: `1px solid rgba(10,61,43,0.15)`, fontSize: px(BASE - 1), color: C.inkMid, lineHeight: 1.6 }}>
            These are <strong>materials and plants costs</strong> for a self-implemented project — things you buy, not contractor rates. Spread it across weekends and tackle one phase at a time.
          </div>
          <CostTable costEstimate={doc.costEstimate} currency={userCurrency} />
          {doc.costEstimate?.costingNotes && (
            <div style={{ marginTop: 14, padding: "11px 15px", background: C.accentLight, borderRadius: C.r, fontSize: px(BASE - 1), color: C.amber, border: `1px solid #e5d06a` }}>
              <strong>Notes: </strong>{doc.costEstimate.costingNotes}
            </div>
          )}
        </>}

        {/* ── VISUALS ── */}
        {activeTab === "visuals" && <>
          <SectionTitle n="11" title="Visual Documentation" />

          {/* Before/After toggle */}
          <div className="noprint" style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {["Rendered Design","Original Site"].map(label => (
              <button key={label}
                onClick={() => setShowBefore(label === "Original Site")}
                style={{
                  padding: "8px 18px", border: `1px solid ${C.rule}`,
                  background: (showBefore ? label==="Original Site" : label==="Rendered Design") ? C.brand : C.card,
                  color:      (showBefore ? label==="Original Site" : label==="Rendered Design") ? C.accent : C.inkMid,
                  borderRadius: C.r, cursor: "pointer", fontFamily: C.font, fontSize: px(13), fontWeight: 600
                }}>{label}
              </button>
            ))}
          </div>

          {/* Main image */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Label>{showBefore ? "Original Site Photo" : "Proposed Vision for Your Dedrabed Garden"}</Label>
              {!showBefore && renderUrl && validationResult && (() => {
                const vr = validationResult.result;
                const retried = validationResult.retried;
                if (vr?.overallPass) return (
                  <span style={{ fontSize: px(12), fontWeight: 600, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>✓</span> Verified — same garden
                  </span>
                );
                if (!vr?.overallPass && retried) return (
                  <span style={{ fontSize: px(12), fontWeight: 600, color: C.amber, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⚠</span> Corrected after review
                  </span>
                );
                return (
                  <span title={(vr?.failReasons || []).join(' · ')} style={{ fontSize: px(12), fontWeight: 600, color: C.red, cursor: 'help', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>✗</span> May not match your garden exactly
                  </span>
                );
              })()}
            </div>
            {showBefore
              ? imageDataUrl && <img src={imageDataUrl} alt="Before" style={{ width: "100%", borderRadius: C.rLg, maxHeight: 480, objectFit: "cover", border: `1px solid ${C.rule}` }} />
              : renderUrl
                ? <img src={renderUrl} alt="Proposed Vision" style={{ width: "100%", borderRadius: C.rLg, maxHeight: 480, objectFit: "cover", border: `1px solid ${C.rule}` }} />
                : <div style={{ background: C.surface, borderRadius: C.rLg, height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: C.inkLight, fontSize: px(BASE), border: `1px solid ${C.rule}` }}>Render not available</div>
            }
          </div>

          {/* Grid overlays */}
          <div style={{ marginBottom: 10 }}><Label>Grid Reference Overlays — A–F (columns) × 1–6 (rows)</Label></div>
          <div className="grid-2col" style={{ marginBottom: 24 }}>
            {imageDataUrl && (
              <div>
                <div style={{ fontSize: px(12), color: C.inkLight, marginBottom: 7, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Before — Annotated</div>
                <GridOverlayImage src={imageDataUrl} plants={plants} label="Before" showMarkers={false} showGrid={false}
                  perspectiveData={fingerprint?.horizonLinePercent != null ? { horizonLinePercent: fingerprint.horizonLinePercent, vanishingPointXPercent: fingerprint.vanishingPointXPercent, cameraElevationAngle: fingerprint.cameraElevationAngle, scaleCalibrationHeightMetres: fingerprint.scaleCalibrationHeightMetres, scaleCalibrationPixelHeightPercent: fingerprint.scaleCalibrationPixelHeightPercent, foregroundYPercent: fingerprint.foregroundToBackgroundRatio != null ? 55 + (fingerprint.foregroundToBackgroundRatio * 35) : 85 } : null}
                  boundaryPolygon={fingerprint?.boundaryPolygon?.length >= 3 ? fingerprint.boundaryPolygon : null} />
              </div>
            )}
            {renderUrl && (
              <div>
                <div style={{ fontSize: px(12), color: C.inkLight, marginBottom: 7, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>After — Annotated</div>
                <GridOverlayImage src={renderUrl} plants={plants} label="After" showGrid={false}
                  perspectiveData={fingerprint?.horizonLinePercent != null ? { horizonLinePercent: fingerprint.horizonLinePercent, vanishingPointXPercent: fingerprint.vanishingPointXPercent, cameraElevationAngle: fingerprint.cameraElevationAngle, scaleCalibrationHeightMetres: fingerprint.scaleCalibrationHeightMetres, scaleCalibrationPixelHeightPercent: fingerprint.scaleCalibrationPixelHeightPercent, foregroundYPercent: fingerprint.foregroundToBackgroundRatio != null ? 55 + (fingerprint.foregroundToBackgroundRatio * 35) : 85 } : null}
                  boundaryPolygon={fingerprint?.boundaryPolygon?.length >= 3 ? fingerprint.boundaryPolygon : null} />
              </div>
            )}
          </div>

          {/* Plant reference */}
          {plants.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Label>Plant Reference</Label>
              <AfterPlantTable plants={plants} />
            </div>
          )}
        </>}

        {/* ── LAYOUT PLAN ── */}
        {activeTab === "layout-plan" && <>
          <SectionTitle n="11b" title="Garden Layout Plan" />
          <div style={{ marginBottom: 14, fontSize: px(BASE - 1), color: C.inkMid }}>Your planting guide — print this and take it outside. Numbers correspond to the plant list below.</div>

          {(aerialImageUrl || aerialGridImageUrl) ? (
            <>
              <GridOverlayImage src={aerialGridImageUrl || aerialImageUrl!} plants={plants} label="Layout Plan"
                perspectiveData={null} boundaryPolygon={null} />

              {plants.length > 0 && (
                <div style={{ marginTop: 22 }}>
                  <Label>Plant Reference — numbers match the plan above</Label>
                  <AfterPlantTable plants={plants} />
                </div>
              )}
            </>
          ) : (
            <div style={{ background: C.surface, borderRadius: C.rLg, padding: 24, textAlign: 'center', color: C.inkLight, fontSize: px(BASE) }}>
              Layout plan not yet generated. Run a garden analysis first.
            </div>
          )}
        </>}

      </div>{/* end content */}

      {/* Footer */}
      <div style={{ background: C.brand, padding: "18px 28px", textAlign: "center", fontFamily: C.font, fontSize: px(13), color: "rgba(255,255,255,0.45)" }}>
        <span style={{ color: C.accent, fontWeight: 700 }}>dedrab.com</span> · Garden Design Platform ·
        Report generated {new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
        <span style={{ marginLeft: 16, opacity: 0.6 }}>·</span>
        <a href="/legal#terms" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: px(11), letterSpacing: "0.08em" }}>Terms</a>
        <a href="/legal#privacy" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: px(11), letterSpacing: "0.08em" }}>Privacy</a>
      </div>
    </div>
  );
}
