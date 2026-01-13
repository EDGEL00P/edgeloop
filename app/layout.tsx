import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Edge Loop',
  description: 'Data intelligence platform with automated workflows and real-time analytics.',
  openGraph: {
    title: 'Edge Loop',
    description: 'Enterprise data intelligence platform.',
    type: 'website',
    images: ['https://replit.com/public/images/opengraph.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@replit',
    title: 'Edge Loop',
    description: 'Enterprise data intelligence platform.',
    images: ['https://replit.com/public/images/opengraph.png'],
  },
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${inter.variable} dark`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
