'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import PDFButton from "@/components/PDFButton";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DESIGN_LANGUAGES = [
  "English Cottage",  "European Urban", "Functional Lifestyle", 
  "Irish Urban", "Irish Rural", "Modernist Minimal", "Woodland Shade", "Mediterranean", 
  "Tropical Lush", "Native Rewilding", "Zen Budist",
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
  brandMid:    "#16a34a",      // active/highlight green
  brandLight:  "#f0fdf4",      // very light green tint
  accent:      "#b8962e",      // antique gold (slightly muted)
  accentLight: "#fefce8",

  // Neutrals
  ink:         "#111827",      // near-black text
  inkMid:      "#374151",      // body text
  inkLight:    "#6b7280",      // secondary text
  rule:        "#e5e7eb",      // borders / dividers
  ruleDark:    "#d1d5db",
  surface:     "#f9fafb",      // page background
  card:        "#ffffff",

  // Semantic
  red:         "#dc2626",
  green:       "#16a34a",
  amber:       "#d97706",
  blue:        "#1d4ed8",

  // Radius & shadow
  r:           "4px",
  rLg:         "8px",
  shadow:      "0 1px 3px rgba(0,0,0,0.08)",
  shadowMd:    "0 4px 12px rgba(0,0,0,0.10)",

  // Font
  font: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

// Base font size — 16px matches standard report body text
const BASE = 16;
const px = (n: number) => `${n}px`;

// ─── GRID OVERLAY CANVAS ──────────────────────────────────────────────────────

