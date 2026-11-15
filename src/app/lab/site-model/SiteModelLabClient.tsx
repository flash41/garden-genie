'use client';

/**
 * SiteModelLabClient — interactive site-model test harness
 *
 * Upload a photo, drag four corner pins on it (touch + mouse), enter one
 * measurement, then see the computed top-down plan live with sample plant
 * data from the fixture file.
 *
 * Zero AI, zero cost. All computation is in the browser.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { recoverDimensions, type CornerPoints } from '@/lib/site-model/dimensions';
import { buildSunGrid, type Compass } from '@/lib/site-model/sun-grid';
import { PlanSvg } from '@/components/plan/PlanSvg';
import type { PlantPlacement } from '@/components/plan/planTypes';
import plantsFixture from '@/data/plants-fixture.json';

// ─── Types ────────────────────────────────────────────────────────────────────

type CornerKey = 'frontLeft' | 'frontRight' | 'rearLeft' | 'rearRight';

const CORNER_LABELS: Record<CornerKey, string> = {
  frontLeft:  'FL',
  frontRight: 'FR',
  rearLeft:   'RL',
  rearRight:  'RR',
};

const CORNER_COLOURS: Record<CornerKey, string> = {
  frontLeft:  '#ef4444',
  frontRight: '#f97316',
  rearLeft:   '#3b82f6',
  rearRight:  '#8b5cf6',
};

const COMPASS_OPTIONS: Compass[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// ─── Sample plants for the fixture preview ────────────────────────────────────

function buildSamplePlacements(wM: number, dM: number): PlantPlacement[] {
  const picks = plantsFixture.slice(0, 8);
  return picks.map((p, i) => {
    const cols = 4;
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      number: i + 1,
      name: p.common_name,
      quantity: 1,
      xMetres: 0.5 + col * (wM / cols),
      yMetres: 0.5 + row * (dM / Math.ceil(picks.length / cols)),
      spreadMetres: (p.spread_m as number) ?? 0.6,
      light: ((p.light as string[])[0] as PlantPlacement['light']) ?? 'full_sun',
    };
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SiteModelLabClient() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageNaturalW, setImageNaturalW] = useState(0);
  const [imageNaturalH, setImageNaturalH] = useState(0);
  const [displayW, setDisplayW] = useState(0);
  const [displayH, setDisplayH] = useState(0);

  const [corners, setCorners] = useState<Record<CornerKey, { x: number; y: number }>>({
    frontLeft:  { x: 0.15, y: 0.80 },
    frontRight: { x: 0.85, y: 0.80 },
    rearLeft:   { x: 0.35, y: 0.35 },
    rearRight:  { x: 0.65, y: 0.35 },
  });

  const [knownMetres, setKnownMetres] = useState('6');
  const [depthMetres, setDepthMetres]   = useState('');
  const [which, setWhich]               = useState<'rear' | 'front'>('rear');
  const [compass, setCompass]           = useState<Compass>('N');
  const [hemisphere, setHemisphere]     = useState<'north' | 'south'>('north');
  const [boundaryH, setBoundaryH]       = useState('1.8');

  const [dragging, setDragging]  = useState<CornerKey | null>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  // ── File upload ────────────────────────────────────────────────────────────

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  // ── Measure display dimensions ─────────────────────────────────────────────

  const measureContainer = useCallback(() => {
    const el = imgContainerRef.current;
    if (!el) return;
    setDisplayW(el.clientWidth);
    setDisplayH(el.clientHeight);
  }, []);

  useEffect(() => {
    if (!imgContainerRef.current) return;
    const ro = new ResizeObserver(measureContainer);
    ro.observe(imgContainerRef.current);
    return () => ro.disconnect();
  }, [measureContainer]);

  // ── Pin drag (mouse + touch) ───────────────────────────────────────────────

  function getRelative(e: React.PointerEvent | React.TouchEvent): { x: number; y: number } | null {
    const el = imgContainerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      clientX = t.clientX; clientY = t.clientY;
    } else {
      clientX = (e as React.PointerEvent).clientX;
      clientY = (e as React.PointerEvent).clientY;
    }
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x, y };
  }

  function startDrag(key: CornerKey) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(key);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const pt = getRelative(e);
    if (!pt) return;
    setCorners(prev => ({ ...prev, [dragging]: pt }));
  }

  function onPointerUp() { setDragging(null); }

  // ── Compute dimensions + sun grid ─────────────────────────────────────────

  const dimensionsResult = useMemo(() => {
    if (!imageNaturalW || !imageNaturalH) return null;
    const kn = parseFloat(knownMetres);
    if (isNaN(kn) || kn <= 0) return null;
    const dep = parseFloat(depthMetres);
    return recoverDimensions(
      corners as CornerPoints,
      imageNaturalW, imageNaturalH,
      kn, which,
      isNaN(dep) || dep <= 0 ? undefined : dep,
    );
  }, [corners, imageNaturalW, imageNaturalH, knownMetres, depthMetres, which]);

  const sunGrid = useMemo(() => {
    if (!dimensionsResult || dimensionsResult.confidence === 'depth_required') return undefined;
    const h = parseFloat(boundaryH);
    return buildSunGrid(
      dimensionsResult.widthMetres,
      dimensionsResult.depthMetres,
      compass,
      hemisphere,
      { rear: h || 1.8, front: h || 1.8, left: h || 1.8, right: h || 1.8 },
    );
  }, [dimensionsResult, compass, hemisphere, boundaryH]);

  const samplePlants = useMemo(() => {
    if (!dimensionsResult || dimensionsResult.confidence === 'depth_required') return [];
    return buildSamplePlacements(dimensionsResult.widthMetres, dimensionsResult.depthMetres);
  }, [dimensionsResult]);

  // ─────────────────────────────────────────────────────────────────────────

  const C = { stone: '#F8F9F8', emerald: '#064e3b', gold: '#D4AF37', ink: '#1a2e22', rule: '#e2e8e4' };

  return (
    <div style={{ minHeight: '100vh', background: C.stone, fontFamily: 'Georgia, serif', color: C.ink }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.emerald, marginBottom: 4 }}>
          Site Model Lab
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
          Upload a photo, place the four corner pins, and enter one measurement to see the top-down plan.
          No AI, no cost.
        </p>

        {/* Upload zone */}
        {!imageUrl && (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{
              border: `2px dashed ${C.gold}`, borderRadius: 8, padding: '48px 24px',
              textAlign: 'center', marginBottom: 24, cursor: 'pointer', background: '#fafaf8',
            }}
            onClick={() => document.getElementById('lab-file-input')?.click()}
          >
            <p style={{ color: C.emerald, fontWeight: 600 }}>Drop a garden photo here, or click to browse</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>JPEG, PNG or WebP</p>
            <input
              id="lab-file-input" type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handleInputChange}
            />
          </div>
        )}

        {imageUrl && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* Left: photo + pins */}
            <div>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                Drag the coloured pins to the four garden corners.
                <br />
                <strong style={{ color: C.emerald }}>Red/Orange = front. Blue/Purple = rear.</strong>
              </p>
              <div
                ref={imgContainerRef}
                style={{ position: 'relative', userSelect: 'none', touchAction: 'none', borderRadius: 6, overflow: 'hidden' }}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl} alt="Garden photo"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  onLoad={e => {
                    const img = e.currentTarget;
                    setImageNaturalW(img.naturalWidth);
                    setImageNaturalH(img.naturalHeight);
                    setDisplayW(img.clientWidth);
                    setDisplayH(img.clientHeight);
                  }}
                />
                {/* Corner pins */}
                {(Object.keys(corners) as CornerKey[]).map(key => {
                  const pt = corners[key];
                  const col = CORNER_COLOURS[key];
                  const label = CORNER_LABELS[key];
                  return (
                    <div
                      key={key}
                      onPointerDown={startDrag(key)}
                      style={{
                        position: 'absolute',
                        left: `${pt.x * 100}%`,
                        top:  `${pt.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: 28, height: 28,
                        borderRadius: '50%',
                        background: col,
                        border: '2px solid white',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        cursor: 'grab',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: 'white',
                        touchAction: 'none',
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setImageUrl(null)}
                style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Change photo
              </button>
            </div>

            {/* Right: controls + result */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Known measurement */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.emerald, display: 'block', marginBottom: 4 }}>
                  Known measurement (metres)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number" min={0.5} max={100} step={0.1}
                    value={knownMetres}
                    onChange={e => setKnownMetres(e.target.value)}
                    style={{ width: 80, padding: '6px 8px', border: `1px solid ${C.rule}`, borderRadius: 4, fontFamily: 'inherit', fontSize: 13 }}
                  />
                  <select
                    value={which}
                    onChange={e => setWhich(e.target.value as 'rear' | 'front')}
                    style={{ padding: '6px 8px', border: `1px solid ${C.rule}`, borderRadius: 4, fontFamily: 'inherit', fontSize: 12 }}
                  >
                    <option value="rear">Rear width</option>
                    <option value="front">Front width</option>
                  </select>
                </div>
              </div>

              {/* Optional depth */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.emerald, display: 'block', marginBottom: 4 }}>
                  Depth (metres) — optional, estimated if blank
                </label>
                <input
                  type="number" min={0.5} max={100} step={0.1}
                  value={depthMetres} placeholder="auto-estimate"
                  onChange={e => setDepthMetres(e.target.value)}
                  style={{ width: 120, padding: '6px 8px', border: `1px solid ${C.rule}`, borderRadius: 4, fontFamily: 'inherit', fontSize: 13 }}
                />
              </div>

              {/* Compass */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.emerald, display: 'block', marginBottom: 4 }}>
                  Camera faces (toward rear boundary)
                </label>
                <select
                  value={compass}
                  onChange={e => setCompass(e.target.value as Compass)}
                  style={{ padding: '6px 8px', border: `1px solid ${C.rule}`, borderRadius: 4, fontFamily: 'inherit', fontSize: 12 }}
                >
                  {COMPASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Hemisphere */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.emerald, display: 'block', marginBottom: 4 }}>
                  Hemisphere
                </label>
                <select
                  value={hemisphere}
                  onChange={e => setHemisphere(e.target.value as 'north' | 'south')}
                  style={{ padding: '6px 8px', border: `1px solid ${C.rule}`, borderRadius: 4, fontFamily: 'inherit', fontSize: 12 }}
                >
                  <option value="north">Northern (UK, Ireland, US)</option>
                  <option value="south">Southern (Australia, NZ)</option>
                </select>
              </div>

              {/* Boundary heights */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.emerald, display: 'block', marginBottom: 4 }}>
                  Boundary height (metres, all sides)
                </label>
                <input
                  type="number" min={0} max={10} step={0.1}
                  value={boundaryH}
                  onChange={e => setBoundaryH(e.target.value)}
                  style={{ width: 80, padding: '6px 8px', border: `1px solid ${C.rule}`, borderRadius: 4, fontFamily: 'inherit', fontSize: 13 }}
                />
              </div>

              {/* Result */}
              {dimensionsResult && (
                <div style={{
                  background: dimensionsResult.confidence === 'depth_required' ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${dimensionsResult.confidence === 'depth_required' ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: 6, padding: 12, fontSize: 12,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: dimensionsResult.confidence === 'depth_required' ? '#dc2626' : C.emerald }}>
                    {dimensionsResult.confidence === 'measured' && 'Dimensions (measured)'}
                    {dimensionsResult.confidence === 'estimated' && 'Dimensions (estimated from perspective)'}
                    {dimensionsResult.confidence === 'depth_required' && 'Depth estimate not possible'}
                  </div>
                  {dimensionsResult.confidence !== 'depth_required' ? (
                    <ul style={{ margin: 0, paddingLeft: 16, color: C.ink }}>
                      <li>Width: {dimensionsResult.widthMetres.toFixed(1)} m</li>
                      <li>Depth: {dimensionsResult.depthMetres.toFixed(1)} m</li>
                      <li>Area: {dimensionsResult.areaMetres.toFixed(1)} m²</li>
                    </ul>
                  ) : (
                    <p style={{ color: '#7f1d1d', margin: 0 }}>{dimensionsResult.reason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plan preview */}
        {dimensionsResult && dimensionsResult.confidence !== 'depth_required' && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.emerald, marginBottom: 12 }}>
              Top-down plan preview (sample plants)
            </h2>
            <div style={{ maxWidth: 500 }}>
              <PlanSvg
                widthMetres={dimensionsResult.widthMetres}
                depthMetres={dimensionsResult.depthMetres}
                sunGrid={sunGrid?.grid}
                cellSizeMetres={sunGrid?.cellSizeMetres ?? 0.5}
                plants={samplePlants}
                cameraFacing={compass}
                seed={42}
                svgWidth={500}
              />
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
              Sample plants from fixture. Sun tinting: yellow = full sun, blue = part shade, purple = shade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
