'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { EXAMPLES } from '../data/examples';

const CARD_WIDTH = 320; // md:w-80 in px
const GAP = 16;        // gap-4 in px

export default function ExamplesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showBefore, setShowBefore] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = (i: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: i * (CARD_WIDTH + GAP), behavior: 'smooth' });
    }
    setActiveIndex(i);
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const idx = Math.round(scrollRef.current.scrollLeft / (CARD_WIDTH + GAP));
      setActiveIndex(Math.max(0, Math.min(idx, EXAMPLES.length - 1)));
    }
  };

  const toggleBefore = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBefore(prev => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div className="w-full overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 px-4 snap-x snap-mandatory scrollbar-hide"
      >
        {EXAMPLES.map((ex, i) => (
          <div
            key={ex.slug}
            className="snap-start shrink-0 w-72 md:w-80 cursor-pointer"
            onClick={() => setActiveIndex(i)}
          >
            {/* Image container */}
            <div className="relative h-48 overflow-hidden rounded-lg">
              {/* After image — shown by default */}
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{ opacity: showBefore[i] ? 0 : 1 }}
              >
                <Image
                  src={ex.after}
                  alt={`${ex.style} — after`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="320px"
                />
              </div>
              {/* Before image */}
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{ opacity: showBefore[i] ? 1 : 0 }}
              >
                <Image
                  src={ex.before}
                  alt={`${ex.style} — before`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="320px"
                />
              </div>
              {/* Toggle pill */}
              <button
                onClick={(e) => toggleBefore(i, e)}
                className="absolute bottom-2 right-2 text-xs px-2 py-1 text-white rounded-full"
                style={{ background: 'rgba(10,61,43,0.85)' }}
              >
                {showBefore[i] ? 'Show after' : 'Show before'}
              </button>
            </div>

            {/* Card footer */}
            <div className="p-3 bg-white/90 backdrop-blur">
              <div className="text-sm font-semibold text-[#0a3d2b]">{ex.style}</div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{ex.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {EXAMPLES.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            aria-label={`Go to ${EXAMPLES[i].style}`}
            className="transition-all duration-300 rounded-full"
            style={{
              width:           activeIndex === i ? 24 : 8,
              height:          8,
              background:      activeIndex === i ? '#0a3d2b' : '#b8962e',
              opacity:         activeIndex === i ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}