function GridOverlayImage({ src, plants, label }: { src: string; plants: any[]; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!src || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const cols = 6, rows = 6;
      const cw = img.width / cols, rh = img.height / rows;

      // Grid lines
      ctx.strokeStyle = "rgba(184,150,46,0.55)";
      ctx.lineWidth = Math.max(1, img.width / 600);
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, img.height); ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * rh); ctx.lineTo(img.width, r * rh); ctx.stroke();
      }

      // Column / row labels
      const colLetters = ["A","B","C","D","E","F"];
      const labelSize = Math.max(11, img.width / 50);
      ctx.fillStyle = "rgba(184,150,46,0.9)";
      ctx.font = `600 ${labelSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      for (let c = 0; c < cols; c++) {
        ctx.fillText(colLetters[c], c * cw + cw / 2, labelSize + 4);
      }
      ctx.textAlign = "left";
      for (let r = 0; r < rows; r++) {
        ctx.fillText(String(r + 1), 6, r * rh + rh / 2 + labelSize / 3);
      }

      // Plant markers
      if (plants?.length > 0) {
        plants.forEach((plant, idx) => {
          if (!plant.gridLocation) return;
          const loc = plant.gridLocation.trim().toUpperCase();
          const match = loc.match(/^([A-F])(\d)/);
          if (!match) return;
          const colIdx = colLetters.indexOf(match[1]);
          const rowIdx = parseInt(match[2]) - 1;
          if (colIdx < 0 || rowIdx < 0 || rowIdx > 5) return;

          const cx = colIdx * cw + cw / 2;
          const cy = rowIdx * rh + rh / 2;
          const r = Math.max(14, img.width / 55);

          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(10,61,43,0.88)";
          ctx.fill();
          ctx.strokeStyle = "#b8962e";
          ctx.lineWidth = Math.max(2, img.width / 320);
          ctx.stroke();

          ctx.fillStyle = "#fff";
          ctx.font = `700 ${Math.max(10, img.width / 65)}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(String(idx + 1), cx, cy + Math.max(4, img.width / 130));
        });
      }
    };
    img.onerror = () => {
      canvas.width = 600; canvas.height = 400;
      ctx.fillStyle = "#1f2937"; ctx.fillRect(0,0,600,400);
      ctx.fillStyle = "#6b7280"; ctx.font = "15px Inter, sans-serif";
      ctx.textAlign = "center"; ctx.fillText("Image unavailable", 300, 200);
    };
    img.src = src;
  }, [src, plants]);

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block", borderRadius: C.r, border: `1px solid ${C.rule}` }} />
      <div style={{
        position: "absolute", top: 8, left: 8,
        background: C.brand, color: C.accent,
        fontSize: px(10), fontFamily: C.font, letterSpacing: "0.12em",
        padding: "3px 10px", borderRadius: C.r, textTransform: "uppercase", fontWeight: 700
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
      <h2 style={{ margin: 0, fontFamily: C.font, fontSize: px(17), fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>{title}</h2>
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
              <td style={{ padding: "9px 13px", fontStyle: "italic", color: C.brand, fontWeight: 600 }}>{p.botanicalName}</td>
              <td style={{ padding: "9px 13px", color: C.ink }}>{p.commonName}{p.cultivar ? ` '${p.cultivar}'` : ""}</td>
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

function CostTable({ costEstimate }: { costEstimate: any }) {
  if (!costEstimate?.lines?.length) return null;
  const lo = costEstimate.lines.reduce((s: number, l: any) => s + (l.low || 0), 0);
  const hi = costEstimate.lines.reduce((s: number, l: any) => s + (l.high || 0), 0);
  const mid = (lo + hi) / 2;
  const cont = mid * ((costEstimate.contingencyPercent || 15) / 100);
  const total = mid + cont;
  const fmt = (n: number) => `£${Math.round(n).toLocaleString()}`;
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
            <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 700, color: "#fff", fontSize: px(BASE) }}>Total Estimate (mid-point + contingency)</td>
            <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 700, color: C.accent, fontSize: px(BASE) }}>{fmt(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── GRID OVERLAY GENERATOR (returns base64 data URL for PDF) ────────────────

function generateGridOverlay(src: string, plants: any[]): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const cols = 6, rows = 6;
      const cw = img.width / cols;
      const rh = img.height / rows;
      const colLetters = ["A","B","C","D","E","F"];

      // Grid lines
      ctx.strokeStyle = "rgba(184,150,46,0.55)";
      ctx.lineWidth = Math.max(1, img.width / 600);
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, img.height); ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * rh); ctx.lineTo(img.width, r * rh); ctx.stroke();
      }

      // Column / row labels
      const labelSize = Math.max(11, img.width / 50);
      ctx.fillStyle = "rgba(184,150,46,0.9)";
      ctx.font = `700 ${labelSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      for (let c = 0; c < cols; c++) {
        ctx.fillText(colLetters[c], c * cw + cw / 2, labelSize + 4);
      }
      ctx.textAlign = "left";
      for (let r = 0; r < rows; r++) {
        ctx.fillText(String(r + 1), 6, r * rh + rh / 2 + labelSize / 3);
      }

      // Plant number markers
      const markerR = Math.max(14, img.width / 55);
      const fontSize = Math.max(10, img.width / 65);

      plants.forEach((plant, idx) => {
        if (!plant.gridLocation) return;
        const loc = plant.gridLocation.trim().toUpperCase();
        const match = loc.match(/^([A-F])(\d)/);
        if (!match) return;
        const colIdx = colLetters.indexOf(match[1]);
        const rowIdx = parseInt(match[2]) - 1;
        if (colIdx < 0 || rowIdx < 0 || rowIdx > 5) return;

        const cx = colIdx * cw + cw / 2;
        const cy = rowIdx * rh + rh / 2;

        // Circle
        ctx.beginPath();
        ctx.arc(cx, cy, markerR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(10,61,43,0.92)";
        ctx.fill();
        ctx.strokeStyle = "#b8962e";
        ctx.lineWidth = Math.max(2, img.width / 320);
        ctx.stroke();

        // Number
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(idx + 1), cx, cy);
      });

      ctx.textBaseline = "alphabetic"; // reset
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(""); // fail gracefully
    img.src = src;
  });
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function GardigApp() {
  const [step, setStep]               = useState<"upload"|"loading"|"result">("upload");
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [designLang, setDesignLang]   = useState("Japanese Zen");
  const [clientName, setClientName]   = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [docData, setDocData]         = useState<any>(null);
  const [renderUrl, setRenderUrl]     = useState<string | null>(null);
  const [gridImageUrl, setGridImageUrl] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg]   = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState("overview");
  const [showBefore, setShowBefore]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;
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

  const callGemini = async (base64Data: string, mimeType: string) => {
    const res = await fetch('/api/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: `data:${mimeType};base64,${base64Data}`,
        designLang,
        clientName: clientName || 'Client',
        siteAddress: siteAddress || 'Private Residence',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Analysis failed (${res.status})`);
    }
    return res.json();
  };

  const generateRender = async (dataUrl: string, visualPrompt: string) => {
    const response = await fetch('/api/redesign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, style: designLang, orientation: 'South Facing (Full Sun)' }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.imageBase64 || null;
  };

  const handleAnalyse = async () => {
    if (!imageDataUrl) { setError("Please upload a site photo."); return; }
    setError(null);
    setStep("loading");
    try {
      setLoadingMsg("Analysing site photograph...");
      const base64 = imageDataUrl.split(",")[1];
      const mimeType = imageDataUrl.split(";")[0].split(":")[1];
      const doc = await callGemini(base64, mimeType);
      setDocData(doc);
      setLoadingMsg("Generating design render...");
      let imgBase64: string | null = null;
      if (doc.visualPrompt) {
        imgBase64 = await generateRender(imageDataUrl, doc.visualPrompt);
        setRenderUrl(imgBase64);
      }

      // Generate annotated grid overlay for PDF
      setLoadingMsg("Annotating grid overlay...");
      const plants = doc.plantingSpecification?.plants || [];
      if (imgBase64 && plants.length > 0) {
        const overlay = await generateGridOverlay(imgBase64, plants);
        setGridImageUrl(overlay || null);
      } else if (imageDataUrl && plants.length > 0) {
        // Fallback: annotate the before photo if no render
        const overlay = await generateGridOverlay(imageDataUrl, plants);
        setGridImageUrl(overlay || null);
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box}`}</style>

      {/* Top bar */}
      <header style={{ background: C.card, borderBottom: `1px solid ${C.rule}`, height: 56, display: "flex", alignItems: "center", padding: "0 28px", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: C.r, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontWeight: 700, fontSize: 15 }}>G</div>
        <span style={{ fontWeight: 700, fontSize: px(17), color: C.ink, letterSpacing: "-0.01em" }}>gardig.com</span>
        <span style={{ fontSize: px(13), color: C.inkLight, marginLeft: 2 }}>Landscape Design Platform</span>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "44px 24px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: px(11), letterSpacing: "0.15em", color: C.accent, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Site Analysis & Design</div>
          <h1 style={{ fontSize: px(30), margin: "0 0 10px", color: C.ink, fontWeight: 700, letterSpacing: "-0.02em" }}>Generate a Garden Design Proposal</h1>
          <p style={{ color: C.inkMid, maxWidth: 500, margin: 0, fontSize: px(BASE), lineHeight: 1.6 }}>
            Upload a site photo to receive a full proposal — plant list, spatial layout, cost estimate, and AI-generated render.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* Upload */}
          <Card>
            <Label>01 — Site Photo</Label>
            <div
              onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${imageDataUrl ? C.brand : C.ruleDark}`,
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
                    <div style={{ color: C.inkLight, fontSize: px(12), marginTop: 3 }}>JPG, PNG, WEBP</div>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </Card>

          {/* Project details */}
          <Card>
            <Label>02 — Project Details</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {([
                { label: "Client Name", val: clientName, set: setClientName, ph: "e.g. Johnson Residence" },
                { label: "Site Address", val: siteAddress, set: setSiteAddress, ph: "e.g. Dublin 8, Ireland" },
              ] as any[]).map(({ label, val, set, ph }) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: px(12), color: C.inkLight, marginBottom: 5, fontWeight: 600 }}>{label}</label>
                  <input value={val} onChange={(e: any) => set(e.target.value)} placeholder={ph}
                    style={{ width: "100%", padding: "9px 11px", border: `1px solid ${C.rule}`, borderRadius: C.r, fontFamily: C.font, fontSize: px(BASE - 1), color: C.ink, outline: "none" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: px(12), color: C.inkLight, marginBottom: 5, fontWeight: 600 }}>Design Language</label>
                <select value={designLang} onChange={(e: any) => setDesignLang(e.target.value)}
                  style={{ width: "100%", padding: "9px 11px", border: `1px solid ${C.rule}`, borderRadius: C.r, fontFamily: C.font, fontSize: px(BASE - 1), background: C.card, color: C.ink, outline: "none" }}>
                  {DESIGN_LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

            </div>
          </Card>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: `1px solid #fca5a5`, borderRadius: C.r, padding: "11px 15px", color: C.red, fontSize: px(14), marginTop: 14 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 22 }}>
          <button onClick={handleAnalyse} disabled={!imageDataUrl}
            style={{
              background: imageDataUrl ? C.brand : "#d1d5db",
              color: imageDataUrl ? C.accent : "#9ca3af",
              border: "none", padding: "14px 48px", borderRadius: C.r,
              fontSize: px(BASE), fontFamily: C.font, fontWeight: 700,
              cursor: imageDataUrl ? "pointer" : "not-allowed",
              boxShadow: imageDataUrl ? C.shadowMd : "none", letterSpacing: "0.01em"
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${C.rule}`, borderTopColor: C.brand, margin: "0 auto 18px", animation: "spin 0.75s linear infinite" }} />
        <div style={{ fontSize: px(18), fontWeight: 700, color: C.ink, marginBottom: 6 }}>Analysing Your Site</div>
        <div style={{ fontSize: px(14), color: C.inkLight }}>{loadingMsg}</div>
      </div>
    </div>
  );

  // ── RESULTS SCREEN ─────────────────────────────────────────────────────────
  const doc = docData || {};
  const plants = doc.plantingSpecification?.plants || [];

  const TABS = [
    { id: "overview",        label: "Overview" },
    { id: "site",            label: "Site Analysis" },
    { id: "concept",         label: "Design Concept" },
    { id: "spatial",         label: "Spatial Layout" },
    { id: "planting",        label: "Planting" },
    { id: "hardscape",       label: "Hardscape" },
    { id: "soil",            label: "Soil & Water" },
    { id: "implementation",  label: "Phasing" },
    { id: "maintenance",     label: "Maintenance" },
    { id: "costs",           label: "Cost Estimate" },
    { id: "visuals",         label: "Visuals" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.surface, fontFamily: C.font, color: C.ink, fontSize: px(BASE) }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        .tab:hover{background:${C.brandLight}!important;color:${C.brand}!important}
        @media print{.noprint{display:none!important};body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      `}</style>

      {/* Sticky header */}
      <header className="noprint" style={{ background: C.card, borderBottom: `1px solid ${C.rule}`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: C.shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: C.r, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontWeight: 700, fontSize: 15 }}>G</div>
          <span style={{ fontWeight: 700, fontSize: px(17), color: C.ink }}>gardig.com</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setStep("upload"); setDocData(null); setRenderUrl(null); setGridImageUrl(null); }}
            style={{ background: C.card, border: `1px solid ${C.rule}`, color: C.inkMid, padding: "7px 15px", borderRadius: C.r, cursor: "pointer", fontFamily: C.font, fontSize: px(13), fontWeight: 600 }}>
            ← New Analysis
          </button>
          <PDFButton
            doc={docData}
            imageBase64={renderUrl || ''}
            imageDataUrl={imageDataUrl || undefined}
            gridImageUrl={gridImageUrl || undefined}
            style={designLang}
            clientName={clientName || undefined}
            siteAddress={siteAddress || undefined}
          />
        </div>
      </header>

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
            {clientName || "Client"} · {siteAddress || "Private Residence"} · {new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div className="noprint" style={{ background: C.card, borderBottom: `1px solid ${C.rule}`, overflowX: "auto" }}>
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
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && <>
          <SectionTitle n="01" title="Project Overview" />
          <Card accent>
            <Body>{doc.overview?.scopeDescription}</Body>
          </Card>
          <StatGrid items={[
            { label: "Client",            value: clientName || "Private Client" },
            { label: "Site",              value: siteAddress || "Private Residence" },
            { label: "Design Language",   value: designLang },
            { label: "Estimated Area",    value: doc.overview?.estimatedAreaSqm ? `${doc.overview.estimatedAreaSqm} m²` : "—" },
            { label: "Report Date",       value: new Date().toLocaleDateString("en-GB") },
            { label: "AI Confidence",     value: doc.confidence ? `${Math.round(doc.confidence * 100)}%` : "—" },
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
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
            { label: "Professional Visits/Year",  value: String(doc.maintenanceSchedule?.professionalVisitsPerYear || "—") },
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
          <SectionTitle n="10" title="Cost Estimate" />
          <CostTable costEstimate={doc.costEstimate} />
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
            <Label>{showBefore ? "Original Site Photo" : "AI Render — Proposed Design"}</Label>
            {showBefore
              ? imageDataUrl && <img src={imageDataUrl} alt="Before" style={{ width: "100%", borderRadius: C.rLg, maxHeight: 480, objectFit: "cover", border: `1px solid ${C.rule}` }} />
              : renderUrl
                ? <img src={renderUrl} alt="AI Render" style={{ width: "100%", borderRadius: C.rLg, maxHeight: 480, objectFit: "cover", border: `1px solid ${C.rule}` }} />
                : <div style={{ background: C.surface, borderRadius: C.rLg, height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: C.inkLight, fontSize: px(BASE), border: `1px solid ${C.rule}` }}>Render not available</div>
            }
          </div>

          {/* Grid overlays */}
          <div style={{ marginBottom: 10 }}><Label>Grid Reference Overlays — A–F (columns) × 1–6 (rows)</Label></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {imageDataUrl && (
              <div>
                <div style={{ fontSize: px(12), color: C.inkLight, marginBottom: 7, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Before — Annotated</div>
                <GridOverlayImage src={imageDataUrl} plants={plants} label="Before" />
              </div>
            )}
            {renderUrl && (
              <div>
                <div style={{ fontSize: px(12), color: C.inkLight, marginBottom: 7, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>After — Annotated</div>
                <GridOverlayImage src={renderUrl} plants={plants} label="After" />
              </div>
            )}
          </div>

          {/* Plant key */}
          {plants.length > 0 && (
            <Card>
              <Label>Plant Location Key</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 9, marginTop: 8 }}>
                {plants.map((p: any, i: number) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.surface, borderRadius: C.r, border: `1px solid ${C.rule}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: C.r, background: C.brand, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: px(13), fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                    <div>
                      <div style={{ fontStyle: "italic", color: C.brand, fontWeight: 600, fontSize: px(13) }}>{p.botanicalName}</div>
                      <div style={{ color: C.inkLight, fontSize: px(12) }}>{p.commonName} · <strong style={{ color: C.accent }}>{p.gridLocation}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>}

      </div>{/* end content */}

      {/* Footer */}
      <div style={{ background: C.brand, padding: "18px 28px", textAlign: "center", fontFamily: C.font, fontSize: px(13), color: "rgba(255,255,255,0.45)" }}>
        <span style={{ color: C.accent, fontWeight: 700 }}>gardig.com</span> · Garden Design Platform ·
        Report generated {new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
      </div>
    </div>
  );
}
