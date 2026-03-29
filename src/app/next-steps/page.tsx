'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { detectCountryFromPostcode, COUNTRY_OPTIONS, CountryOption } from '@/lib/detectPostcodeCountry';

function NextStepsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get('sessionId');
  const [userEmail, setUserEmail] = useState('');
  const [designStyle, setDesignStyle] = useState('');
  const [renderUrl, setRenderUrl] = useState('');
  const [postcode, setPostcode] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<CountryOption>(COUNTRY_OPTIONS[0]);
  const [quotesRequested, setQuotesRequested] = useState<1 | 3>(3);
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [quoteError, setQuoteError] = useState('');

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [shareError, setShareError] = useState('');

  const [sendSelfStatus, setSendSelfStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Redirect to /design if sessionId is missing (direct navigation without a valid session)
  useEffect(() => {
    if (!sessionId) {
      router.push('/design');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setUserEmail(sessionStorage.getItem('garden_user_email') || '');
    setDesignStyle(sessionStorage.getItem('garden_design_style') || '');
    setRenderUrl(sessionStorage.getItem('garden_render_url') || '');
    setReferenceNumber(sessionStorage.getItem('garden_reference_number') || '');
    setPdfUrl(sessionStorage.getItem('garden_pdf_url') || '');
  }, []);

  // Poll for garden_pdf_url — written by a fire-and-forget IIFE in design/page.tsx
  // that may not complete before router.push fires. Retry every 2s for up to 30s.
  useEffect(() => {
    if (sessionStorage.getItem('garden_pdf_url')) return; // already present on mount
    const interval = setInterval(() => {
      const url = sessionStorage.getItem('garden_pdf_url');
      if (url) { setPdfUrl(url); clearInterval(interval); }
    }, 2000);
    const timeout = setTimeout(() => clearInterval(interval), 30000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  function handleCopyReference() {
    if (!referenceNumber) return;
    navigator.clipboard.writeText(referenceNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handlePostcodeChange(value: string) {
    setPostcode(value);
    if (value.length >= 3) {
      setDetectedCountry(detectCountryFromPostcode(value));
    }
  }

  async function handleRequestQuote(e: React.FormEvent) {
    e.preventDefault();
    setQuoteStatus('submitting');
    setQuoteError('');
    try {
      const res = await fetch('/api/request-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, email: userEmail, postcode, quotesRequested, country: detectedCountry.name, countryCode: detectedCountry.code }),
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

  async function handleSendToSelf() {
    if (!userEmail || sendSelfStatus === 'sending') return;
    setSendSelfStatus('sending');
    try {
      const res = await fetch('/api/send-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: userEmail,
          pdfBase64: '',
          planTitle: designStyle ? designStyle + ' Garden Plan' : 'Garden Design Plan',
          designStyle: designStyle || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendSelfStatus('sent');
      } else {
        setSendSelfStatus('error');
      }
    } catch {
      setSendSelfStatus('error');
    }
  }

  async function handleShareWithFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!friendEmail || shareStatus === 'sending') return;
    setShareStatus('sending');
    setShareError('');
    try {
      const res = await fetch('/api/send-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: friendEmail,
          pdfBase64: '',
          planTitle: designStyle ? designStyle + ' Garden Plan' : 'Garden Design Plan',
          designStyle: designStyle || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShareStatus('sent');
      } else {
        setShareError('Could not send. Please try again.');
        setShareStatus('error');
      }
    } catch {
      setShareError('Could not send. Please try again.');
      setShareStatus('error');
    }
  }

  function shareOnWhatsApp(text: string) {
    const encoded = encodeURIComponent(text);
    const appUrl = 'whatsapp://send?text=' + encoded;
    const webUrl = 'https://api.whatsapp.com/send?text=' + encoded;
    const start = Date.now();
    window.location.href = appUrl;
    setTimeout(() => {
      if (Date.now() - start < 1500) {
        window.open(webUrl, '_blank');
      }
    }, 1000);
  }

  function shareOnTelegram(text: string, url: string) {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const appUrl = 'tg://msg_url?url=' + encodedUrl + '&text=' + encodedText;
    const webUrl = 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodedText;
    const start = Date.now();
    window.location.href = appUrl;
    setTimeout(() => {
      if (Date.now() - start < 1500) {
        window.open(webUrl, '_blank');
      }
    }, 1000);
  }

  function handleWhatsAppShare() {
    const urlToShare = renderUrl || window.location.href;
    shareOnWhatsApp('Look what my garden could become \u2014 got my Action Plan from dedrab.com ' + urlToShare);
  }

  function handleTelegramShare() {
    const urlToShare = renderUrl || window.location.href;
    shareOnTelegram('Look what my garden could become \u2014 got my Action Plan from dedrab.com', urlToShare);
  }

  const summaryBoxes = [
    {
      label: 'YOUR ACTION PLAN',
      title: 'Everything you need to get started',
      copy: 'Plant list, materials, implementation phases and ongoing care guide included.',
    },
    {
      label: 'YOUR FINISHED GARDEN',
      title: 'A picture of what you\'re working towards',
      copy: 'Based on your chosen style and transformation level.',
    },
    {
      label: 'SHARE IT',
      title: 'Send to a friend or pass to a landscaper',
      copy: 'Use it as a brief for any contractor or share it with someone who can help.',
    },
  ];

  const btnPrimary: React.CSSProperties = {
    display: 'block', width: '100%', padding: '12px 20px', textAlign: 'center',
    background: '#0a3d2b', color: '#fff', border: 'none', borderRadius: 8,
    fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
    textDecoration: 'none', letterSpacing: '0.02em',
  };

  const btnOutline: React.CSSProperties = {
    display: 'block', width: '100%', padding: '12px 20px', textAlign: 'center',
    background: 'transparent', color: '#0a3d2b', border: '1.5px solid #0a3d2b', borderRadius: 8,
    fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em',
  };

  if (!sessionId) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe4', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
      <style>{`
        #postcode-input::placeholder { color: #9a9a9a; opacity: 1; }
        #friend-email-input::placeholder { color: #9a9a9a; opacity: 1; }
        .site-logo-h { height: 36px; width: auto; display: block; }
        @media (max-width:640px) { .site-logo-h { height: 28px; } }
        @media (max-width: 767px) {
          .ns-grid { grid-template-columns: 1fr !important; }
          .ns-boxes { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: '#0a3d2b', padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/dd_logo.png" alt="Dedrab" className="site-logo-h" />
        </a>
        <a href="/design" style={{ color: '#b8962e', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>{'← Start a new design'}</a>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 400, color: '#0a3d2b', marginBottom: 8, marginTop: 0 }}>Your Action Plan is ready.</h1>
        <p style={{ fontSize: 15, color: '#8a7e6e', marginBottom: referenceNumber ? 20 : 40, marginTop: 0 }}>Here&apos;s what to do next.</p>

        {/* Reference number display */}
        {referenceNumber && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, padding: '12px 18px', marginBottom: 36 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b8962e', fontWeight: 700, marginBottom: 3 }}>Your Reference</div>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 600, color: '#0a3d2b', letterSpacing: '0.04em' }}>{referenceNumber}</div>
            </div>
            <button
              onClick={handleCopyReference}
              title="Copy reference number"
              style={{
                background: copied ? '#f0f7f0' : '#f4efe4', border: '1px solid #e5ddd0', borderRadius: 6,
                padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: copied ? '#2d5a2d' : '#6b5e50',
                fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {/* Two-column grid */}
        <div className="ns-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'stretch' }}>

          {/* ── OPTION 1: DIY ── */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5ddd0',
            borderLeft: '3px solid #b8962e',
            borderRadius: 12,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#b8962e', marginBottom: 10, fontWeight: 700 }}>Option 1</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: '#0a3d2b', marginBottom: 10, marginTop: 0 }}>Do it yourself</h2>
            <p style={{ fontSize: 14, color: '#6b5e50', lineHeight: 1.7, marginBottom: 22, marginTop: 0 }}>
              Your plan is ready. Download it, email it to yourself, or share it with someone who can help bring it to life.
            </p>

            {/* Summary boxes */}
            <div className="ns-boxes" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              {summaryBoxes.map(box => (
                <div key={box.label} style={{
                  background: '#faf8f4',
                  borderTop: '2px solid #b8962e',
                  borderRadius: 8,
                  padding: 14,
                }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b8962e', fontWeight: 700, marginBottom: 5 }}>{box.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0a3d2b', marginBottom: 5 }}>{box.title}</div>
                  <div style={{ fontSize: 12, color: '#666', lineHeight: 1.55 }}>{box.copy}</div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <a href="/design" style={btnPrimary}>Get your Action Plan</a>

              <button
                onClick={handleSendToSelf}
                disabled={sendSelfStatus === 'sending' || sendSelfStatus === 'sent'}
                style={{
                  ...btnOutline,
                  opacity: sendSelfStatus === 'sending' ? 0.6 : 1,
                  cursor: sendSelfStatus === 'sending' || sendSelfStatus === 'sent' ? 'default' : 'pointer',
                }}
              >
                {sendSelfStatus === 'sent'
                  ? 'Plan sent to ' + (userEmail || 'you')
                  : sendSelfStatus === 'error'
                  ? 'Could not send — return to your design'
                  : sendSelfStatus === 'sending'
                  ? 'Sending\u2026'
                  : 'Send it to my email'}
              </button>

              <button
                onClick={() => setShowSharePanel(p => !p)}
                style={{ ...btnOutline, cursor: 'pointer' }}
              >
                Share with a friend
              </button>

              {showSharePanel && (
                <div style={{ background: '#faf8f4', border: '1px solid #ddd', borderRadius: 8, padding: 14, marginTop: 0 }}>
                  {shareStatus === 'sent' ? (
                    <p style={{ margin: 0, fontSize: 13, color: '#2d5a2d' }}>{'Plan sent to ' + friendEmail}</p>
                  ) : (
                    <form onSubmit={handleShareWithFriend}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a3f32', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {"Friend's email address"}
                      </label>
                      <input
                        id="friend-email-input"
                        type="email"
                        required
                        value={friendEmail}
                        onChange={e => setFriendEmail(e.target.value)}
                        placeholder="Enter email address"
                        style={{
                          width: '100%', padding: '9px 11px', border: '1px solid #d4c9b8', borderRadius: 4,
                          fontSize: 13, fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box',
                          color: '#1a1a1a', WebkitTextFillColor: '#1a1a1a', opacity: 1, backgroundColor: '#fff',
                        }}
                      />
                      {shareStatus === 'error' && (
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#c0392b' }}>{shareError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={shareStatus === 'sending'}
                        style={{
                          width: '100%', padding: '10px 0',
                          background: shareStatus === 'sending' ? '#d4aa4a' : '#b8962e',
                          color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13,
                          cursor: shareStatus === 'sending' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {shareStatus === 'sending' ? 'Sending\u2026' : 'Send plan'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Social sharing — only shown when renderUrl is available */}
            {renderUrl && (
              <div style={{ borderTop: '1px solid #e5ddd0', paddingTop: 18, marginTop: 'auto' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a7e6e', marginBottom: 10, fontWeight: 600 }}>Share your finished garden</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleWhatsAppShare}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      background: '#25D366', color: '#fff', border: 'none',
                      borderRadius: 20, padding: '6px 14px',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>

                  <button
                    onClick={handleTelegramShare}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      background: '#229ED9', color: '#fff', border: 'none',
                      borderRadius: 20, padding: '6px 14px',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── OPTION 2: GET IT DONE ── */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5ddd0',
            borderLeft: '3px solid #0a3d2b',
            borderRadius: 12,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#b8962e', marginBottom: 10, fontWeight: 700 }}>Option 2</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: '#0a3d2b', marginBottom: 10, marginTop: 0 }}>Get it done for me</h2>
            {referenceNumber && (
              <p style={{ fontSize: 12, color: '#8a7e6e', marginBottom: 14, marginTop: 0 }}>{'Reference: ' + referenceNumber}</p>
            )}
            <p style={{ fontSize: 14, color: '#6b5e50', lineHeight: 1.7, marginBottom: 20, marginTop: 0 }}>
              Prefer to hand it over? Enter your postcode and one of our landscape partners will contact you within 2 working days with a quote. Your Action Plan goes straight to them.
            </p>
            {userEmail && (
              <p style={{ fontSize: 13, color: '#8a7e6e', marginBottom: 20, marginTop: 0, fontStyle: 'italic' }}>{"We'll contact you at "}{userEmail}</p>
            )}
            {quoteStatus === 'success' ? (
              <div style={{ background: '#f0f7f0', border: '1px solid #b8d4b8', borderRadius: 6, padding: '16px 18px', fontSize: 14, color: '#2d5a2d', lineHeight: 1.6 }}>
                {"Your request has been sent. You'll hear from us within 2 working days with your "}{quotesRequested}{quotesRequested === 1 ? ' quote' : ' quotes'}{". A copy of your Action Plan has been sent to "}{userEmail}{"."}
              </div>
            ) : (
              <form onSubmit={handleRequestQuote} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a3f32', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Your postcode or ZIP code
                </label>
                <input
                  id="postcode-input"
                  type="text"
                  required
                  value={postcode}
                  onChange={e => handlePostcodeChange(e.target.value)}
                  placeholder="e.g. SW1A 1AA or 10001"
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d4c9b8', borderRadius: 4,
                    fontSize: 14, fontFamily: 'inherit', marginBottom: 14, boxSizing: 'border-box',
                    color: '#1a1a1a', WebkitTextFillColor: '#1a1a1a', opacity: 1, backgroundColor: '#ffffff',
                  }}
                />
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a3f32', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Country
                </label>
                <select
                  value={detectedCountry.code}
                  onChange={e => {
                    const selected = COUNTRY_OPTIONS.find(c => c.code === e.target.value) || COUNTRY_OPTIONS[0];
                    setDetectedCountry(selected);
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d4c9b8', borderRadius: 4,
                    fontSize: 14, fontFamily: 'inherit', marginBottom: 6, boxSizing: 'border-box',
                    color: '#1a1a1a', WebkitTextFillColor: '#1a1a1a', opacity: 1, backgroundColor: '#ffffff',
                    appearance: 'auto',
                  }}
                >
                  {COUNTRY_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: '#9a9a9a', margin: '0 0 18px', lineHeight: 1.4 }}>
                  Detected from your postcode — change if incorrect
                </p>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#4a3f32', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Number of quotes</div>
                  {([1, 3] as const).map(n => (
                    <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                      <input type="radio" name="quotes" value={n} checked={quotesRequested === n} onChange={() => setQuotesRequested(n)} />
                      <span style={{ fontSize: 14, color: '#2d2520' }}>
                        {n === 1 ? 'Send me 1 quote' : <><strong>Send me 3 quotes</strong><span style={{ fontSize: 12, color: '#b8962e', fontWeight: 600, marginLeft: 6 }}>Recommended</span></>}
                      </span>
                    </label>
                  ))}
                </div>
                {quoteStatus === 'error' && (
                  <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 12, marginTop: 0 }}>{quoteError || 'Something went wrong. Please try again.'}</p>
                )}
                <button
                  type="submit"
                  disabled={quoteStatus === 'submitting'}
                  style={{
                    width: '100%', padding: '13px 0', marginTop: 'auto',
                    background: quoteStatus === 'submitting' ? '#d4aa4a' : '#b8962e',
                    color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 14,
                    cursor: quoteStatus === 'submitting' ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
                  }}
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
