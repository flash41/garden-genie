import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Dedrab — De-drab your garden',
  description: 'Upload a photo of your garden and get a full AI-powered redesign — a visual render, plant list, materials guide and actionable plan.',
  openGraph: {
    title: 'Dedrab — De-drab your garden',
    description: 'Upload a photo of your garden and get a full AI-powered redesign in minutes.',
    url: 'https://dedrab.com',
    siteName: 'Dedrab',
    images: [
      {
        url: 'https://dedrab.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dedrab garden design',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dedrab — De-drab your garden',
    description: 'Upload a photo of your garden and get a full AI-powered redesign in minutes.',
    images: ['https://dedrab.com/og-image.png'],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
