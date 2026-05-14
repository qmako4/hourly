import type { Metadata, Viewport } from 'next';
import './globals.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'hourly.',
  description: 'A radically minimal todo app.',
  applicationName: 'hourly.',
  manifest: `${BASE}/manifest.json`,
  appleWebApp: {
    capable: true,
    title: 'hourly.',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: `${BASE}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${BASE}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: `${BASE}/icon-192.png`, sizes: '192x192' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="hourly." />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
