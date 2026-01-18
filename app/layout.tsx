/**
 * Root Layout Component
 * 
 * Provides the root HTML structure, fonts, and global providers
 * (Clerk, Theme, Toaster) for the entire application.
 * 
 * @module app/layout
 */

import "../styles/globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Oswald } from "next/font/google";
import { Toaster } from "sonner";
import ThemeProvider from "./components/ThemeProvider";
import AuthHeader from "./components/AuthHeader";
import type React from "react";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Edgeloop - Edge Intelligence Platform",
  description: "Edgeloop: Real-time NFL exploit detection, market intelligence, and edge analysis powered by advanced analytics.",
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${oswald.variable} antialiased`}>
          <ThemeProvider>
            <AuthHeader />
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
