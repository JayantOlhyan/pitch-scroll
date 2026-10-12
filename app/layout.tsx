import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { AppProvider } from '@/hooks/use-app';
import { Shell } from '@/components/app-shell';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#090c0c',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: '30 MINUTE — 30 Minutes to Understand. 5 Minutes to Pitch.',
  description:
    'One unfamiliar subject. Thirty minutes to research. Five minutes to explain. A focused learning and content-creation workspace with 170+ real technical challenges.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '30 MINUTE — 30 Minutes to Understand. 5 Minutes to Pitch.',
    description:
      'One unfamiliar subject. Thirty minutes of focused research under pressure. Exactly five minutes to explain it simply on camera.',
    type: 'website',
    siteName: '30 MINUTE',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: '30 MINUTE — 30 Minutes to Understand. 5 Minutes to Pitch.',
    description:
      'One unfamiliar subject. Thirty minutes of focused research under pressure. Exactly five minutes to explain it simply on camera.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div className="loading">30 MINUTE</div>}>
          <AppProvider>
            <Shell>{children}</Shell>
          </AppProvider>
        </Suspense>
      </body>
    </html>
  );
}
