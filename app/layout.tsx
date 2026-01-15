import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { AppShell } from '@/components/ui/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MeltingICE.app - Community Safety Hub',
  description: 'Know your rights. Report safely. Take action together. A community-powered platform to protect immigrant communities.',
  keywords: ['ICE tracker', 'immigration enforcement', 'community safety', 'ICE raids', 'checkpoint tracker', 'immigration rights', 'know your rights', 'immigrant advocacy'],
  authors: [{ name: 'MeltingICE.app' }],
  creator: 'MeltingICE.app',
  manifest: '/manifest.json',
  metadataBase: new URL('https://meltingice.app'),

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://meltingice.app',
    siteName: 'MeltingICE.app',
    title: 'MeltingICE.app - Community Safety Hub',
    description: 'Know your rights. Report safely. Take action together.',
    images: [
      {
        url: '/meltingice_logo.png',
        width: 1200,
        height: 630,
        alt: 'MeltingICE.app - Community Safety Hub',
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'MeltingICE.app - Community Safety Hub',
    description: 'Know your rights. Report safely. Take action together.',
    images: ['/meltingice_logo.png'],
  },

  // Icons
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },

  // Apple
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MeltingICE',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} bg-[#1a1d2e] text-white antialiased min-h-screen`}>
        <ToastProvider>
          <AppShell>
            {children}
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}


