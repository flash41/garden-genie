'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const ERROR_TYPE_LABELS: Record<string, string> = {
  pdf_failure:      'Action Plan document could not be generated',
  download_failure: 'Download did not complete',
  email_failure:    'Plan could not be sent by email',
  render_failure:   'Garden render did not complete',
  unknown:          'Unexpected error',
};

function ReportForm() {
  const params = useSearchParams();
  const router = useRouter();
  const ref   = params.get('ref')   || '';
  const email = params.get('email') || '';
  const type  = params.get('type')  || 'unknown';
  const log   = params.get('log')   || '';
  const sid   = params.get('sid')   || '';

  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => { router.push('/'); }, 12000);
    return () => clearTimeout(timer);
  }, [status]);

  const typeLabel = ERROR_TYPE_LABELS[type] || ERROR_TYPE_LABELS.unknown;
  const hasInfo = ref || email || type;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceNumber: ref || undefined,
          email: email || undefined,
          errorType: type || 'unknown',
          userDescription: description.trim(),
          logSnippet: log || undefined,
          sessionId: sid || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', fontFamily: "system-ui, -apple-system, 'Inter', sans-serif", padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Wordmark */}
        <div style={{ fontSize: 20, fontWeight: 600, color: '#0a3d2b', letterSpacing: '0.04em', marginBottom: 12 }}>
          Dedrab
        </div>
        <div style={{ height: 2, background: '#b8962e', marginBottom: 32 }} />

        {status === 'success' ? (
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400, color: '#0a3d2b', marginBottom: 16, marginTop: 0 }}>
              Report received
            </h1>
            <p style={{ fontSize: 15, color: '#4a3f32', lineHeight: 1.7, margin: 0 }}>
              {email
                ? <>Thank you. We&apos;ll investigate and get back to you at <strong>{email}</strong> as soon as possible — usually within one working day.</>
                : <>Thank you. We&apos;ll investigate this as soon as possible.</>
              }
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400, color: '#0a3d2b', marginBottom: 12, marginTop: 0 }}>
              Something went wrong with your plan
            </h1>
            <p style={{ fontSize: 14, color: '#6b5e50', lineHeight: 1.7, marginBottom: 24, marginTop: 0 }}>
              We&apos;re sorry for the inconvenience. Please tell us what happened and we&apos;ll get your Action Plan to you as quickly as possible.
            </p>

            {/* Pre-populated info block */}
            <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderLeft: '3px solid #b8962e', borderRadius: 8, padding: '14px 16px', marginBottom: 28, fontSize: 13, color: '#4a3f32', lineHeight: 1.8 }}>
              {hasInfo ? (
                <>
                  {ref   && <div><span style={{ color: '#8a7e6e', fontWeight: 600 }}>Reference:</span> {ref}</div>}
                  {email && <div><span style={{ color: '#8a7e6e', fontWeight: 600 }}>Email:</span> {email}</div>}
                  <div><span style={{ color: '#8a7e6e', fontWeight: 600 }}>Issue type:</span> {typeLabel}</div>
                </>
              ) : (
                <span style={{ color: '#8a7e6e' }}>Your session details will be included automatically.</span>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d2520', marginBottom: 8, lineHeight: 1.5 }}>
                What happened? Please describe what you were doing when the error occurred.
              </label>
              <textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. I clicked Download and nothing happened, then the page showed an error message..."
                style={{
                  width: '100%',
                  minHeight: 140,
                  padding: '10px 12px',
                  border: '1px solid #d4c9b8',
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  color: '#1a1a1a',
                  background: '#fff',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  lineHeight: 1.6,
                  outline: 'none',
                }}
              />

              {status === 'error' && errorMsg && (
                <p style={{ fontSize: 13, color: '#8a2a2a', margin: '10px 0 0' }}>
                  {errorMsg}{' '}
                  {ref
                    ? <>Please email <a href="mailto:support@dedrab.com" style={{ color: '#8a2a2a' }}>support@dedrab.com</a> and quote reference <strong>{ref}</strong>.</>
                    : <>Please email <a href="mailto:support@dedrab.com" style={{ color: '#8a2a2a' }}>support@dedrab.com</a> directly.</>
                  }
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 16,
                  padding: '14px 20px',
                  background: status === 'sending' ? '#3d6b50' : '#0a3d2b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.02em',
                  transition: 'background 0.15s',
                }}
              >
                {status === 'sending' ? 'Sending\u2026' : 'Send error report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function SupportReportPage() {
  return (
    <Suspense>
      <ReportForm />
    </Suspense>
  );
}
