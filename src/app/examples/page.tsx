import Image from 'next/image';
import { EXAMPLES } from '../../data/examples';
import ExamplesCTA from '@/components/ExamplesCTA';

export const metadata = {
  title: 'Example Garden Plans — Dedrab',
  description: 'See seven real garden transformations with before photos, redesigned renders and the design style behind each one.',
};

export default function ExamplesPage() {
  return (
    <main style={{ background: '#F4EFE4', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center' }}>
        <div style={{
          fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' as const,
          color: '#b8962e', marginBottom: 12, fontWeight: 600,
        }}>
          Example Plans
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 700, color: '#0a3d2b', marginBottom: 16, lineHeight: 1.2,
        }}>
          From Drab to Delight
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6 text-center text-lg">
          This isn&apos;t just a pretty picture. Every Dedrab Garden Plan is a
          complete, personalised garden design document — ready to take
          outside and use.
        </p>
        <ul className="text-left max-w-md mx-auto mb-12 space-y-3">
          {[
            'A photorealistic render of your redesigned garden',
            'A full planting specification with care ratings for every plant',
            'A phased garden plan broken into manageable weekends',
            'A materials and hardscape guide with cost estimates',
            'A shopping list to take straight to the garden centre',
            'Yours within minutes of uploading your photo',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-700">
              <span className="text-[#b8962e] font-bold mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 32,
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px 80px',
      }}>
        {EXAMPLES.map((ex) => (
          <div
            key={ex.slug}
            style={{
              background: '#ffffff',
              border: '1px solid #e8e0d0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {/* Before / After images side by side */}
            <div style={{ display: 'flex', height: 160 }}>
              {/* Before */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <Image
                  src={ex.before}
                  alt={`${ex.style} — before`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 50vw, 200px"
                />
                <span style={{
                  position: 'absolute', top: 8, left: 8,
                  fontSize: 10, fontWeight: 600, letterSpacing: 1,
                  background: 'rgba(0,0,0,0.5)', color: '#ffffff',
                  padding: '2px 8px',
                }}>
                  Before
                </span>
              </div>
              {/* After */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <Image
                  src={ex.after}
                  alt={`${ex.style} — after`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 50vw, 200px"
                />
                <span style={{
                  position: 'absolute', top: 8, left: 8,
                  fontSize: 10, fontWeight: 600, letterSpacing: 1,
                  background: 'rgba(0,0,0,0.5)', color: '#ffffff',
                  padding: '2px 8px',
                }}>
                  After
                </span>
              </div>
            </div>

            {/* Card content */}
            <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: 15, fontWeight: 600, color: '#0a3d2b', marginBottom: 6,
              }}>
                {ex.style}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                {ex.description}
              </div>
              {ex.samplePdfUrl ? (
                <a
                  href={ex.samplePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#0a3d2b] border border-[#0a3d2b] px-4 py-2 rounded-lg hover:bg-[#0a3d2b] hover:text-white transition-colors mt-3 self-start"
                >
                  View sample Garden Plan →
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{
        textAlign: 'center', padding: '64px 24px 80px',
        borderTop: '1px solid #e8e0d0', background: '#EDE6D3',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 28,
          fontWeight: 700, color: '#0a3d2b', marginBottom: 12,
        }}>
          Begin the process today
        </h2>
        <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 28 }}>
          Upload a photo of your garden and receive your personalised
          Garden Plan in minutes. Delight in your garden sooner rather than later.
        </p>
        <ExamplesCTA />
      </div>
    </main>
  );
}
