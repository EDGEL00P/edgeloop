import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'EdgeLoop | AI-Powered Sports Analytics',
    template: '%s | EdgeLoop',
  },
  description:
    'Real-time sports predictions and analytics powered by advanced machine learning models.',
  keywords: [
    'sports analytics',
    'AI predictions',
    'machine learning',
    'real-time odds',
    'sports betting',
  ],
  authors: [{ name: 'EdgeLoop' }],
  creator: 'EdgeLoop',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://edgeloop.ai',
    title: 'EdgeLoop | AI-Powered Sports Analytics',
    description: 'Real-time sports predictions and analytics powered by advanced ML models.',
    siteName: 'EdgeLoop',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EdgeLoop | AI-Powered Sports Analytics',
    description: 'Real-time sports predictions and analytics powered by advanced ML models.',
    creator: '@edgeloop',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0D1B2A' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1B2A' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
