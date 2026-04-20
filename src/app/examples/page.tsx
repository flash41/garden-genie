import Image from 'next/image';
import Link from 'next/link';
import { EXAMPLES } from '../../data/examples';

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
          See what&apos;s possible
        </h1>
        <p style={{
          fontSize: 16, color: '#6b7280', lineHeight: 1.75,
          maxWidth: 680, margin: '0 auto 64px',
        }}>
          Every garden is different. Here are seven real transformations — each one showing a before photo,
          the redesigned render, and the design style behind it. Your Action Plan goes even further, with a
          full planting specification, materials list, phased plan and shopping list.
        </p>
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
            <div style={{ padding: '16px 20px 20px' }}>
              <div style={{
                fontSize: 15, fontWeight: 600, color: '#0a3d2b', marginBottom: 6,
              }}>
                {ex.style}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                {ex.description}
              </div>
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
          Ready to see your garden?
        </h2>
        <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 28 }}>
          Upload a photo and get your personalised Action Plan in minutes.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: '#0a3d2b',
            color: '#ffffff',
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#0d5238')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#0a3d2b')}
        >
          Design my garden
        </Link>
      </div>
    </main>
  );
}
