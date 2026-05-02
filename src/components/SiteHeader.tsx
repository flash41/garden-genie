'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type SiteHeaderProps = {
  /**
   * 'hero' (default): transparent over the homepage hero, fades to dark forest on scroll.
   * 'solid': always dark forest. Use on pages without a full-bleed hero (e.g. /notes).
   */
  variant?: 'hero' | 'solid';
};

const NAV_ITEMS = [
  { label: 'Examples', href: '/#examples' },
  { label: 'How It Works', href: '/#how' },
  { label: 'What You Get', href: '/#features' },
  { label: 'Notes', href: '/notes' },
];

export function SiteHeader({ variant = 'hero' }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll-tied background only matters for hero variant
  useEffect(() => {
    if (variant !== 'hero') return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  // Lock body scroll while menu is open
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const isSolid = variant === 'solid' || scrolled;
  const navBackground = isSolid ? 'rgba(10,61,43,0.97)' : 'transparent';
  const navBackdrop = isSolid ? 'blur(12px)' : 'none';
  const navPadding = scrolled || variant === 'solid' ? '16px 60px' : '24px 60px';

  return (
    <>
      <style>{`
        .sh-nav-link { font-family:'DM Sans',sans-serif; font-size:11px; letter-spacing:2.5px; text-transform:uppercase; color:rgba(255,255,255,0.7); text-decoration:none; transition:color 0.2s; }
        .sh-nav-link:hover { color:#D4AF37; }
        .sh-nav-cta { background:transparent !important; border:1px solid #b8962e !important; padding:10px 24px !important; letter-spacing:2px !important; transition:all 0.3s !important; color:#D4AF37; }
        .sh-nav-cta:hover { background:#b8962e !important; color:#0a3d2b !important; }
        .sh-logo { height:44px; width:auto; display:block; }
        @media (max-width:640px) { .sh-logo { height:28px; } }

        /* Burger button */
        .sh-burger {
          display:none;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:5px;
          background:transparent;
          border:none;
          padding:8px;
          margin:0;
          cursor:pointer;
          width:44px;
          height:44px;
          border-radius:6px;
          transition:background 0.2s;
          flex-shrink:0;
          position:relative;
          z-index:201;
        }
        .sh-burger:hover { background:rgba(255,255,255,0.08); }
        .sh-burger:focus-visible { outline:2px solid #D4AF37; outline-offset:2px; }
        .sh-burger-bar {
          display:block;
          width:24px;
          height:2px;
          background:#D4AF37;
          border-radius:1px;
          flex-shrink:0;
          transition:transform 0.3s ease, opacity 0.2s ease;
          transform-origin:center;
        }
        .sh-burger[data-open="true"] .sh-burger-bar:nth-child(1) { transform:translateY(7px) rotate(45deg); }
        .sh-burger[data-open="true"] .sh-burger-bar:nth-child(2) { opacity:0; }
        .sh-burger[data-open="true"] .sh-burger-bar:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }

        /* CTA button (primary, gold-filled) — matches existing .mobile-nav-cta look */
        .sh-cta-primary {
          display:inline-flex;
          align-items:center;
          background:#b8962e;
          color:#fff;
          font-family:'DM Sans',sans-serif;
          font-size:13px;
          font-weight:500;
          padding:8px 16px;
          border-radius:6px;
          border:none;
          text-decoration:none;
          cursor:pointer;
          white-space:nowrap;
          transition:background 0.2s, transform 0.2s;
        }
        .sh-cta-primary:hover { background:#D4AF37; transform:translateY(-1px); }

        /* Desktop nav list */
        .sh-desktop-nav { display:flex; gap:40px; list-style:none; align-items:center; margin:0; padding:0; }

        /* Responsive: under 900px, swap desktop nav for burger */
        @media (max-width:900px) {
          .sh-desktop-nav { display:none !important; }
          .sh-burger { display:inline-flex !important; }
        }

        /* Mobile-only CTA in header (next to burger). On desktop the gold-bordered CTA inside the desktop list is used instead. */
        .sh-mobile-cta-wrap { display:none; }
        @media (max-width:900px) {
          .sh-mobile-cta-wrap { display:inline-flex; }
        }
        @media (max-width:420px) {
          /* Tighter padding & shorter CTA label space on small phones — keep CTA visible always */
          .sh-cta-primary { padding:8px 12px; font-size:12px; }
        }

        /* Overlay menu */
        .sh-overlay {
          position:fixed;
          inset:0;
          background:rgba(10,61,43,0.98);
          backdrop-filter:blur(12px);
          z-index:200;
          display:flex;
          flex-direction:column;
          padding:24px;
          opacity:0;
          pointer-events:none;
          transition:opacity 0.25s ease;
        }
        .sh-overlay[data-open="true"] {
          opacity:1;
          pointer-events:auto;
        }
        .sh-overlay-top {
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 12px;
          margin-bottom:48px;
        }
        .sh-overlay-list {
          flex:1;
          display:flex;
          flex-direction:column;
          gap:8px;
          align-items:flex-start;
          justify-content:center;
          list-style:none;
          margin:0;
          padding:0 24px;
        }
        .sh-overlay-link {
          font-family:'Playfair Display', serif;
          font-size:32px;
          font-weight:400;
          color:#fff;
          text-decoration:none;
          padding:12px 0;
          letter-spacing:0.5px;
          transition:color 0.2s;
        }
        .sh-overlay-link:hover { color:#D4AF37; }
        .sh-overlay-cta {
          margin:32px 24px 24px;
          padding:18px 28px;
          background:#b8962e;
          color:#0a3d2b;
          font-family:'DM Sans', sans-serif;
          font-size:12px;
          font-weight:600;
          letter-spacing:2px;
          text-transform:uppercase;
          text-align:center;
          text-decoration:none;
          border-radius:4px;
          transition:background 0.2s;
        }
        .sh-overlay-cta:hover { background:#D4AF37; }
        .sh-overlay-close {
          background:transparent;
          border:none;
          color:#D4AF37;
          font-size:24px;
          line-height:1;
          padding:8px;
          cursor:pointer;
          border-radius:6px;
        }
        .sh-overlay-close:hover { background:rgba(255,255,255,0.08); }

        /* Tighten nav padding on small screens */
        @media (max-width:640px) {
          .sh-nav-pad { padding:14px 20px !important; }
        }
      `}</style>

      <nav
        className="sh-nav-pad"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: navPadding,
          background: navBackground,
          backdropFilter: navBackdrop,
          WebkitBackdropFilter: navBackdrop,
          transition: 'background 0.4s ease, padding 0.3s ease',
        }}
      >
        <a href="/" style={{ display: 'flex', alignItems: 'center' }} aria-label="Dedrab — home">
          <img src="/dd_logo.png" alt="Dedrab" className="sh-logo" />
        </a>

        {/* Mobile right cluster: CTA + burger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="sh-mobile-cta-wrap">
            <Link href="/design" className="sh-cta-primary">Build my Garden Plan</Link>
          </span>
          <button
            type="button"
            className="sh-burger"
            data-open={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="sh-overlay-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sh-burger-bar" />
            <span className="sh-burger-bar" />
            <span className="sh-burger-bar" />
          </button>
        </div>

        {/* Desktop nav */}
        <ul className="sh-desktop-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="sh-nav-link">{item.label}</Link>
            </li>
          ))}
          <li>
            <Link href="/design" className="sh-nav-link sh-nav-cta">
              Build my Garden Plan
            </Link>
          </li>
        </ul>
      </nav>

      {/* Overlay menu */}
      <div
        id="sh-overlay-menu"
        className="sh-overlay"
        data-open={menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="sh-overlay-top">
          <a href="/" onClick={() => setMenuOpen(false)} aria-label="Dedrab — home">
            <img src="/dd_logo.png" alt="Dedrab" className="sh-logo" />
          </a>
          <button
            type="button"
            className="sh-overlay-close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <ul className="sh-overlay-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="sh-overlay-link"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/design"
          className="sh-overlay-cta"
          onClick={() => setMenuOpen(false)}
        >
          Build my Garden Plan →
        </Link>
      </div>
    </>
  );
}

export default SiteHeader;
