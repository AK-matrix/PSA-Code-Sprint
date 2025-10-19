import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BrowserExtensionHandler } from "@/components/browser-extension-handler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PSA Alert Processing System",
  description: "Multi-Agent RAG System for Port System Alert Processing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';
                function removeExtensionAttributes() {
                  const attributes = ['bis_skin_checked', 'data-bis_skin_checked'];
                  attributes.forEach(attr => {
                    const elements = document.querySelectorAll('[' + attr + ']');
                    elements.forEach(element => {
                      element.removeAttribute(attr);
                    });
                  });
                }
                removeExtensionAttributes();
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName && mutation.attributeName.includes('bis_skin_checked')) {
                      mutation.target.removeAttribute(mutation.attributeName);
                    }
                  });
                });
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    observer.observe(document.body, {
                      attributes: true,
                      attributeFilter: ['bis_skin_checked', 'data-bis_skin_checked'],
                      subtree: true
                    });
                  });
                } else {
                  observer.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['bis_skin_checked', 'data-bis_skin_checked'],
                    subtree: true
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
        suppressHydrationWarning
      >
        <BrowserExtensionHandler />
        {children}
        <Toaster 
          position="bottom-right"
          theme="light"
          toastOptions={{
            style: {
              background: 'white',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            className: 'font-medium',
          }}
          richColors
        />
      </body>
    </html>
  );
}
