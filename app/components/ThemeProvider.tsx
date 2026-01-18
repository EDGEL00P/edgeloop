/**
 * Theme Provider Component
 * 
 * Wraps the application with next-themes ThemeProvider for dark/light/high-contrast themes.
 * Provides theme context to all child components.
 * 
 * @module app/components/ThemeProvider
 */

"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type React from "react";
import type { ReactNode } from "react";

interface ThemeProviderProps {
  readonly children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
