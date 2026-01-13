import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Edge Loop",
  description: "Data intelligence platform with automated workflows and real-time analytics.",
  openGraph: {
    title: "Edge Loop",
    description: "Enterprise data intelligence platform.",
    type: "website",
    images: [
      {
        url: "https://replit.com/public/images/opengraph.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@replit",
    title: "Edge Loop",
    description: "Enterprise data intelligence platform.",
    images: ["https://replit.com/public/images/opengraph.png"],
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
