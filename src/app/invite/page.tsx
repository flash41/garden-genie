'use client';
import { useState } from 'react';

export default function InvitePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const upper = code.toUpperCase().trim();
    if (!upper) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: upper }),
      });
      const data = await res.json();
      if (data.success) {
        const validatedCode = data.code || upper;
        document.cookie = 'dedrab_invite=' + validatedCode + '; path=/; max-age=' + (60 * 60 * 24 * 30) + '; SameSite=Lax';
        window.location.href = '/design';
      } else if (data.error === 'exhausted') {
        setError('This code has already been used. If this is a mistake please get in touch.');
      } else {
        setError('This code is not recognised. Please check and try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        #invite-code-input { text-transform: uppercase; }
        #invite-code-input::placeholder { text-transform: none; color: #b0a898; }
        .site-logo-h { height: 44px; width: auto; }
        @media (max-width:640px) { .site-logo-h { height: 32px; } }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <img src="/dd_logo.png" alt="Dedrab" className="site-logo-h" style={{ display: 'inline-block' }} />
      </div>

      {/* Card */}
      <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderTop: '3px solid #b8962e', borderRadius: 10, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 400, color: '#0a3d2b', marginTop: 0, marginBottom: 8 }}>You have been invited</h1>
        <p style={{ fontSize: 14, color: '#6b5e50', lineHeight: 1.65, marginTop: 0, marginBottom: 28 }}>Enter your invite code below to get started.</p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a3f32', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Invite code
          </label>
          <input
            id="invite-code-input"
            type="text"
            required
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="e.g. KPX847"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            style={{
              width: '100%', padding: '12px 14px', border: '1px solid #d4c9b8', borderRadius: 6,
              fontSize: 18, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.12em',
              marginBottom: 18, boxSizing: 'border-box',
              color: '#0a3d2b', WebkitTextFillColor: '#0a3d2b', backgroundColor: '#fff',
              outline: 'none',
            }}
          />

          {error && (
            <p style={{ fontSize: 13, color: '#c0392b', background: '#fdf3f2', border: '1px solid #f5c6c0', borderRadius: 4, padding: '10px 12px', marginBottom: 16, marginTop: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px 0',
              background: loading ? '#d4aa4a' : '#b8962e',
              color: '#fff', border: 'none', borderRadius: 6,
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.04em',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Checking\u2026' : 'Continue'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 28, fontSize: 12, color: '#b0a898', textAlign: 'center' }}>
        {'Don\u2019t have a code? '}
        <a href="mailto:hello@dedrab.com" style={{ color: '#b8962e', textDecoration: 'none', fontWeight: 600 }}>Get in touch</a>
      </p>
    </div>
  );
}
