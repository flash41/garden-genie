'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { EXAMPLES } from '@/data/examples';

/* ── Deliverable definitions ─────────────────────────────────── */
const DELIVERABLES = [
  { key: 'plant-list',    label: 'PLANT LIST',  src: '/hero-deliverables/plant-list-preview.png',    alt: 'Sample plant schedule from a Dedrab garden plan' },
  { key: 'layout-plan',   label: 'LAYOUT PLAN', src: '/hero-deliverables/layout-plan-preview.png',   alt: 'Sample garden layout plan' },
  { key: 'cost-estimate', label: 'COST EST.',   src: '/hero-deliverables/cost-estimate-preview.png', alt: 'Sample cost estimate' },
  { key: 'materials',     label: 'MATERIALS',   src: '/hero-deliverables/materials-preview.png',     alt: 'Sample materials schedule' },
] as const;

/* ── Timing constants ────────────────────────────────────────── */
const TOP_SLIDE_MS   = 7500;
const TOP_WIPE_START = 1500;
const TOP_WIPE_DUR   = 700;
const TOP_FADE_DUR   = 300;

const TOUCH_PAUSE_MS = 8000;

const TOP_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 900px) 90vw, 520px';
const GRID_IMAGE_SIZES = '(max-width: 640px) 45vw, 250px';

/* ── Component ───────────────────────────────────────────────── */
export default function HeroExamplesReveal() {
  /* --- reduced-motion preference --- */
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* --- pause state --- */
  const pausedRef = useRef(false);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pause = useCallback(() => { pausedRef.current = true; }, []);
  const resume = useCallback(() => { pausedRef.current = false; }, []);
  const touchPause = useCallback(() => {
    pausedRef.current = true;
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => { pausedRef.current = false; }, TOUCH_PAUSE_MS);
  }, []);

  /* --- top-panel state --- */
  const [topIdx, setTopIdx] = useState(0);
  const [topPhase, setTopPhase] = useState<'before' | 'wiping' | 'after' | 'fading'>('before');
  const [topOpacity, setTopOpacity] = useState(1);

  /* --- preload next slide's images --- */
  useEffect(() => {
    if (reducedMotion) return;
    const nextIdx = (topIdx + 1) % EXAMPLES.length;
    const next = EXAMPLES[nextIdx];
    const a = new window.Image(); a.src = next.before;
    const b = new window.Image(); b.src = next.after;
  }, [topIdx, reducedMotion]);

  /* --- top-panel rotation --- */
  useEffect(() => {
    if (reducedMotion) return;

    let phaseTimer: ReturnType<typeof setTimeout>;
    let elapsed = 0;
    let lastTick = Date.now();
    let phase: 'before' | 'wiping' | 'after' | 'fading' = 'before';

    setTopPhase('before');
    setTopOpacity(1);

    const tick = () => {
      const now = Date.now();
      if (!pausedRef.current) elapsed += now - lastTick;
      lastTick = now;

      if (phase === 'before' && elapsed >= TOP_WIPE_START) {
        phase = 'wiping';
        setTopPhase('wiping');
      }
      if (phase === 'wiping' && elapsed >= TOP_WIPE_START + TOP_WIPE_DUR) {
        phase = 'after';
        setTopPhase('after');
      }
      if (phase === 'after' && elapsed >= TOP_SLIDE_MS - TOP_FADE_DUR) {
        phase = 'fading';
        setTopPhase('fading');
        setTopOpacity(0);
      }
      if (elapsed >= TOP_SLIDE_MS) {
        setTopIdx(prev => (prev + 1) % EXAMPLES.length);
        elapsed = 0;
        phase = 'before';
        setTopPhase('before');
        setTopOpacity(1);
      }

      phaseTimer = setTimeout(tick, 50);
    };

    phaseTimer = setTimeout(tick, 50);
    return () => clearTimeout(phaseTimer);
  }, [reducedMotion]);

  /* --- derived values --- */
  const example = EXAMPLES[topIdx];
  const showWipe = topPhase === 'wiping' || topPhase === 'after' || topPhase === 'fading';

  return (
    <div
      role="region"
      aria-label="Garden design preview, rotating examples and deliverables"
      onMouseEnter={reducedMotion ? undefined : pause}
      onMouseLeave={reducedMotion ? undefined : resume}
      onTouchStart={reducedMotion ? undefined : touchPause}
      style={{
        width: 520,
        maxWidth: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(184,150,46,0.3)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}
    >
      {/* ── TOP PANEL: before→after ────────────────────────── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 2',
          overflow: 'hidden',
          opacity: topOpacity,
          transition: `opacity ${TOP_FADE_DUR}ms ease`,
        }}
      >
        <Image
          src={example.before}
          alt={`${example.style} garden, before`}
          fill
          sizes={TOP_IMAGE_SIZES}
          style={{ objectFit: 'cover' }}
          priority
        />
        <Image
          src={example.after}
          alt={`${example.style} garden, after`}
          fill
          sizes={TOP_IMAGE_SIZES}
          style={{
            objectFit: 'cover',
            clipPath: showWipe ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)',
            transition: topPhase === 'wiping'
              ? `clip-path ${TOP_WIPE_DUR}ms cubic-bezier(0.65, 0, 0.35, 1)`
              : 'none',
          }}
        />
      </div>

      {/* ── CAPTION ────────────────────────────────────────── */}
      <div
        aria-live="polite"
        style={{
          padding: '16px 20px 12px',
          opacity: topOpacity,
          transition: `opacity ${TOP_FADE_DUR}ms ease`,
        }}
        className="hero-reveal-caption"
      >
        <div style={{
          fontSize: 9,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: 4,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {example.style}
        </div>
        <div style={{
          fontSize: 13,
          lineHeight: 1.4,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          {example.description}
        </div>
      </div>

      {/* ── DELIVERABLES GRID (2×2, static) ────────────────── */}
      <div
        role="list"
        aria-label="What you receive in your Garden Plan"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          padding: '0 12px 14px 12px',
        }}
        className="hero-reveal-grid"
      >
        {DELIVERABLES.map((d) => (
          <div
            key={d.key}
            role="listitem"
            style={{
              position: 'relative',
              aspectRatio: '16 / 9',
              overflow: 'hidden',
              borderRadius: 2,
            }}
            className="hero-reveal-cell"
          >
            <Image
              src={d.src}
              alt={d.alt}
              fill
              sizes={GRID_IMAGE_SIZES}
              style={{
                objectFit: 'cover',
                transition: 'transform 300ms ease',
              }}
              className="hero-reveal-cell-img"
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(10,61,43,0.85)',
              borderTop: '1px solid rgba(184,150,46,0.3)',
              padding: '5px 9px',
              transition: 'border-color 300ms ease',
            }}
              className="hero-reveal-cell-label"
            >
              <span style={{
                fontSize: 9,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: 'var(--gold-light)',
              }}>
                {d.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .hero-reveal-cell:hover .hero-reveal-cell-img {
          transform: scale(1.03);
        }
        .hero-reveal-cell:hover .hero-reveal-cell-label {
          border-top-color: rgba(184,150,46,0.6);
        }
        @media (max-width: 640px) {
          .hero-reveal-caption {
            padding: 14px 16px 10px !important;
          }
          .hero-reveal-grid {
            gap: 6px !important;
            padding: 0 10px 12px 10px !important;
          }
          .hero-reveal-cell-label span {
            font-size: 8.5px !important;
            letter-spacing: 1px !important;
          }
        }
      `}</style>
    </div>
  );
}
