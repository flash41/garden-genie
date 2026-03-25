'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/admin/leads');
      } else {
        setError('Incorrect password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, padding: '40px 36px', width: 360, maxWidth: '90vw', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <img src="/dd_logo.png" alt="Dedrab" style={{ height: 44, width: 'auto', display: 'block', marginBottom: 6 }} />
        <div style={{ fontSize: 12, color: '#8a7e6e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28 }}>Admin</div>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a3f32', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoFocus
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c9b8', borderRadius: 4, fontSize: 14, fontFamily: 'inherit', marginBottom: 18, boxSizing: 'border-box', outline: 'none' }}
          />
          {error && <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 14 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px 0', background: loading ? '#d4aa4a' : '#0a3d2b', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.04em' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
