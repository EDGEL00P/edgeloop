import "../styles/globals.css";
import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
