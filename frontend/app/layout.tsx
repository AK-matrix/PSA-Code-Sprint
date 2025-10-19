import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSA AI Operations Co-pilot",
  description: "AI-powered Multi-Agent RAG System for Port Operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
