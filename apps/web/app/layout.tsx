import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '../styles/globals.css';
import { Providers } from './providers';

// Font variables - using system fonts as fallback
const GeistSans = { variable: 'font-sans' };
const GeistMono = { variable: 'font-mono' };

export const metadata: Metadata = {
  title: {
    default: 'Edgeloop - NFL Analytics & Betting Intelligence',
    template: '%s | Edgeloop',
  },
  description: 'High-performance NFL analytics platform with real-time predictions and betting intelligence. Built with Next.js 16 and Rust backend.',
  keywords: ['NFL analytics', 'sports betting', 'predictions', 'Kelly criterion', 'statistical analysis'],
  authors: [{ name: 'Edgeloop Team' }],
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
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://edgeloop.analytics',
    title: 'Edgeloop - NFL Analytics & Betting Intelligence',
    description: 'High-performance NFL analytics platform',
    siteName: 'Edgeloop',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edgeloop - NFL Analytics',
    description: 'High-performance NFL analytics platform',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html 
        lang="en" 
        className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
        suppressHydrationWarning
      >
        <body className="antialiased text-foreground min-h-screen overflow-x-hidden">
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
