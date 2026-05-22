import type { NextConfig } from "next";

// Content-Security-Policy — tuned for:
//   - Google Analytics (gtag.js from googletagmanager.com)
//   - Cloudflare Turnstile (challenges.cloudflare.com)
//   - Supabase storage + auth (any *.supabase.co origin)
//   - Google fonts (fonts.googleapis.com, fonts.gstatic.com)
//   - Images: self + data: (PDF rendering), blob: (canvas), and public origins used by /api/image-proxy
//
// `unsafe-inline` on script-src is required because Next.js ships small inline bootstrap
// scripts. When we add a nonce-based CSP (Sprint 3), this relaxes.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://challenges.cloudflare.com",
  "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://challenges.cloudflare.com https://ip-api.com",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Content-Security-Policy', value: CSP },
];

const nextConfig: NextConfig = {
  // reactCompiler disabled — was causing React error #310 (hook count mismatch) on restore path
  // due to interaction with Suspense boundary around ThemePreSelector in React 19
  async redirects() {
    return [
      // Canonical hostname enforcement — 301 apex (dedrab.com) → www.dedrab.com
      // for every path. Belt-and-braces alongside any platform-level redirect
      // configured in Vercel/Cloudflare. Without this, Google indexes both
      // hostnames separately and splits ranking signal across the same URL
      // (confirmed in Search Console 22 May 2026). The `has` condition matches
      // the Host header, so requests that already arrive on www are untouched.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'dedrab.com' }],
        destination: 'https://www.dedrab.com/:path*',
        permanent: true,
      },
      {
        source: '/invite',
        destination: '/next',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
