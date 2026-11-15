/**
 * PlanDocument.tsx — React-PDF document for a garden planting plan.
 *
 * Rules:
 *   - Only longhand style properties (no shorthand: no padding, margin, border, etc.)
 *   - No browser APIs — this runs server-side inside Inngest
 *   - No external images — SVG is re-drawn as PDF primitives
 *   - Forest & Gold palette to match PlanSvg.tsx
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Rect,
  Circle,
  Line,
  Path,
  Polygon,
  G,
} from '@react-pdf/renderer';
import type { PlantPlacement } from '../planTypes';
import type { ShoppingItem } from '@/lib/planting/types';

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  darkGreen: '#064e3b',
  gold: '#b8962e',
  plantFill: '#d1fae5',
  gridLine: '#c8d5cc',
  note: '#64748b',
  ink: '#1a2e22',
  pageBg: '#F8F9F8',
  white: '#ffffff',
  tableAlt: '#f1f5f9',
  borderLine: '#e2e8f0',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN_PT = 36;    // pt = 0.5 in
const PLAN_W_PT = 480;   // available width for the plan area

const COMPASS_TO_DEG: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

// ─── Seeded PRNG (xorshift32) — mirrors PlanSvg.tsx ──────────────────────────

function makePrng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── PDF plan drawing ─────────────────────────────────────────────────────────

interface PlanDrawingProps {
  widthMetres: number;
  depthMetres: number;
  plants: PlantPlacement[];
  cameraFacing: string;
  seed: number;
}

function PlanDrawing({ widthMetres, depthMetres, plants, cameraFacing, seed }: PlanDrawingProps) {
  const rand = makePrng(seed);
  const mToPt = PLAN_W_PT / widthMetres;
  const planH = depthMetres * mToPt;

  function pt(xm: number, ym: number): [number, number] {
    return [xm * mToPt, (depthMetres - ym) * mToPt];
  }

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  for (let xm = 1; xm < widthMetres; xm++) {
    const x = xm * mToPt;
    const wobble = (rand() - 0.5) * 1.2;
    gridLines.push(
      <Line key={`gv-${xm}`} x1={x + wobble} y1={0} x2={x - wobble} y2={planH}
        stroke={C.gridLine} strokeWidth={0.5} />,
    );
  }
  for (let ym = 1; ym < depthMetres; ym++) {
    const y = ym * mToPt;
    const wobble = (rand() - 0.5) * 1.2;
    gridLines.push(
      <Line key={`gh-${ym}`} x1={0} y1={y + wobble} x2={PLAN_W_PT} y2={y - wobble}
        stroke={C.gridLine} strokeWidth={0.5} />,
    );
  }

  // Plant circles
  const plantEls: React.ReactNode[] = [];
  for (const p of plants) {
    const [cx, cy] = pt(p.xMetres, p.yMetres);
    const r = Math.max(5, (p.spreadMetres / 2) * mToPt);
    const wx = cx + (rand() - 0.5) * 2;
    const wy = cy + (rand() - 0.5) * 2;
    // Dashed circle: draw arc segments manually as short lines (PDF SVG has limited dasharray support)
    const dashSteps = 12;
    const dashArcs: React.ReactNode[] = [];
    for (let i = 0; i < dashSteps; i++) {
      if (i % 2 === 1) continue; // skip alternating segments = dashed effect
      const a1 = (i / dashSteps) * Math.PI * 2;
      const a2 = ((i + 0.7) / dashSteps) * Math.PI * 2;
      dashArcs.push(
        <Path
          key={`arc-${p.number}-${i}`}
          d={`M ${wx + Math.cos(a1) * r} ${wy + Math.sin(a1) * r} A ${r} ${r} 0 0 1 ${wx + Math.cos(a2) * r} ${wy + Math.sin(a2) * r}`}
          stroke={C.darkGreen} strokeWidth={1.2} fill="none"
        />,
      );
    }
    plantEls.push(
      <G key={`plant-${p.number}`}>
        <Circle cx={wx} cy={wy} r={r} fill={C.plantFill} fillOpacity={0.6} stroke="none" />
        {dashArcs}
        <Text
          style={{
            position: 'absolute',
            left: wx - r,
            top: wy - 6,
            width: r * 2,
            textAlign: 'center',
            fontSize: Math.max(7, Math.min(11, r * 0.7)),
            color: C.darkGreen,
            fontWeight: 'bold',
          }}
        >
          {p.number}
        </Text>
      </G>,
    );
  }

  // North arrow
  const arrowX = PLAN_W_PT - 20;
  const arrowY = 20;
  const northRot = (180 - (COMPASS_TO_DEG[cameraFacing] ?? 0) + 360) % 360;
  const rad = (northRot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const len = 12;
  // Arrow tip and tail in rotated space
  const tipX = arrowX + sin * (-len);
  const tipY = arrowY + cos * (-len);  // cos because y is down
  const tailX = arrowX - sin * (-len);
  const tailY = arrowY - cos * (-len);
  const pts = `${tipX},${tipY - 2} ${tipX - 4 * cos},${tipY + 4 * sin} ${tipX + 4 * cos},${tipY - 4 * sin}`;

  return (
    <Svg width={PLAN_W_PT} height={planH}>
      {/* Background */}
      <Rect x={0} y={0} width={PLAN_W_PT} height={planH} fill={C.pageBg} />
      {/* Grid */}
      {gridLines}
      {/* Boundary */}
      <Rect x={0} y={0} width={PLAN_W_PT} height={planH}
        stroke={C.darkGreen} strokeWidth={2} fill="none" />
      {/* Plants */}
      {plantEls}
      {/* North arrow */}
      <Line x1={tailX} y1={tailY} x2={tipX} y2={tipY} stroke={C.darkGreen} strokeWidth={1.5} />
      <Polygon points={pts} fill={C.darkGreen} />
      {/* Scale bar: 2 m */}
      <Line x1={8} y1={planH - 10} x2={8 + 2 * mToPt} y2={planH - 10}
        stroke={C.ink} strokeWidth={1.5} />
      <Line x1={8} y1={planH - 13} x2={8} y2={planH - 7} stroke={C.ink} strokeWidth={1.5} />
      <Line x1={8 + 2 * mToPt} y1={planH - 13} x2={8 + 2 * mToPt} y2={planH - 7}
        stroke={C.ink} strokeWidth={1.5} />
    </Svg>
  );
}

