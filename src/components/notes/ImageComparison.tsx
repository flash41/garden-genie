'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ImageComparisonProps {
  before: string;
  after: string;
  alt: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ImageComparison({
  before,
  after,
  alt,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: ImageComparisonProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="not-prose my-8 select-none">
      <div
        ref={containerRef}
        className="relative aspect-[16/9] overflow-hidden rounded-sm cursor-col-resize bg-stone-100"
        onMouseDown={() => {
          isDragging.current = true;
        }}
        onMouseMove={(e) => {
          if (!isDragging.current) return;
          updatePosition(e.clientX);
        }}
        onTouchMove={(e) => updatePosition(e.touches[0].clientX)}
        role="img"
        aria-label={`Before and after comparison: ${alt}`}
      >
        {/* After (base layer) */}
        <Image
          src={after}
          alt={`After: ${alt}`}
          fill
          className="object-cover"
          sizes="100vw"
        />
        {/* Before (clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            width: `${position}%`,
            transition: prefersReducedMotion ? 'none' : undefined,
          }}
        >
          <Image
            src={before}
            alt={`Before: ${alt}`}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Divider */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white shadow-lg pointer-events-none"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <button
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#b8962e] rounded-full shadow-lg flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8962e] focus-visible:ring-offset-2 pointer-events-auto"
            aria-label="Drag to compare before and after. Use arrow keys to adjust."
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 5));
              if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 5));
            }}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l-3 3 3 3M16 9l3 3-3 3"
              />
            </svg>
          </button>
        </div>

        {/* Labels */}
        <span className="absolute top-3 left-3 text-xs font-semibold text-white bg-black/50 px-2 py-1 rounded-sm pointer-events-none">
          {beforeLabel}
        </span>
        <span className="absolute top-3 right-3 text-xs font-semibold text-white bg-black/50 px-2 py-1 rounded-sm pointer-events-none">
          {afterLabel}
        </span>
      </div>
    </div>
  );
}
