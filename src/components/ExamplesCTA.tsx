'use client';

export default function ExamplesCTA() {
  return (
    <a
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
    </a>
  );
}