// ─── Shopping list table ──────────────────────────────────────────────────────

function ShoppingTable({ items, plants }: { items: ShoppingItem[]; plants: PlantPlacement[] }) {
  // Build number map from plants array
  const numMap = new Map<string, number>();
  for (const p of plants) numMap.set(p.name, p.number); // keyed by common_name via plant_id mismatch is ok — just for display

  const rows = items.map((item, i) => (
    <View
      key={item.plant_id}
      style={{
        flexDirection: 'row',
        backgroundColor: i % 2 === 0 ? C.white : C.tableAlt,
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 6,
        paddingRight: 6,
      }}
    >
      <Text style={{ width: 24, fontSize: 8, color: C.ink }}>{i + 1}</Text>
      <Text style={{ flex: 1, fontSize: 8, color: C.ink }}>{item.common_name}</Text>
      <Text style={{ flex: 1.4, fontSize: 7, color: C.note, fontStyle: 'italic' }}>{item.botanical_name}</Text>
      <Text style={{ width: 24, fontSize: 8, color: C.ink, textAlign: 'right' }}>{item.quantity}</Text>
    </View>
  ));

  return (
    <View>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: C.darkGreen,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 6,
        paddingRight: 6,
      }}>
        <Text style={{ width: 24, fontSize: 8, color: C.white, fontWeight: 'bold' }}>#</Text>
        <Text style={{ flex: 1, fontSize: 8, color: C.white, fontWeight: 'bold' }}>Plant</Text>
        <Text style={{ flex: 1.4, fontSize: 8, color: C.white, fontWeight: 'bold' }}>Botanical name</Text>
        <Text style={{ width: 24, fontSize: 8, color: C.white, fontWeight: 'bold', textAlign: 'right' }}>Qty</Text>
      </View>
      {rows}
    </View>
  );
}

// ─── Main document ────────────────────────────────────────────────────────────

export interface PlanDocumentProps {
  widthMetres: number;
  depthMetres: number;
  plants: PlantPlacement[];
  shoppingList: ShoppingItem[];
  cameraFacing: string;
  seed?: number;
  generatedAt?: string;
}

export function PlanDocument({
  widthMetres,
  depthMetres,
  plants,
  shoppingList,
  cameraFacing,
  seed = 42,
  generatedAt,
}: PlanDocumentProps) {
  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document
      title="Garden Planting Plan"
      author="Dedrab"
      subject="Indicative planting plan"
    >
      <Page
        size="A4"
        style={{
          backgroundColor: C.pageBg,
          paddingTop: MARGIN_PT,
          paddingBottom: MARGIN_PT,
          paddingLeft: MARGIN_PT,
          paddingRight: MARGIN_PT,
          fontFamily: 'Helvetica',
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 20, color: C.darkGreen, fontWeight: 'bold', letterSpacing: 2 }}>
            Dedrab
          </Text>
          <Text style={{ fontSize: 8, color: C.gold, letterSpacing: 3, marginTop: 2 }}>
            GARDEN PLANTING PLAN
          </Text>
          <View style={{ height: 1.5, backgroundColor: C.gold, marginTop: 6 }} />
        </View>

        {/* Meta */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: C.note }}>Garden size</Text>
            <Text style={{ fontSize: 10, color: C.ink, marginTop: 2 }}>
              {widthMetres} m wide x {depthMetres} m deep
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: C.note }}>Camera facing</Text>
            <Text style={{ fontSize: 10, color: C.ink, marginTop: 2 }}>{cameraFacing}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: C.note }}>Generated</Text>
            <Text style={{ fontSize: 10, color: C.ink, marginTop: 2 }}>{dateStr}</Text>
          </View>
        </View>

        {/* Plan drawing */}
        <View style={{ marginBottom: 12 }}>
          <PlanDrawing
            widthMetres={widthMetres}
            depthMetres={depthMetres}
            plants={plants}
            cameraFacing={cameraFacing}
            seed={seed}
          />
        </View>

        {/* Indicative note */}
        <Text style={{ fontSize: 7, color: C.note, fontStyle: 'italic', marginBottom: 16, textAlign: 'center' }}>
          Indicative plan, approximate scale. Positions are suggestions only.
        </Text>

        {/* Shopping list */}
        {shoppingList.length > 0 && (
          <View>
            <Text style={{ fontSize: 11, color: C.darkGreen, fontWeight: 'bold', marginBottom: 6 }}>
              Shopping list
            </Text>
            <ShoppingTable items={shoppingList} plants={plants} />
            <Text style={{ fontSize: 7, color: C.note, marginTop: 6, fontStyle: 'italic' }}>
              Price estimates are for standard 2 L pots from UK garden centres. Actual prices will vary.
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
