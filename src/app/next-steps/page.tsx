'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function NextStepsContent() {
  const params = useSearchParams();
  const sessionId = params.get('sessionId');
  const [userEmail, setUserEmail] = useState('');
  const [designStyle, setDesignStyle] = useState('');
  const [postcode, setPostcode] = useState('');
  const [quotesRequested, setQuotesRequested] = useState<1 | 3>(3);
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    setUserEmail(sessionStorage.getItem('garden_user_email') || '');
    setDesignStyle(sessionStorage.getItem('garden_design_style') || '');
  }, []);

  async function handleRequestQuote(e: React.FormEvent) {
    e.preventDefault();
    setQuoteStatus('submitting');
    setQuoteError('');
    try {
      const res = await fetch('/api/request-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, email: userEmail, postcode, quotesRequested }),
      });
      const data = await res.json();
      if (data.success) {
        setQuoteStatus('success');
      } else {
        setQuoteError(data.error || 'Something went wrong.');
        setQuoteStatus('error');
      }
    } catch {
      setQuoteError('Something went wrong. Please try again.');
      setQuoteStatus('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe4', fontFamily: "'DM Sans', sans-serif", padding: '0' }}>
      {/* Header */}
      <div style={{ background: '#0a3d2b', padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 3, textTransform: 'uppercase' }}>Dedrab</div>
        <a href="/design" style={{ color: '#b8962e', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← Start a new design</a>
      </div>
      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 400, color: '#0a3d2b', marginBottom: 8 }}>What would you like to do next?</h1>
        <p style={{ fontSize: 15, color: '#8a7e6e', marginBottom: 40 }}>Your garden design proposal is ready. Choose how you&apos;d like to proceed.</p>
        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {/* Section 1: DIY */}
          <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, padding: '32px 28px' }}>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#b8962e', marginBottom: 12, fontWeight: 700 }}>Option 1</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: '#0a3d2b', marginBottom: 12 }}>Do it yourself</h2>
            <p style={{ fontSize: 14, color: '#6b5e50', lineHeight: 1.7, marginBottom: 28 }}>Your plan is ready. Download it, email it to yourself, or share it with someone who can help bring it to life.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/design" style={{ display: 'block', textAlign: 'center', padding: '11px 0', background: '#0a3d2b', color: '#fff', borderRadius: 4, fontWeight: 600, fontSize: 13, textDecoration: 'none', letterSpacing: '0.04em' }}>
                ← Go back to download your plan
              </a>
            </div>
          </div>
          {/* Section 2: Get it done */}
          <div style={{ background: '#faf8f4', border: '1px solid #e5ddd0', borderLeft: '3px solid #b8962e', borderRadius: 8, padding: '32px 28px' }}>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#b8962e', marginBottom: 12, fontWeight: 700 }}>Option 2</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: '#0a3d2b', marginBottom: 12 }}>Get it done for me</h2>
            <p style={{ fontSize: 14, color: '#6b5e50', lineHeight: 1.7, marginBottom: 20 }}>Prefer to hand it over? Enter your postcode below and one of our landscape partners will be in touch with a quote. Your full plan will be shared with them.</p>
            {userEmail && (
              <p style={{ fontSize: 13, color: '#8a7e6e', marginBottom: 20, fontStyle: 'italic' }}>{"We'll contact you at "}{userEmail}</p>
            )}
            {quoteStatus === 'success' ? (
              <div style={{ background: '#f0f7f0', border: '1px solid #b8d4b8', borderRadius: 6, padding: '16px 18px', fontSize: 14, color: '#2d5a2d', lineHeight: 1.6 }}>
                {"Your request has been sent. We'll be in touch in the coming days with your "}{quotesRequested}{quotesRequested === 1 ? ' quote' : ' quotes'}{". A copy of your plan has been sent to "}{userEmail}{"."}</div>
            ) : (
              <form onSubmit={handleRequestQuote}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a3f32', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your postcode or ZIP code</label>
                <input
                  type="text" required value={postcode}
                  onChange={e => setPostcode(e.target.value)}
                  placeholder="e.g. SW1A 1AA or 10001"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c9b8', borderRadius: 4, fontSize: 14, fontFamily: 'inherit', marginBottom: 18, boxSizing: 'border-box' }}
                />
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#4a3f32', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Number of quotes</div>
                  {([1, 3] as const).map(n => (
                    <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                      <input type="radio" name="quotes" value={n} checked={quotesRequested === n} onChange={() => setQuotesRequested(n)} />
                      <span style={{ fontSize: 14, color: '#2d2520' }}>
                        {n === 1 ? 'Send me 1 quote' : <><strong>Send me 3 quotes</strong> <span style={{ fontSize: 12, color: '#b8962e', fontWeight: 600, marginLeft: 6 }}>Recommended</span></>}
                      </span>
                    </label>
                  ))}
                </div>
                {quoteStatus === 'error' && (
                  <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 12 }}>{quoteError || 'Something went wrong. Please try again or download your plan using the button on the left.'}</p>
                )}
                <button
                  type="submit"
                  disabled={quoteStatus === 'submitting'}
                  style={{ width: '100%', padding: '13px 0', background: quoteStatus === 'submitting' ? '#d4aa4a' : '#b8962e', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 14, cursor: quoteStatus === 'submitting' ? 'not-allowed' : 'pointer', letterSpacing: '0.04em' }}
                >
                  {quoteStatus === 'submitting' ? 'Submitting\u2026' : 'Request quotes'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NextStepsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading\u2026</div>}>
      <NextStepsContent />
    </Suspense>
  );
}
