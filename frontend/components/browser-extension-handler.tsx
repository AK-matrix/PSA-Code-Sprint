"use client";

import { useEffect } from "react";

export function BrowserExtensionHandler() {
  useEffect(() => {
    // Remove browser extension attributes that cause hydration mismatches
    const removeExtensionAttributes = () => {
      const elements = document.querySelectorAll('[bis_skin_checked]');
      elements.forEach((element) => {
        element.removeAttribute('bis_skin_checked');
      });
    };

    // Run immediately and on DOM changes
    removeExtensionAttributes();
    
    // Set up observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
          mutation.target.removeAttribute('bis_skin_checked');
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['bis_skin_checked'],
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
