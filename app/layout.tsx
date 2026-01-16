import type { Metadata, Viewport } from 'next';
import { GeistSans, GeistMono } from 'geist/font';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from './components/Navigation';
import { Header } from '../libs/ui/src/Header';
import { NeuralWeb } from './components/NeuralWeb';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NFLScanlines } from './components/NFLScanlines';
import { NFLFieldLines } from './components/NFLFieldLines';
import { NFLHUDOverlay } from './components/NFLHUDOverlay';
import Scene3DWrapper from './components/Scene3DWrapper';

// Using Geist font for modern 2027 typography

export const metadata: Metadata = {
  title: {
    default: 'Edgeloop - Advanced NFL Analytics & Statistical Research Platform',
    template: '%s | Edgeloop'
  },
  description: 'Professional-grade NFL analytics platform for statistical research, predictive modeling, and data visualization. Advanced tools for sports researchers, data scientists, and analysts.',
  keywords: ['NFL analytics', 'sports statistics', 'predictive modeling', 'data visualization', 'sports research', 'American football analytics', 'statistical analysis'],
  authors: [{ name: 'Edgeloop Analytics Team' }],
  creator: 'Edgeloop',
  publisher: 'Edgeloop Analytics',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
    shortcut: '/favicon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://edgeloop.analytics',
    title: 'Edgeloop - Advanced NFL Analytics & Statistical Research Platform',
    description: 'Professional-grade NFL analytics platform for statistical research, predictive modeling, and data visualization.',
    siteName: 'Edgeloop',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edgeloop - Advanced NFL Analytics & Statistical Research Platform',
    description: 'Professional-grade NFL analytics platform for statistical research, predictive modeling, and data visualization.',
    images: ['/opengraph.jpg'],
  },
  verification: {
    google: 'verification-token-here',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#080808', // Onyx Black
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-nfl-dark text-white relative overflow-x-hidden perspective-container">
        <ErrorBoundary>
          <Providers>
            {/* 3D Scene Background */}
            <Scene3DWrapper />
            
            {/* NFL HUD Visual Effects Layer */}
            <div className="fixed inset-0 z-[1]">
              <NeuralWeb state="idle" intensity={0.3} />
              <NFLFieldLines />
              <NFLScanlines />
              <NFLHUDOverlay />
            </div>
            
            {/* Content Layer */}
            <div className="relative z-10">
              <Header />
              <main className="app-content max-w-7xl mx-auto px-4">{children}</main>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}