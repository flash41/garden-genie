'use client';
import { useState, useEffect, useCallback } from 'react';

interface InviteCode {
  id: string;
  code: string;
  label: string | null;
  email: string | null;
  renders_used: number;
  max_renders: number;
  created_at: string;
}

export default function InviteManager() {
  const [label, setLabel] = useState('');
  const [email, setEmail] = useState('');
  const [maxRenders, setMaxRenders] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState(false);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/generate-invite', { credentials: 'include' });
      const data = await res.json();
      if (data.codes) setCodes(data.codes);
    } catch {
      // silent
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setGenError('');
    setNewCode('');
    setCopied(false);
    try {
      const res = await fetch('/api/admin/generate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label: label.trim(), email: email.trim(), maxRenders }),
      });
      const data = await res.json();
      if (data.success && data.invite?.code) {
        setNewCode(data.invite.code);
        setLabel('');
        setEmail('');
        setMaxRenders(5);
        fetchCodes();
      } else {
        setGenError(data.error || 'Failed to generate code.');
      }
    } catch {
      setGenError('Something went wrong.');
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!newCode) return;
    navigator.clipboard.writeText(newCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 11px', border: '1px solid #d4c9b8', borderRadius: 4,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
    color: '#1a1a1a', backgroundColor: '#fff',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#4a3f32',
    marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase',
  };

  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 400, color: '#0a3d2b', marginBottom: 20, marginTop: 0 }}>Invite Codes</h2>

      {/* Generate form */}
      <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0a3d2b', marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Generate new code</div>
        <form onSubmit={handleGenerate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={labelStyle}>Label (name)</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. James"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="james@example.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Max renders</label>
              <input
                type="number"
                value={maxRenders}
                min={1}
                max={50}
                onChange={e => setMaxRenders(Number(e.target.value))}
                style={{ ...inputStyle, width: 80 }}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={generating}
                style={{
                  padding: '9px 20px', background: generating ? '#d4aa4a' : '#b8962e',
                  color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 13,
                  cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {generating ? 'Generating\u2026' : 'Generate code'}
              </button>
            </div>
          </div>
          {genError && <p style={{ margin: '10px 0 0', fontSize: 13, color: '#c0392b' }}>{genError}</p>}
        </form>

        {newCode && (
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, background: '#f0f7f0', border: '1px solid #b8d4b8', borderRadius: 6, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#2d5a2d', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginRight: 4 }}>New code:</div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: '#0a3d2b', letterSpacing: '0.1em' }}>{newCode}</div>
            <button
              onClick={handleCopy}
              style={{
                padding: '5px 12px', background: copied ? '#0a3d2b' : '#fff',
                color: copied ? '#fff' : '#0a3d2b', border: '1px solid #0a3d2b',
                borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', marginLeft: 4,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Existing codes table */}
      {loadingCodes ? (
        <p style={{ fontSize: 14, color: '#8a7e6e' }}>Loading codes&hellip;</p>
      ) : codes.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, padding: '32px', textAlign: 'center', color: '#8a7e6e', fontSize: 14 }}>
          No invite codes yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, overflow: 'hidden', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#0a3d2b' }}>
                {['Code', 'Label', 'Email', 'Renders used', 'Max', 'Created'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#b8962e', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c, i) => (
                <tr key={c.id} style={{ borderTop: '1px solid #e5ddd0', background: i % 2 === 0 ? '#fff' : '#faf8f4' }}>
                  <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0a3d2b', letterSpacing: '0.08em' }}>{c.code}</td>
                  <td style={{ padding: '11px 14px', color: '#2d2520' }}>{c.label || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#4a3f32' }}>{c.email || '—'}</td>
                  <td style={{ padding: '11px 14px', color: c.renders_used >= c.max_renders ? '#c0392b' : '#2d5a2d', fontWeight: 600 }}>{c.renders_used}</td>
                  <td style={{ padding: '11px 14px', color: '#4a3f32' }}>{c.max_renders}</td>
                  <td style={{ padding: '11px 14px', color: '#8a7e6e', whiteSpace: 'nowrap' }}>
                    {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
