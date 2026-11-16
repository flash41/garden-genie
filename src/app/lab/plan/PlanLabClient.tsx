'use client';

/**
 * PlanLabClient — unified planting-plan generator.
 *
 * Flow:
 *   1. Upload photo, drag four corner pins
 *   2. Enter one measurement (+ depth if geometry requires it), camera facing,
 *      boundary heights, hemisphere, typed location, hardiness, style
 *   3. Submit -> POST /api/plan/create -> get job_id
 *   4. Poll  -> GET  /api/plan/status?job_id=... every 2 s
 *   5. Show results as they arrive (staged: plan, then render, then PDF)
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { compressImage } from '@/lib/compressImage';
import { recoverDimensions, type CornerPoints } from '@/lib/site-model/dimensions';
import { buildSunGrid, type Compass } from '@/lib/site-model/sun-grid';
import { PlanSvg } from '@/components/plan/PlanSvg';
import type { PlantPlacement } from '@/components/plan/planTypes';
import type { ShoppingItem, PlantingSuggestion } from '@/lib/planting/types';
import type { SunLabel } from '@/lib/site-model/sun-grid';

// ─── Types ────────────────────────────────────────────────────────────────────

type CornerKey = 'frontLeft' | 'frontRight' | 'rearLeft' | 'rearRight';
type RhsOption = 'H1a' | 'H1b' | 'H1c' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7';
type FacingOption = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

const CORNER_LABELS: Record<CornerKey, string> = {
  frontLeft: 'FL', frontRight: 'FR', rearLeft: 'RL', rearRight: 'RR',
};
const CORNER_COLOURS: Record<CornerKey, string> = {
  frontLeft: '#ef4444', frontRight: '#f97316', rearLeft: '#3b82f6', rearRight: '#8b5cf6',
};

interface JobStatus {
  id: string;
  planting_status: string;
  render_status: string;
  pdf_status: string;
  planting_error?: string;
  render_error?: string;
  pdf_error?: string;
  validated_suggestions?: PlantingSuggestion[];
  shopping_list?: ShoppingItem[];
  render_url?: string;
  pdf_url?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function suggestionsToPlantPlacements(
  suggestions: PlantingSuggestion[],
  shoppingList: ShoppingItem[],
): PlantPlacement[] {
  const nameMap = new Map(shoppingList.map(s => [s.plant_id, s.common_name]));
  const numberMap = new Map<string, number>();
  let nextNum = 1;
  for (const s of suggestions) {
    if (!numberMap.has(s.plant_id)) numberMap.set(s.plant_id, nextNum++);
  }

  return suggestions.map(s => ({
    number: numberMap.get(s.plant_id) ?? 1,
    name: nameMap.get(s.plant_id) ?? s.plant_id,
    quantity: s.quantity,
    xMetres: s.x_metres,
    yMetres: s.y_metres,
    spreadMetres: 0.5,
    light: s.light ?? ('full_sun' as SunLabel),
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlanLabClient() {
  // Photo + corner state (reused from SiteModelLabClient)
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageNaturalW, setImageNaturalW] = useState(0);
  const [imageNaturalH, setImageNaturalH] = useState(0);
  const [displayW, setDisplayW] = useState(0);
  const [displayH, setDisplayH] = useState(0);
  const [corners, setCorners] = useState<Record<CornerKey, { x: number; y: number }>>({
    frontLeft: { x: 0.15, y: 0.80 }, frontRight: { x: 0.85, y: 0.80 },
    rearLeft: { x: 0.35, y: 0.35 }, rearRight: { x: 0.65, y: 0.35 },
  });
  const [dragging, setDragging] = useState<CornerKey | null>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  // Measurement state
  const [knownMetres, setKnownMetres] = useState('6');
  const [depthMetres, setDepthMetres] = useState('');
  const [which, setWhich] = useState<'rear' | 'front'>('rear');

  // Site model state
  const [compass, setCompass] = useState<FacingOption>('N');
  const [hemisphere, setHemisphere] = useState<'north' | 'south'>('north');
  const [boundaryH, setBoundaryH] = useState('1.8');

  // Planting inputs
  const [hardiness, setHardiness] = useState<RhsOption>('H5');
  const [styleTags, setStyleTags] = useState('cottage, wildlife');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');

  // Job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── File upload ────────────────────────────────────────────────────────────

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
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

  // ── Pin drag ───────────────────────────────────────────────────────────────

  function startDrag(key: CornerKey) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(key);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const el = imgContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setCorners(prev => ({ ...prev, [dragging]: { x, y } }));
  }

  function onPointerUp() { setDragging(null); }

  // ── Compute dimensions + sun grid ──────────────────────────────────────────

  const dimensionsResult = useMemo(() => {
    if (!imageNaturalW || !imageNaturalH) return null;
    const kn = parseFloat(knownMetres);
    if (isNaN(kn) || kn <= 0) return null;
    const dep = parseFloat(depthMetres);
    return recoverDimensions(
      corners as CornerPoints, imageNaturalW, imageNaturalH,
      kn, which, isNaN(dep) || dep <= 0 ? undefined : dep,
    );
  }, [corners, imageNaturalW, imageNaturalH, knownMetres, depthMetres, which]);

  const sunGrid = useMemo(() => {
    if (!dimensionsResult || dimensionsResult.confidence === 'depth_required') return undefined;
    const h = parseFloat(boundaryH) || 1.8;
    return buildSunGrid(
      dimensionsResult.widthMetres, dimensionsResult.depthMetres,
      compass, hemisphere,
      { rear: h, front: h, left: h, right: h },
    );
  }, [dimensionsResult, compass, hemisphere, boundaryH]);

  // ── Determine dominant light from the grid ─────────────────────────────────

  const dominantLight: SunLabel = useMemo(() => {
    if (!sunGrid) return 'full_sun';
    const counts: Record<SunLabel, number> = { full_sun: 0, part_shade: 0, shade: 0 };
    for (const row of sunGrid.grid) {
      for (const cell of row) counts[cell]++;
    }
    if (counts.shade > counts.part_shade && counts.shade > counts.full_sun) return 'shade';
    if (counts.part_shade > counts.full_sun) return 'part_shade';
    return 'full_sun';
  }, [sunGrid]);

  const canSubmit = dimensionsResult && dimensionsResult.confidence !== 'depth_required' && !submitting;

  // ── Polling ────────────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/plan/status?job_id=${id}`);
      if (!res.ok) return;
      const data: JobStatus = await res.json();
      setJobStatus(data);
      // Stop polling when all stages are terminal
      const terminal = (s: string) => s === 'complete' || s === 'failed';
      if (terminal(data.planting_status) && terminal(data.render_status) && terminal(data.pdf_status)) {
        stopPolling();
      }
    } catch { /* keep polling */ }
  }, [stopPolling]);

  useEffect(() => {
    if (!jobId) return;
    const terminal = (s?: string) => s === 'complete' || s === 'failed';
    if (jobStatus && terminal(jobStatus.planting_status) && terminal(jobStatus.render_status) && terminal(jobStatus.pdf_status)) return;
    stopPolling();
    pollRef.current = setInterval(() => pollStatus(jobId), 2000);
    return stopPolling;
  }, [jobId, jobStatus?.planting_status, jobStatus?.render_status, jobStatus?.pdf_status, pollStatus, stopPolling]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !dimensionsResult) return;
    setError(null);
    setJobStatus(null);
    setJobId(null);
    setSubmitting(true);

    const tags = styleTags.split(',').map(t => t.trim()).filter(Boolean);
    const h = parseFloat(boundaryH) || 1.8;

    try {
      // Shrink the photo to fit the request size limit, then send it as a data URL.
      let photoBase64: string | undefined;
      if (imageFile) {
        const small = await compressImage(imageFile, 3 * 1024 * 1024);
        photoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Could not read the photo'));
          reader.readAsDataURL(small);
        });
      }

      const res = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width_metres: dimensionsResult.widthMetres,
          depth_metres: dimensionsResult.depthMetres,
          dominant_light: dominantLight,
          rhs_hardiness: hardiness,
          style_tags: tags,
          camera_facing: compass,
          hemisphere,
          boundary_heights: { rear: h, front: h, left: h, right: h },
          location: location || undefined,
          recipient_email: email.trim() || undefined,
          photo_base64: photoBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create job');
        return;
      }
      setJobId(data.job_id);
      setJobStatus({ id: data.job_id, planting_status: 'queued', render_status: 'queued', pdf_status: 'queued' });
      await pollStatus(data.job_id);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived display ────────────────────────────────────────────────────────

  const placements: PlantPlacement[] = useMemo(() => {
    if (jobStatus?.planting_status === 'complete' && jobStatus.validated_suggestions && jobStatus.shopping_list) {
      return suggestionsToPlantPlacements(jobStatus.validated_suggestions, jobStatus.shopping_list);
    }
    return [];
  }, [jobStatus]);

  const statusLabel = (s: string) => ({
    queued: 'Queued...', running: 'Running...', complete: 'Complete', failed: 'Failed',
  }[s] ?? s);

  // ── Render ─────────────────────────────────────────────────────────────────

  const C = { stone: '#F8F9F8', emerald: '#064e3b', gold: '#D4AF37', ink: '#1a2e22', rule: '#e2e8e4' };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'Georgia, serif', color: C.ink }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: C.emerald }}>Garden Plan</h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Upload a photo of your garden, mark the corners, enter your details, and generate a planting plan.
      </p>

      {/* Step 1: Photo upload */}
      {!imageUrl && (
        <div
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => document.getElementById('plan-file-input')?.click()}
          style={{
            border: `2px dashed ${C.gold}`, borderRadius: 8, padding: '48px 24px',
            textAlign: 'center', cursor: 'pointer', background: '#fafaf8',
          }}
        >
          <p style={{ color: C.emerald, fontWeight: 600 }}>Drop a garden photo here, or click to browse</p>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>JPEG, PNG or WebP</p>
          <input id="plan-file-input" type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}

      {/* Step 2: Corner pins + inputs */}
      {imageUrl && !jobId && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
            {/* Left: photo + pins */}
            <div>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                Drag the coloured pins to the four garden corners.
                <br /><strong style={{ color: C.emerald }}>Red/Orange = front. Blue/Purple = rear.</strong>
              </p>
              <div ref={imgContainerRef}
                style={{ position: 'relative', userSelect: 'none', touchAction: 'none', borderRadius: 6, overflow: 'hidden' }}
                onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Garden photo" style={{ display: 'block', width: '100%', height: 'auto' }}
                  onLoad={e => {
                    const img = e.currentTarget;
                    setImageNaturalW(img.naturalWidth); setImageNaturalH(img.naturalHeight);
                    setDisplayW(img.clientWidth); setDisplayH(img.clientHeight);
                  }} />
                {(Object.keys(corners) as CornerKey[]).map(key => (
                  <div key={key} onPointerDown={startDrag(key)}
                    style={{
                      position: 'absolute', left: `${corners[key].x * 100}%`, top: `${corners[key].y * 100}%`,
                      transform: 'translate(-50%, -50%)', width: 28, height: 28, borderRadius: '50%',
                      background: CORNER_COLOURS[key], border: '2px solid white',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)', cursor: 'grab',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: 'white', touchAction: 'none',
                    }}>
                    {CORNER_LABELS[key]}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => { setImageUrl(null); setImageFile(null); }}
                style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                Change photo
              </button>
            </div>

            {/* Right: controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Known measurement */}
              <div>
                <label style={labelStyle}>Known measurement (metres)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" min={0.5} max={100} step={0.1} value={knownMetres}
                    onChange={e => setKnownMetres(e.target.value)} style={{ ...inputStyle, width: 80 }} />
                  <select value={which} onChange={e => setWhich(e.target.value as 'rear' | 'front')}
                    style={{ ...inputStyle, width: 'auto' }}>
                    <option value="rear">Rear width</option>
                    <option value="front">Front width</option>
                  </select>
                </div>
              </div>

              {/* Optional depth */}
              {dimensionsResult?.confidence === 'depth_required' && (
                <div>
                  <label style={{ ...labelStyle, color: '#dc2626' }}>Depth (metres) -- required for this photo</label>
                  <input type="number" min={0.5} max={100} step={0.1} value={depthMetres}
                    onChange={e => setDepthMetres(e.target.value)} style={{ ...inputStyle, width: 120 }} required />
                </div>
              )}
              {dimensionsResult?.confidence !== 'depth_required' && (
                <div>
                  <label style={labelStyle}>Depth (metres) -- optional, estimated if blank</label>
                  <input type="number" min={0.5} max={100} step={0.1} value={depthMetres} placeholder="auto-estimate"
                    onChange={e => setDepthMetres(e.target.value)} style={{ ...inputStyle, width: 120 }} />
                </div>
              )}

              {/* Camera facing */}
              <div>
                <label style={labelStyle}>Camera faces (toward rear boundary)</label>
                <select value={compass} onChange={e => setCompass(e.target.value as FacingOption)} style={inputStyle}>
                  {(['N','NE','E','SE','S','SW','W','NW'] as FacingOption[]).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Hemisphere */}
              <div>
                <label style={labelStyle}>Hemisphere</label>
                <select value={hemisphere} onChange={e => setHemisphere(e.target.value as 'north' | 'south')} style={inputStyle}>
                  <option value="north">Northern (UK, Ireland, US)</option>
                  <option value="south">Southern (Australia, NZ)</option>
                </select>
              </div>

              {/* Boundary height */}
              <div>
                <label style={labelStyle}>Boundary height (metres, all sides)</label>
                <input type="number" min={0} max={10} step={0.1} value={boundaryH}
                  onChange={e => setBoundaryH(e.target.value)} style={{ ...inputStyle, width: 80 }} />
              </div>

              {/* Email */}

              <div>

                <label style={labelStyle}>Email for your plan (optional)</label>

                <input type="email" value={email} onChange={e => setEmail(e.target.value)}

                  placeholder="you@example.com" style={inputStyle} />

              </div>

              {/* Location */}
              <div>
                <label style={labelStyle}>Location (optional)</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Dublin, Ireland" style={inputStyle} maxLength={200} />
              </div>

              {/* Hardiness */}
              <div>
                <label style={labelStyle}>Hardiness rating</label>
                <select value={hardiness} onChange={e => setHardiness(e.target.value as RhsOption)} style={inputStyle}>
                  {(['H1a','H1b','H1c','H2','H3','H4','H5','H6','H7'] as RhsOption[]).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Not sure? Look up your RHS hardiness rating or USDA zone online.
                </div>
              </div>

              {/* Style tags */}
              <div>
                <label style={labelStyle}>Style tags (comma-separated)</label>
                <input type="text" value={styleTags} onChange={e => setStyleTags(e.target.value)}
                  placeholder="cottage, wildlife, formal" style={inputStyle} />
              </div>

              {/* Dimensions result */}
              {dimensionsResult && (
                <div style={{
                  background: dimensionsResult.confidence === 'depth_required' ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${dimensionsResult.confidence === 'depth_required' ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: 6, padding: 12, fontSize: 12,
                }}>
                  {dimensionsResult.confidence !== 'depth_required' ? (
                    <div>
                      <div style={{ fontWeight: 700, color: C.emerald, marginBottom: 4 }}>
                        Dimensions ({dimensionsResult.confidence})
                      </div>
                      <div>{dimensionsResult.widthMetres.toFixed(1)}m x {dimensionsResult.depthMetres.toFixed(1)}m ({dimensionsResult.areaMetres.toFixed(1)} m2)</div>
                    </div>
                  ) : (
                    <div style={{ color: '#dc2626', fontWeight: 600 }}>Please enter depth above</div>
                  )}
                </div>
              )}

              <button type="submit" disabled={!canSubmit} style={buttonStyle}>
                {submitting ? 'Submitting...' : 'Generate plan'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Error */}
      {error && <p style={{ color: '#dc2626', marginTop: '1rem' }}>{error}</p>}

      {/* Status banner */}
      {jobStatus && jobStatus.planting_status !== 'complete' && jobStatus.planting_status !== 'failed' && (
        <div style={{ padding: '0.75rem 1rem', background: '#f1f5f9', borderRadius: 6, marginTop: '1rem', fontSize: '0.9rem' }}>
          Planting: {statusLabel(jobStatus.planting_status)}
        </div>
      )}
      {jobStatus?.planting_status === 'failed' && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: 6, marginTop: '1rem', fontSize: '0.9rem', color: '#dc2626' }}>
          Planting failed{jobStatus.planting_error ? `: ${jobStatus.planting_error}` : ''}
        </div>
      )}

      {/* Results: plan + shopping list (shown as soon as planting is complete) */}
      {jobStatus?.planting_status === 'complete' && placements.length > 0 && dimensionsResult && dimensionsResult.confidence !== 'depth_required' && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: C.emerald }}>Plan</h2>
          <PlanSvg
            widthMetres={dimensionsResult.widthMetres}
            depthMetres={dimensionsResult.depthMetres}
            sunGrid={sunGrid?.grid}
            cellSizeMetres={sunGrid?.cellSizeMetres ?? 0.5}
            plants={placements}
            cameraFacing={compass}
            svgWidth={700}
          />

          {jobStatus.shopping_list && jobStatus.shopping_list.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: C.emerald }}>Shopping list</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.emerald}` }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Plant</th>
                    <th style={thStyle}>Botanical name</th>
                    <th style={thStyle}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {jobStatus.shopping_list.map((item, i) => (
                    <tr key={item.plant_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdStyle}>{item.common_name}</td>
                      <td style={{ ...tdStyle, fontStyle: 'italic' }}>{item.botanical_name}</td>
                      <td style={tdStyle}>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Garden render */}
          {jobStatus.render_status === 'complete' && jobStatus.render_url ? (
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: C.emerald }}>Mature garden preview</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={jobStatus.render_url} alt="Mature garden render" style={{ maxWidth: '100%', borderRadius: 8 }} />
            </div>
          ) : jobStatus.render_status === 'failed' ? (
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              Garden render could not be generated{jobStatus.render_error ? ` (${jobStatus.render_error})` : ''}.
            </p>
          ) : jobStatus.render_status !== 'complete' ? (
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
              Generating mature garden preview...
            </p>
          ) : null}

          {/* PDF download */}
          {jobStatus.pdf_status === 'complete' && jobStatus.pdf_url ? (
            <div style={{ marginTop: '1.5rem' }}>
              <a href={jobStatus.pdf_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-block', padding: '0.6rem 1.25rem',
                  background: C.emerald, color: '#fff', textDecoration: 'none',
                  borderRadius: 4, fontFamily: 'Georgia, serif', fontSize: '0.9rem', fontWeight: 600,
                }}>
                Download PDF
              </a>
            </div>
          ) : jobStatus.pdf_status === 'failed' ? (
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              PDF could not be generated.
            </p>
          ) : (
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
              PDF generating in background...
            </p>
          )}
        </div>
      )}
    </main>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600,
  color: '#064e3b', marginBottom: '0.25rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.4rem 0.5rem', border: '1px solid #cbd5e1',
  borderRadius: 4, fontFamily: 'Georgia, serif', fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.6rem 1.25rem', background: '#064e3b', color: '#fff',
  border: 'none', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'Georgia, serif', fontSize: '0.9rem', fontWeight: 600,
  marginTop: 8,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '0.4rem 0.5rem', color: '#064e3b', fontWeight: 700,
};

const tdStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem', color: '#1a2e22',
};
