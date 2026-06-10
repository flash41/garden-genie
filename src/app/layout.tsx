import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import Script from "next/script";
import AnalyticsConsent from "@/components/AnalyticsConsent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  // Canonical hostname. Every relative URL in metadata (per-page OG images,
  // canonical alternates, etc.) resolves against this. Set explicitly so we
  // never accidentally generate apex-host links anywhere — see
  // BACKLOG.md "Canonical hostname fix — URGENT (22 May)".
  metadataBase: new URL('https://www.dedrab.com'),
  title: {
    default: 'Dedrab — Garden Design & Layout Planning',
    template: '%s · Dedrab',
  },
  description:
    'Not sure where to start with your garden? Upload a photo and get a personalised design, planting plan and a phased weekend build, ready in minutes.',
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://www.dedrab.com',
    siteName: 'Dedrab',
    title: 'Dedrab — Garden Design & Layout Planning',
    description:
      'A personalised garden design and layout plan from a single photo. Planting guide, materials list, and phased weekend plan included.',
    images: [
      {
        url: 'https://www.dedrab.com/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Dedrab garden design and layout planning tool',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`}
      >
        {/* L3 — GDPR consent default: deny analytics_storage before any GA script can load */}
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'denied'});` }} />
        {children}
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
        <AnalyticsConsent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Dedrab',
              url: 'https://www.dedrab.com',
              logo: 'https://www.dedrab.com/dd_logo.png',
              description:
                'Garden design and layout planning for self-implementing gardeners.',
            }),
          }}
        />
      </body>
    </html>
  );
}
