import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoperasiLink",
  description: "AI-powered village supply chain platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="antialiased">
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  );
}
