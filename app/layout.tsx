import "../styles/globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import ThemeProvider from "./components/ThemeProvider";

export const metadata: Metadata = {
  title: "Edgeloop",
  description: "NFL Analytics & Betting Intelligence Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
