'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const exampleGardens = [
  { slug: 'japanese-zen',         badge: 'Japanese Zen',           title: 'The Tranquil Courtyard',    descriptor: 'Calm. Considered. Timeless.',    image: '/examples/japanese-zen.jpg' },
  { slug: 'english-cottage',      badge: 'English Cottage',        title: 'The Heritage Walled Garden', descriptor: 'Abundant. Romantic. Structured.', image: '/examples/english-cottage.jpg' },
  { slug: 'city-garden',          badge: 'City Garden',            title: 'The Urban Retreat',          descriptor: 'Smart. Compact. Considered.',     image: '/examples/city-garden.jpg' },
  { slug: 'mediterranean',        badge: 'Mediterranean',          title: 'The Sun-Drenched Terrace',   descriptor: 'Warm. Fragrant. Effortless.',     image: '/examples/mediterranean.jpg' },
  { slug: 'modern-minimalist',    badge: 'Modern Minimalist',      title: 'The Clean Slate Garden',     descriptor: 'Precise. Calm. Architectural.',   image: '/examples/modern-minimalist.jpg' },
  { slug: 'wildlife-garden',      badge: 'Wildlife & Pollinator',  title: 'The Living Garden',          descriptor: 'Wild. Purposeful. Alive.',        image: '/examples/wildlife-pollinator-garden.jpg' },
  { slug: 'kitchen-garden',       badge: 'Kitchen & Herb Garden',  title: 'The Productive Garden',      descriptor: 'Useful. Beautiful. Rewarding.',   image: '/examples/kitchen-herb-garden.jpg' },
  { slug: 'tropical-lush',        badge: 'Tropical & Lush',        title: 'The Jungle Escape',          descriptor: 'Bold. Layered. Immersive.',       image: '/examples/tropical-lush.jpg' },

  { slug: 'urban-party-garden',   badge: 'Urban Party Garden',     title: 'The Social Garden',          descriptor: 'Lush. Lit. Made for people.',     image: '/examples/urban-party-garden.jpg' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeStyle, setActiveStyle] = useState('English Cottage');

  // Scroll-based nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Intersection observer for fade-in animations
  useEffect(() => {
    const els = document.querySelectorAll('.anim-fade');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const styles = [
    'English Cottage', 'Japanese Zen', 'Mediterranean', 'Contemporary Formal',
    'Wild & Naturalistic', 'Tropical Lush', 'French Formal', 'Scandinavian Minimal',
  ];

  return (
    <>
      <style>{`
        :root {
          --parchment: #F4EFE4;
          --linen: #EDE6D3;
          --forest: #0a3d2b;
          --forest-mid: #1a5c3f;
          --moss: #2D5016;
          --gold: #b8962e;
          --gold-light: #D4AF37;
          --gold-pale: #f0e4b8;
          --umber: #2C1A0E;
          --warm-grey: #8a7e6e;
          --cream-dark: #d9cdb8;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--parchment); color: var(--umber); overflow-x: hidden; }
        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 1000; opacity: 0.4;
        }

        @keyframes heroFadeIn { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .hero-content { animation: heroFadeIn 1.2s ease forwards; }
        .hero-preview-wrap { animation: heroFadeIn 1.2s 0.3s ease both; }

        @keyframes scrollBob {
          0%,100%{transform:translateX(-50%) translateY(0)}
          50%{transform:translateX(-50%) translateY(8px)}
        }
        .scroll-bob { animation: scrollBob 2s ease-in-out infinite; }

        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pulse-dot { animation: pulseDot 2s infinite; }

        @keyframes leafFloat {
          0%{transform:translateY(100vh) rotate(0deg);opacity:0}
          10%{opacity:0.4} 90%{opacity:0.4}
          100%{transform:translateY(-100px) rotate(720deg);opacity:0}
        }
        .leaf { position:absolute; pointer-events:none; animation: leafFloat linear infinite; }
        .leaf-1 { left:15%; animation-duration:18s; animation-delay:0s; }
        .leaf-2 { left:38%; animation-duration:22s; animation-delay:5s; }
        .leaf-3 { left:72%; animation-duration:16s; animation-delay:10s; }

        .anim-fade { opacity:0; transform:translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .anim-fade.delay-1 { transition-delay:0.15s; }
        .anim-fade.delay-2 { transition-delay:0.30s; }
        .anim-fade.delay-3 { transition-delay:0.10s; }
        .anim-fade.delay-4 { transition-delay:0.20s; }
        .anim-fade.delay-5 { transition-delay:0.30s; }
        .anim-fade.delay-6 { transition-delay:0.40s; }
        .anim-fade.visible { opacity:1; transform:translateY(0); }

        .btn-primary {
          background: var(--gold); color: var(--forest);
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 2.5px; text-transform: uppercase;
          padding: 18px 40px; border: none; cursor: pointer;
          transition: all 0.3s ease; text-decoration: none; display: inline-block;
        }
        .btn-primary:hover { background: var(--gold-light); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(184,150,46,0.3); }

        .feature-card::before { content:''; position:absolute; top:0; left:0; width:3px; height:0; background:var(--gold); transition: height 0.4s ease; }
        .feature-card:hover::before { height:100%; }
        .feature-card:hover { background: var(--parchment) !important; }

        .example-card .view-btn { opacity:0; transform:translateY(10px); transition:all 0.3s ease; }
        .example-card:hover .view-btn { opacity:1; transform:translateY(0); }
        .example-card .example-img { transition: transform 0.6s ease; }
        .example-card:hover .example-img { transform: scale(1.03); }

        .carousel-track { scrollbar-width:none; }
        .carousel-track::-webkit-scrollbar { display:none; }
        .carousel-card .try-btn { opacity:0; transition:opacity 0.3s ease; }
        .carousel-card:hover .try-btn { opacity:1; }
        .carousel-card .carousel-img { transition:transform 0.6s ease; object-fit:cover; }
        .carousel-card:hover .carousel-img { transform:scale(1.03); }

        .ghost-arrow { width:32px; height:1px; background:currentColor; transition:width 0.3s; display:inline-block; vertical-align:middle; }
        .btn-ghost:hover .ghost-arrow { width:48px; }

        .nav-cta-link { background:transparent !important; border:1px solid var(--gold) !important; padding:10px 24px !important; letter-spacing:2px !important; transition:all 0.3s !important; }
        .nav-cta-link:hover { background:var(--gold) !important; color:var(--forest) !important; }

        .steps-connector {
          position:absolute; top:60px;
          left:calc(16.66% + 20px); right:calc(16.66% + 20px);
          height:1px;
          background: linear-gradient(to right, var(--gold), var(--cream-dark), var(--gold));
          z-index:0;
        }

        .nav-link-item { font-family:'DM Sans',sans-serif; font-size:11px; letter-spacing:2.5px; text-transform:uppercase; color:rgba(255,255,255,0.7); text-decoration:none; transition:color 0.2s; }
        .nav-link-item:hover { color: var(--gold-light); }

        .footer-link { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.3); text-decoration:none; transition:color 0.2s; }
        .footer-link:hover { color: var(--gold); }

        .footer-legal-link { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.2); text-decoration:none; transition:color 0.2s; }
        .footer-legal-link:hover { color: rgba(255,255,255,0.5); }

        .mobile-nav-cta { display:none; }
        @media (max-width:900px) {
          .nav-links-hide { display:none !important; }
          .mobile-nav-cta { display:inline-flex !important; align-items:center; background:#b8962e; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; padding:8px 16px; border-radius:6px; border:none; text-decoration:none; cursor:pointer; white-space:nowrap; }
          .hero-grid { grid-template-columns: 1fr !important; padding: 100px 24px 60px !important; gap: 40px !important; }
          .hero-preview-wrap { display:flex !important; justify-content:center !important; }
          .hero-pad { padding: 0 !important; margin: 0 !important; }
          .steps-connector { display:none !important; }
          .steps-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .for-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .examples-header { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
          .examples-header-wrap { padding: 0 24px !important; }
          .carousel-track { padding-left: 24px !important; }
          .carousel-card { width: 85vw !important; }
          .footer-main { flex-direction: column !important; gap: 28px !important; text-align: center !important; }
          .footer-nav { flex-wrap: wrap !important; justify-content: center !important; }
          .section-pad { padding: 60px 24px !important; }
        }
        .site-logo-h { height: 44px; width: auto; display: block; }
        @media (max-width:640px) { .site-logo-h { height: 28px; } }
      `}</style>

      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');`}</style>

      {/* NAV */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: scrolled ? '16px 60px' : '24px 60px',
          background: scrolled ? 'rgba(10,61,43,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          transition: 'background 0.4s ease, padding 0.3s ease',
        }}
      >
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/dd_logo.png" alt="Dedrab" className="site-logo-h" />
        </a>
        <Link href="/design" className="mobile-nav-cta">Build my Action Plan</Link>
        <ul className="nav-links-hide" style={{ display: 'flex', gap: 40, listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}>
          <li><a href="#examples" className="nav-link-item">Examples</a></li>
          <li><a href="#how" className="nav-link-item">How It Works</a></li>
          <li><a href="#features" className="nav-link-item">What You Get</a></li>
          <li>
            <Link href="/design" className="nav-link-item nav-cta-link" style={{ color: 'var(--gold-light)' }}>
              Build my Action Plan
            </Link>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', background: 'var(--forest)', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* botanical tile bg */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.07,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='none' stroke='%23b8962e' stroke-width='0.8'%3E%3Cellipse cx='200' cy='200' rx='180' ry='120' transform='rotate(30 200 200)'/%3E%3Cellipse cx='200' cy='200' rx='180' ry='120' transform='rotate(90 200 200)'/%3E%3Cellipse cx='200' cy='200' rx='180' ry='120' transform='rotate(150 200 200)'/%3E%3Ccircle cx='200' cy='200' r='60'/%3E%3Cline x1='200' y1='20' x2='200' y2='380'/%3E%3Cline x1='20' y1='200' x2='380' y2='200'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '300px 300px',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 60% 50%, rgba(26,92,63,0.4) 0%, transparent 70%)' }} />

        {/* Botanical corners */}
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          <svg width="220" height="220" viewBox="0 0 220 220" fill="none" opacity="0.18">
            <path d="M10 210 C10 210, 20 160, 60 130 C100 100, 140 80, 160 30" stroke="#b8962e" strokeWidth="1.5" fill="none"/>
            <path d="M30 200 C30 200, 50 160, 70 140" stroke="#b8962e" strokeWidth="1" fill="none"/>
            <ellipse cx="80" cy="100" rx="30" ry="18" transform="rotate(-40 80 100)" stroke="#b8962e" strokeWidth="1" fill="none"/>
            <ellipse cx="110" cy="75" rx="25" ry="15" transform="rotate(-50 110 75)" stroke="#b8962e" strokeWidth="1" fill="none"/>
            <ellipse cx="50" cy="140" rx="22" ry="12" transform="rotate(-20 50 140)" stroke="#b8962e" strokeWidth="1" fill="none"/>
            <ellipse cx="140" cy="50" rx="20" ry="12" transform="rotate(-60 140 50)" stroke="#b8962e" strokeWidth="1" fill="none"/>
            <circle cx="162" cy="28" r="4" stroke="#b8962e" strokeWidth="1" fill="none"/>
            <circle cx="45" cy="155" r="3" stroke="#b8962e" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        <div style={{ position: 'absolute', bottom: 0, right: 0, transform: 'rotate(180deg)', pointerEvents: 'none' }}>
          <svg width="220" height="220" viewBox="0 0 220 220" fill="none" opacity="0.18">
            <path d="M10 210 C10 210, 20 160, 60 130 C100 100, 140 80, 160 30" stroke="#b8962e" strokeWidth="1.5" fill="none"/>
            <path d="M30 200 C30 200, 50 160, 70 140" stroke="#b8962e" strokeWidth="1" fill="none"/>
            <ellipse cx="80" cy="100" rx="30" ry="18" transform="rotate(-40 80 100)" stroke="#b8962e" strokeWidth="1" fill="none"/>
            <ellipse cx="110" cy="75" rx="25" ry="15" transform="rotate(-50 110 75)" stroke="#b8962e" strokeWidth="1" fill="none"/>
            <ellipse cx="50" cy="140" rx="22" ry="12" transform="rotate(-20 50 140)" stroke="#b8962e" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* Leaf particles */}
        <div className="leaf leaf-1">
          <svg width="12" height="18" viewBox="0 0 12 18" fill="none"><path d="M6 1 C6 1, 12 6, 10 12 C8 16, 2 17, 1 14 C0 11, 3 5, 6 1Z" stroke="#b8962e" strokeWidth="0.8" fill="none" opacity="0.5"/></svg>
        </div>
        <div className="leaf leaf-2">
          <svg width="10" height="15" viewBox="0 0 12 18" fill="none"><path d="M6 1 C6 1, 12 6, 10 12 C8 16, 2 17, 1 14 C0 11, 3 5, 6 1Z" stroke="#b8962e" strokeWidth="0.8" fill="none" opacity="0.4"/></svg>
        </div>
        <div className="leaf leaf-3">
          <svg width="8" height="12" viewBox="0 0 12 18" fill="none"><path d="M6 1 C6 1, 12 6, 10 12 C8 16, 2 17, 1 14 C0 11, 3 5, 6 1Z" stroke="#b8962e" strokeWidth="0.8" fill="none" opacity="0.3"/></svg>
        </div>

        {/* Hero two-column grid */}
        <div className="hero-grid" style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '55fr 45fr', gap: '60px', alignItems: 'center', width: '100%', padding: '120px 8% 80px' }}>

          {/* Left column */}
          <div className="hero-content hero-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 40, height: 1, background: 'var(--gold)' }} />
              <span style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold-light)', fontFamily: "'DM Sans', sans-serif" }}>Garden Inspiration &amp; Design Vision</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 3.2vw, 48px)', fontWeight: 400, lineHeight: 1.15, color: '#fff', marginBottom: 28 }}>
              Most garden projects never start,<br />because the hard part is knowing where to start.<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>This is where you start.</em>
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 300, lineHeight: 1.75, color: 'rgba(255,255,255,0.75)', marginBottom: 48, maxWidth: 500 }}>
              Upload a photo of your garden and get a complete Action Plan in under 4 minutes — a visual of your finished garden, a plant list, and a phased weekend guide to make it happen.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
              <Link href="/design" className="btn-primary">Build my Action Plan →</Link>
              <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif" }}>No account needed · Takes about 4 minutes</span>
            </div>
          </div>

          {/* Right column — preview card */}
          <div className="hero-preview-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ width: 340, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(184,150,46,0.3)', backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: 220, background: 'linear-gradient(135deg, rgba(45,80,22,0.8), rgba(10,61,43,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <svg width="280" height="180" viewBox="0 0 280 180" fill="none">
                <rect x="0" y="140" width="280" height="40" fill="rgba(45,80,22,0.5)"/>
                <line x1="60" y1="180" x2="60" y2="100" stroke="rgba(184,150,46,0.6)" strokeWidth="3"/>
                <ellipse cx="60" cy="90" rx="28" ry="35" fill="rgba(45,80,22,0.7)"/>
                <ellipse cx="48" cy="100" rx="18" ry="25" fill="rgba(26,92,63,0.6)"/>
                <ellipse cx="120" cy="145" rx="20" ry="14" fill="rgba(45,80,22,0.8)"/>
                <path d="M160 145 Q155 120 158 105" stroke="rgba(184,150,46,0.5)" strokeWidth="1.5" fill="none"/>
                <path d="M165 145 Q170 118 166 100" stroke="rgba(184,150,46,0.4)" strokeWidth="1.5" fill="none"/>
                <path d="M200 180 Q210 160 220 145 Q230 130 240 140" stroke="rgba(184,150,46,0.4)" strokeWidth="2" fill="none"/>
                <text x="10" y="25" fill="rgba(184,150,46,0.6)" fontSize="8" letterSpacing="2" fontFamily="sans-serif">YOUR FINISHED GARDEN</text>
                <line x1="10" y1="30" x2="100" y2="30" stroke="rgba(184,150,46,0.3)" strokeWidth="0.5"/>
              </svg>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold-light)' }}>Building your plan...</span>
                <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>English Cottage · Full Design Plan</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'white', marginBottom: 16 }}>The Sunlit Border Garden</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Plant List', 'Layout Plan', 'Finished Garden', 'Cost Estimate'].map((t) => (
                  <span key={t} style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 10px', border: '1px solid rgba(184,150,46,0.3)', color: 'rgba(255,255,255,0.5)' }}>{t}</span>
                ))}
              </div>
              <Link href="/design" style={{ width: '100%', height: 80, border: '1px dashed rgba(184,150,46,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.3s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" opacity="0.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Upload your garden photo</span>
              </Link>
            </div>
          </div>
          </div>{/* end hero-preview-wrap */}

        </div>{/* end hero-grid */}

        {/* Scroll indicator */}
        <div className="scroll-bob" style={{ position: 'absolute', bottom: 40, left: '50%', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Scroll</span>
          <div style={{ width: 1, height: 50, background: 'linear-gradient(to bottom, rgba(184,150,46,0.6), transparent)' }} />
        </div>
      </section>

      {/* TAGLINE BAND */}
      <div style={{ background: 'var(--linen)', borderBottom: '1px solid var(--cream-dark)', padding: '50px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 400, color: 'var(--forest)', lineHeight: 1.4, marginBottom: 20 }}>
            You know your garden could be <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>so much more.</em><br />
            You just need a little inspiration to get started.
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, lineHeight: 1.7, color: 'var(--warm-grey)' }}>
            Dedrab is for the gardener who loves their outdoor space but has run out of ideas — or never quite knew where to begin. Upload a photo of your garden as it is today, and we&apos;ll show you exactly what it could become.
          </p>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="section-pad" style={{ background: 'var(--parchment)', padding: '100px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 32, height: 1, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif" }}>How It Works</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: 'var(--forest)', lineHeight: 1.2, marginBottom: 60, maxWidth: 540 }}>
            From photo to plan in minutes
          </h2>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, position: 'relative' }}>
            <div className="steps-connector" />
            {[
              {
                n: '01',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 20, height: 20, color: 'var(--gold)' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                ),
                title: 'Upload a photo of your garden',
                desc: "Any angle, any size. The clearer the boundaries, the better your plan.",
              },
              {
                n: '02',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 20, height: 20, color: 'var(--gold)' }}>
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                ),
                title: 'Choose your style and how much to change',
                desc: "Pick a design style and set how ambitious you want to be — from a light refresh to a full redesign.",
                delay: 'delay-1',
              },
              {
                n: '03',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 20, height: 20, color: 'var(--gold)' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                ),
                title: 'Your Action Plan is ready',
                desc: 'A visual of your finished garden. A plant list to gather. A phased weekend guide. A cost estimate. Everything you need to get started — nothing you don\'t.',
                delay: 'delay-2',
              },
            ].map((step) => (
              <div key={step.n} className={`anim-fade${step.delay ? ' ' + step.delay : ''}`} style={{ padding: '0 40px 0 0', position: 'relative' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 72, fontWeight: 300, color: 'var(--linen)', lineHeight: 1, marginBottom: -20, position: 'relative', zIndex: 1 }}>{step.n}</div>
                <div style={{ width: 48, height: 48, border: '1px solid var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, background: 'var(--parchment)', position: 'relative', zIndex: 2 }}>{step.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: 'var(--forest)', marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, lineHeight: 1.7, color: 'var(--warm-grey)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="section-pad" style={{ background: 'var(--forest)', padding: '80px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='1' fill='%23b8962e' opacity='0.12'/%3E%3C/svg%3E")`, backgroundSize: '60px 60px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 32, height: 1, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold-light)', fontFamily: "'DM Sans', sans-serif" }}>Who Dedrab Is For</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: 'white', lineHeight: 1.2, marginBottom: 60, maxWidth: 540 }}>
            For every gardener who&apos;s ever thought, <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>&ldquo;where do I even begin?&rdquo;</em>
          </h2>
          <div className="for-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
            {[
              { icon: '🌱', title: 'The Motivated Beginner', desc: "You've moved into a new home with an empty or overgrown garden. You want something beautiful but don't know where to start. Dedrab gives you a clear, achievable vision and a plant list to take to the garden centre." },
              { icon: '🌿', title: 'The Stuck Gardener', desc: "Your garden is fine, but it's been the same for years. You know it could be better — more colour, more structure, more life — but you haven't known what to change. Dedrab shows you the potential you've been sitting on.", delay: 'delay-3' },
              { icon: '🌸', title: 'The Seasonal Planner', desc: "Spring is coming and you want this year to be the year your garden finally looks the way you've imagined. Dedrab gives you a seasonal planting guide and a vision to work toward — week by week, season by season.", delay: 'delay-4' },
            ].map((card) => (
              <div key={card.title} className={`anim-fade${card.delay ? ' ' + card.delay : ''}`} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,150,46,0.2)', padding: '40px 36px', transition: 'all 0.3s' }}>
                <div style={{ fontSize: 28, marginBottom: 20 }}>{card.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'white', marginBottom: 14 }}>{card.title}</h3>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)' }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESIGN STYLES */}
      <section className="section-pad" style={{ padding: '80px 60px', background: 'var(--linen)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 32, height: 1, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif" }}>Garden Styles</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: 'var(--forest)', lineHeight: 1.2, marginBottom: 16, maxWidth: 540 }}>
            Pick the style that <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>speaks to you</em>
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, lineHeight: 1.7, color: 'var(--warm-grey)', marginBottom: 40, maxWidth: 560 }}>
            Each style produces a completely distinct vision — different plants, different layouts, different moods. Not sure which to choose? The examples below will help.
          </p>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
            {styles.map((s) => (
              <button
                key={s}
                onClick={() => setActiveStyle(s)}
                style={{
                  flexShrink: 0, padding: '12px 28px',
                  border: `1px solid ${activeStyle === s ? 'var(--forest)' : 'var(--cream-dark)'}`,
                  background: activeStyle === s ? 'var(--forest)' : 'var(--parchment)',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: activeStyle === s ? 'var(--gold-light)' : 'var(--warm-grey)',
                  cursor: 'pointer', transition: 'all 0.3s', whiteSpace: 'nowrap',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section id="examples" style={{ background: 'var(--forest)', padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='1' fill='%23b8962e' opacity='0.15'/%3E%3C/svg%3E")`, backgroundSize: '60px 60px' }} />

        {/* Section header */}
        <div className="examples-header-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 60px', position: 'relative', zIndex: 2, marginBottom: 60 }}>
          <div className="examples-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 32, height: 1, background: 'var(--gold)' }} />
                <span style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold-light)', fontFamily: "'DM Sans', sans-serif" }}>Example Plans</span>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: 'white', lineHeight: 1.2, maxWidth: 540, marginBottom: 0 }}>
                See a real Action Plan
              </h2>
            </div>
            <Link href="/design" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', transition: 'gap 0.3s' }}>
              See a real Action Plan →
              <svg width="20" height="8" viewBox="0 0 20 8" fill="none"><line x1="0" y1="4" x2="18" y2="4" stroke="currentColor" strokeWidth="1"/><polyline points="14,1 18,4 14,7" stroke="currentColor" strokeWidth="1" fill="none"/></svg>
            </Link>
          </div>
        </div>

        {/* Carousel */}
        <div className="carousel-track" style={{ display: 'flex', overflowX: 'auto', scrollBehavior: 'smooth', gap: 2, paddingLeft: 60, position: 'relative', zIndex: 2 }}>
          {exampleGardens.map((ex) => (
            <div key={ex.slug} className="carousel-card" style={{ flexShrink: 0, width: 480, height: 320, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
              <img className="carousel-img" src={ex.image} alt={ex.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {/* Badge */}
              <div style={{ position: 'absolute', top: 20, left: 20, background: '#D4AF37', color: 'var(--forest)', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', padding: '6px 14px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{ex.badge}</div>
              {/* Bottom overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px 24px 22px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 400, color: 'white', margin: '0 0 6px', lineHeight: 1.2 }}>{ex.title}</h3>
                <p style={{ fontSize: 10, letterSpacing: 1.5, color: 'rgba(212,175,55,0.8)', margin: 0, textTransform: 'uppercase' }}>{ex.descriptor}</p>
                <Link href={`/design?theme=${ex.slug}`} className="try-btn" style={{ marginTop: 12, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold-light)', textDecoration: 'none', display: 'inline-block' }}>
                  Try this style →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EXAMPLE REPORT */}
      <section style={{ background: 'var(--linen)', padding: '80px 60px', textAlign: 'center', borderTop: '1px solid var(--cream-dark)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>Example Output</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 400, color: 'var(--forest)', marginBottom: 16, lineHeight: 1.25 }}>See a real Action Plan</h2>
          <p style={{ fontSize: 16, color: 'var(--warm-grey)', lineHeight: 1.75, marginBottom: 36, fontFamily: "'DM Sans', sans-serif" }}>
            This is the kind of detailed Action Plan Dedrab generates for your garden — plant list, layout plan, cost estimate, and more.
          </p>
          <a href="/example-report-zen-Proposal.pdf" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block',
            background: 'var(--gold)',
            color: 'var(--forest)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            padding: '14px 36px',
            textDecoration: 'none',
          }}>
            See a real Action Plan →
          </a>
        </div>
      </section>

      {/* STATS STRIP */}
      <div style={{ background: 'var(--linen)', borderTop: '1px solid var(--cream-dark)', borderBottom: '1px solid var(--cream-dark)', padding: '50px 60px' }}>
        <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40 }}>
          {[
            { num: '4', gold: true, label: 'Plans per session' },
            { num: '8', gold: false, label: 'Garden styles' },
            { num: '∞', gold: true, label: 'Ideas to explore' },
            { num: '1', gold: false, label: 'Photo to get started' },
          ].map((s, i) => (
            <div key={s.label} className={`anim-fade${i > 0 ? ` delay-${i}` : ''}`} style={{ textAlign: 'center', padding: 20, borderRight: i < 3 ? '1px solid var(--cream-dark)' : 'none' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 400, color: s.gold ? 'var(--gold)' : 'var(--forest)', lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--warm-grey)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="section-pad" style={{ padding: '100px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 32, height: 1, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif" }}>What You Receive</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: 'var(--forest)', lineHeight: 1.2, marginBottom: 60, maxWidth: 540 }}>
            What&apos;s in your Action Plan
          </h2>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 2 }}>
            {[
              {
                icon: <svg style={{ width: 40, height: 40, color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
                title: 'Your finished garden', tag: 'What You\'re Working Towards',
                desc: "See exactly where you're heading before you lift a spade. A photorealistic picture of your garden as it could look.",
              },
              {
                icon: <svg style={{ width: 40, height: 40, color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
                title: 'What you\'ll need — plants', tag: 'Ready to Plant',
                desc: "A ready-to-use list of every plant, with quantities and sourcing notes. Take it straight to your garden centre.",
                delay: 'delay-3',
              },
              {
                icon: <svg style={{ width: 40, height: 40, color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                title: 'Garden Layout Plan', tag: 'Practical Layout',
                desc: "A top-down plan of your redesigned space. Print it out and take it outside with you.",
                delay: 'delay-4',
              },
              {
                icon: <svg style={{ width: 40, height: 40, color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                // COPY REVIEW NEEDED: This card covers PDF/email delivery — no direct match in the brief's 5 feature cards. The brief's "Your weekend plan" and "Cost estimate" cards also have no existing card. Consider replacing this card or adding two new ones.
                title: 'Your Action Plan, Ready to Go', tag: 'PDF & Email',
                desc: "Download your full Action Plan as a formatted PDF — or send it directly by email. Forward it to a friend, a gardener, or your local nursery. Ready to act on the moment you have it.",
                delay: 'delay-5',
              },
            ].map((f) => (
              <div key={f.title} className={`feature-card anim-fade${f.delay ? ' ' + f.delay : ''}`} style={{ background: 'var(--linen)', padding: 50, border: '1px solid var(--cream-dark)', position: 'relative', overflow: 'hidden', transition: 'all 0.4s ease' }}>
                <div style={{ marginBottom: 24 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: 'var(--forest)', marginBottom: 14 }}>{f.title}</h3>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, lineHeight: 1.7, color: 'var(--warm-grey)' }}>{f.desc}</p>
                <span style={{ display: 'inline-block', marginTop: 20, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', borderBottom: '1px solid var(--gold-pale)', paddingBottom: 2 }}>{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" style={{ background: 'var(--forest)', padding: '120px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(45,80,22,0.5), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, opacity: 0.06, pointerEvents: 'none' }}>
          <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
            <path d="M20 280 C20 280, 40 200, 100 160 C160 120, 220 100, 260 40" stroke="#b8962e" strokeWidth="2" fill="none"/>
            <ellipse cx="120" cy="135" rx="50" ry="28" transform="rotate(-40 120 135)" stroke="#b8962e" strokeWidth="1.5" fill="none"/>
            <ellipse cx="170" cy="100" rx="42" ry="22" transform="rotate(-55 170 100)" stroke="#b8962e" strokeWidth="1.5" fill="none"/>
            <ellipse cx="75" cy="180" rx="38" ry="20" transform="rotate(-25 75 180)" stroke="#b8962e" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' }}>
          <div style={{ width: 60, height: 1, background: 'var(--gold)', margin: '0 auto 32px' }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5vw, 62px)', fontWeight: 400, color: 'white', lineHeight: 1.15, marginBottom: 20 }}>
            The hardest part is starting.<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>You&apos;re already here.</em>
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, color: 'rgba(255,255,255,0.65)', marginBottom: 52, lineHeight: 1.65 }}>
            Your Action Plan takes about 4 minutes. Everything you need to get going is on the other side of that button.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 52, textAlign: 'left', border: '1px solid rgba(184,150,46,0.2)', background: 'rgba(184,150,46,0.04)', padding: '32px 40px' }}>
            {[
              { n: '1', title: 'Upload Your Photo', desc: 'A single photo of your garden — taken on your phone is perfectly fine.' },
              { n: '2', title: 'Pick Your Style', desc: 'Choose from 8 curated garden styles, from Cottage to Contemporary.' },
              { n: '3', title: 'Get Your Action Plan', desc: 'A full plan: your finished garden, plant list, layout, cost estimate, and PDF.' },
            ].map((step, i) => (
              <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: i === 0 ? '0 0 18px' : i === 2 ? '18px 0 0' : '18px 0', borderBottom: i < 2 ? '1px solid rgba(184,150,46,0.12)' : 'none' }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--gold)', lineHeight: 1, flexShrink: 0, width: 28 }}>{step.n}</span>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'white', marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, lineHeight: 1.5, color: 'rgba(255,255,255,0.5)' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Link href="/design" className="btn-primary">Build my Action Plan</Link>
            <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>No account needed · Takes about 4 minutes</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#050f0a', padding: 0 }}>
        <div className="footer-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '48px 60px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <img src="/dd_logo.png" alt="Dedrab" style={{ height: 48, width: 'auto', display: 'block' }} />
            <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginTop: 6 }}>Garden Inspiration</div>
          </div>
          <ul className="footer-nav" style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
            <li><a href="#examples" className="footer-link">Examples</a></li>
            <li><a href="#how" className="footer-link">How It Works</a></li>
            <li><a href="#features" className="footer-link">What You Get</a></li>
            <li><Link href="/design" className="footer-link">Design Tool</Link></li>
          </ul>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', flexWrap: 'wrap', gap: 14 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: 1 }}>© 2025 Dedrab. Garden inspiration powered by AI.</span>
          <ul style={{ display: 'flex', gap: 28, listStyle: 'none', margin: 0, padding: 0 }}>
            <li><a href="/legal#privacy" className="footer-legal-link">Privacy</a></li>
            <li><a href="/legal#terms" className="footer-legal-link">Terms</a></li>
          </ul>
        </div>
      </footer>
    </>
  );
}
