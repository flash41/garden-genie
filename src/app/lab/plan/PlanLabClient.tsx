'use client';

/**
 * PlanLabClient — interactive planting-plan generator.
 *
 * Form inputs:
 *   - Width and depth in metres
 *   - Dominant light
 *   - RHS hardiness
 *   - Style tags (comma-separated)
 *   - Camera facing
 *
 * Workflow:
 *   1. Submit → POST /api/plan/create → get job_id
 *   2. Poll   → GET  /api/plan/status?job_id=... every 2 s
 *   3. When status === 'done': render PlanSvg + shopping list table
 *   4. When status === 'failed': show error message
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PlanSvg } from '@/components/plan/PlanSvg';
import type { PlantPlacement } from '@/components/plan/planTypes';
import type { ShoppingItem, PlantingSuggestion } from '@/lib/planting/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type LightOption = 'full_sun' | 'part_shade' | 'shade';
type RhsOption = 'H1a' | 'H1b' | 'H1c' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7';
type FacingOption = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

interface JobStatus {
  id: string;
  status: string;
  error_message?: string;
  validated_suggestions?: PlantingSuggestion[];
  shopping_list?: ShoppingItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function suggestionsToPlantPlacements(
  suggestions: PlantingSuggestion[],
  shoppingList: ShoppingItem[],
): PlantPlacement[] {
  const nameMap = new Map(shoppingList.map(s => [s.plant_id, { common: s.common_name }]));
  const counter = new Map<string, number>();

  // Assign sequential numbers per unique plant
  const numberMap = new Map<string, number>();
  let nextNum = 1;
  for (const s of suggestions) {
    if (!numberMap.has(s.plant_id)) {
      numberMap.set(s.plant_id, nextNum++);
    }
  }

  return suggestions.map(s => {
    const qty = counter.get(s.plant_id) ?? 0;
    counter.set(s.plant_id, qty + 1);
    return {
      number: numberMap.get(s.plant_id) ?? 1,
      name: nameMap.get(s.plant_id)?.common ?? s.plant_id,
      quantity: s.quantity,
      xMetres: s.x_metres,
      yMetres: s.y_metres,
      spreadMetres: 0.5,
      light: 'full_sun',
    };
  });
}

const PRICE_LABELS: Record<ShoppingItem['price_bracket'], string> = {
  under_5: 'Under 5',
  '5_to_10': '5-10',
  '10_to_20': '10-20',
  over_20: 'Over 20',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlanLabClient() {
  // Form state
  const [width, setWidth]       = useState('6');
  const [depth, setDepth]       = useState('10');
  const [light, setLight]       = useState<LightOption>('full_sun');
  const [hardiness, setHardiness] = useState<RhsOption>('H5');
  const [styleTags, setStyleTags] = useState('cottage, wildlife');
  const [facing, setFacing]     = useState<FacingOption>('N');

  // Job state
  const [jobId, setJobId]         = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Polling ──────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/plan/status?job_id=${id}`);
      if (!res.ok) return;
      const data: JobStatus = await res.json();
      setJobStatus(data);
      if (data.status === 'done' || data.status === 'failed') {
        stopPolling();
      }
    } catch {
      // Ignore transient fetch errors — keep polling
    }
  }, [stopPolling]);

  useEffect(() => {
    if (jobId && jobStatus?.status !== 'done' && jobStatus?.status !== 'failed') {
      stopPolling();
      pollRef.current = setInterval(() => pollStatus(jobId), 2000);
    }
    return stopPolling;
  }, [jobId, jobStatus?.status, pollStatus, stopPolling]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setJobStatus(null);
    setJobId(null);
    setSubmitting(true);

    const tags = styleTags.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width_metres: parseFloat(width),
          depth_metres: parseFloat(depth),
          dominant_light: light,
          rhs_hardiness: hardiness,
          style_tags: tags,
          camera_facing: facing,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create job');
        return;
      }
      setJobId(data.job_id);
      // Start with queued status so the UI shows immediately
      setJobStatus({ id: data.job_id, status: 'queued' });
      // Trigger first poll immediately
      await pollStatus(data.job_id);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived display data ─────────────────────────────────────────────────
  const placements: PlantPlacement[] = (() => {
    if (
      jobStatus?.status === 'done' &&
      jobStatus.validated_suggestions &&
      jobStatus.shopping_list
    ) {
      return suggestionsToPlantPlacements(
        jobStatus.validated_suggestions,
        jobStatus.shopping_list,
      );
    }
    return [];
  })();

  const statusLabel: Record<string, string> = {
    queued: 'Queued...',
    generating: 'Generating layout...',
    validating: 'Checking suggestions...',
    repairing: 'Fixing any issues...',
    done: 'Done',
    failed: 'Failed',
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'Georgia, serif' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Planting Plan Lab</h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Lab tool. Generates a planting plan via Gemini. Requires a valid invite cookie and GOOGLE_API_KEY.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: 480, marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <label>
            <span style={labelStyle}>Width (m)</span>
            <input style={inputStyle} type="number" min={1} max={100} step={0.5} value={width}
              onChange={e => setWidth(e.target.value)} required />
          </label>
          <label>
            <span style={labelStyle}>Depth (m)</span>
            <input style={inputStyle} type="number" min={1} max={100} step={0.5} value={depth}
              onChange={e => setDepth(e.target.value)} required />
          </label>
        </div>

        <label>
          <span style={labelStyle}>Dominant light</span>
          <select style={inputStyle} value={light} onChange={e => setLight(e.target.value as LightOption)}>
            <option value="full_sun">Full sun</option>
            <option value="part_shade">Part shade</option>
            <option value="shade">Shade</option>
          </select>
        </label>

        <label>
          <span style={labelStyle}>RHS hardiness</span>
          <select style={inputStyle} value={hardiness} onChange={e => setHardiness(e.target.value as RhsOption)}>
            {(['H1a','H1b','H1c','H2','H3','H4','H5','H6','H7'] as RhsOption[]).map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>

        <label>
          <span style={labelStyle}>Style tags (comma-separated)</span>
          <input style={inputStyle} type="text" value={styleTags}
            onChange={e => setStyleTags(e.target.value)}
            placeholder="cottage, wildlife, formal" />
        </label>

        <label>
          <span style={labelStyle}>Camera facing</span>
          <select style={inputStyle} value={facing} onChange={e => setFacing(e.target.value as FacingOption)}>
            {(['N','NE','E','SE','S','SW','W','NW'] as FacingOption[]).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? 'Submitting...' : 'Generate plan'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
      )}

      {/* Status banner */}
      {jobStatus && jobStatus.status !== 'done' && (
        <div style={{ padding: '0.75rem 1rem', background: '#f1f5f9', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem' }}>
          {statusLabel[jobStatus.status] ?? jobStatus.status}
          {jobStatus.status === 'failed' && jobStatus.error_message && (
            <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>{jobStatus.error_message}</span>
          )}
        </div>
      )}

      {/* Results */}
      {jobStatus?.status === 'done' && placements.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Plan</h2>
          <PlanSvg
            widthMetres={parseFloat(width)}
            depthMetres={parseFloat(depth)}
            plants={placements}
            cameraFacing={facing}
            svgWidth={700}
          />

          {jobStatus.shopping_list && jobStatus.shopping_list.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Shopping list</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #064e3b' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Plant</th>
                    <th style={thStyle}>Botanical name</th>
                    <th style={thStyle}>Qty</th>
                    <th style={thStyle}>Price bracket (GBP)</th>
                  </tr>
                </thead>
                <tbody>
                  {jobStatus.shopping_list.map((item, i) => (
                    <tr key={item.plant_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdStyle}>{item.common_name}</td>
                      <td style={{ ...tdStyle, fontStyle: 'italic' }}>{item.botanical_name}</td>
                      <td style={tdStyle}>{item.quantity}</td>
                      <td style={tdStyle}>{PRICE_LABELS[item.price_bracket]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: '#374151', marginBottom: '0.25rem',
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
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '0.4rem 0.5rem',
  color: '#064e3b', fontWeight: 700,
};

const tdStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem', color: '#1a2e22',
};
